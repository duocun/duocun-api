import { Model, Code } from "../model";
import { IAccount, Account } from "../account";
import { IOrder, Order, OrderStatus, PaymentStatus, PaymentMethod } from "../order";
import { DB } from "../../db";
import { CurrencyType, ChannelType } from "alphapay/dist/types/global";
import { ClientCredit } from "../client-credit";
import Alphapay from 'alphapay';
import { Config } from "../../config";
import { PaymentAction } from "../client-payment";
import { Payment } from "./index";


export class AlphapayPayment extends Payment {
  alphapay: Alphapay;

  constructor(dbo: DB) {
    super(dbo);
    this.alphapay = new Alphapay(this.cfg.ALPHAPAY.PARTNER_CODE, this.cfg.ALPHAPAY.CREDENTIAL_CODE);
  }

  getPaymentMethod(channelType: string) {
    switch (channelType) {
      case ChannelType.ALIPAY:
        return PaymentMethod.ALI;
      case ChannelType.UNION_PAY:
        return PaymentMethod.UNION;
      case ChannelType.WECHAT:
        return PaymentMethod.WECHAT;
      default:
        return PaymentMethod.WECHAT;
    }
  }
  /*
  *        ALIPAY = "Alipay",
  *        WECHAT = "Wechat",
  *        UNION_PAY = "UnionPay"
  */
  async pay(tokenId: string, channelType: string, paymentId: string, gateway: "qrcode" | "jsapi" | "h5") {
    // logger.info("--- BEGIN ALPHA PAY---");
    // const accountModel = new Account(db);
    // const account = await this.accountModel.getCurrentUser(req, res);
    const r: any = this.getPaymentInfo(tokenId, paymentId);
    let account;
    let orders;
    let total;
    if(r.code === Code.SUCCESS){
      account = r.account;
      orders = r.orders;
      total = r.total;
    }else{
      return r; // {code, msg}
    }
    // switch (req.body.channel) {
    //   case 'alipay':
    //     channel = ChannelType.ALIPAY;
    //     break;
    //   case 'unionpay':
    //     channel = ChannelType.UNION_PAY;
    //     break;
    //   default:
    //     channel = ChannelType.WECHAT;
    // }
    // logger.info("paymentId: " + paymentId + " " + "Channel: " + channel + " " + "Gateway: " + gateway);

    try {
      await this.orderModel.validateOrders(orders);
    } catch (e) {
      //   logger.info('---  END ALPHAPAY  ---');
      return {
        code: Code.FAIL,
        msg: 'validate orders failed',
        data: e
      };
    }

    let cc = {
      accountId: account._id,
      accountName: account.username,
      total,
      paymentMethod: this.getPaymentMethod(channelType),
      note: "",
      paymentId,
      status: PaymentStatus.UNPAID
    };

    // logger.info("inserting client credit");
    await this.clientCreditModel.insertOne(cc);

    let description = this.getDescription(orders);
    // const return_url = returnUrl;   // `${process.env.FRONTEND_URL}?p=h&cId=${accountId}`;

    let resp;
    try {
      const reqData: any = {
        description,
        price: Number((total * 100).toFixed(0)),
        currency: CurrencyType.CAD,
        notify_url: `${process.env.BACKEND_URL}/payments/alphapay/notify`,
        channel: channelType
      };
      try {
        switch (gateway) {
          case "qrcode":
            resp = await this.alphapay.createQRCodePayment(paymentId, reqData);
            break;
          case "h5":
            resp = await this.alphapay.createH5Payment(paymentId, reqData);
            break;
          case "jsapi":
            resp = await this.alphapay.createJSAPIPayment(paymentId, reqData);
            break;
        }
      } catch (e) {
        // logger.error(e);
        // logger.info('---  END ALPHAPAY  ---');
        return {
          code: Code.FAIL,
          msg: 'create alphapay payment exception'
        };
      }

      if (resp.return_code != 'SUCCESS') {
        // logger.error("alphapay failed, return code: " + resp.return_code + ", message: "  + resp.return_msg)
        // logger.info('---  END ALPHAPAY  ---');
        return {
          code: Code.FAIL,
          msg: 'create alphapay payment failed'
        };
      }

      let redirectUrl = this.getRedirectUrl(channelType, paymentId, gateway);

      return {
        code: Code.SUCCESS,
        data: resp,
        redirect_url: redirectUrl,
        total
      };
    } catch (e) {
      // logger.error(e);
      // logger.info('---  END ALPHAPAY H5  ---');
      return {
        code: Code.FAIL,
        msg: 'alphapay get redirect url failed'
      };
    }
  }

  async handleNotify(notification: any) {
    // logger.info("--- BEGIN ALPHAPAY SUCCESS NOTIFICATION ---");
    // const notification: SuccessNotification = req.body;
    if (!this.alphapay.isNotificationValid(notification)) {
      // logger.info("---  END ALPHAPAY SUCCESS NOTIFICATION  ---");
      // logger.info("Alphapay notification is invalid");
      // logger.info(JSON.stringify(notification));
      return;
    }
    const paymentId = notification.partner_order_id;
    const order: IOrder = await this.orderModel.findOne({ paymentId });
    if (order && order.paymentStatus == PaymentStatus.PAID) {
      // logger.info(`Payment ID: ${paymentId} already paid`);
      // logger.info("---  END ALPHAPAY SUCCESS NOTIFICATION  ---");
      return;
    }
    await this.orderModel.processAfterPay(
      paymentId,
      PaymentAction.PAY.code,
      Number(notification.real_fee) / 100,
      ''
    );
    // logger.info('Payment successful notify to customer');
    // if (!SocketIO) {
    //   logger.warn('SocketIO is not inited ');
    // } else {
    //   const room = `payment:${order.clientId}`;
    //   logger.info(`RoomID: ${room}`);
    //   SocketIO.to(room).emit('alphapay', {
    //     paymentId,
    //     success: true
    //   });
    // }
    // logger.info("---  END ALPHAPAY SUCCESS NOTIFICATION  ---");
    return;
  }

  private getRedirectUrl(channelType: string, paymentId: string, gateway: string) {
    let redirectUrl;
    let successUrl = `${process.env.FRONTEND_URL}/payment-success?channel=${channelType}&paymentId=${paymentId}`;
    switch (gateway) {
      case "qrcode":
        redirectUrl = this.alphapay.getQRCodePaymentPageUrl(paymentId, successUrl);
        break;
      case "h5":
        redirectUrl = this.alphapay.getH5PaymentPage(paymentId, successUrl);
        break;
      case "jsapi":
        if (channelType == ChannelType.ALIPAY) {
          redirectUrl = this.alphapay.getAlipayJSAPIPaymentPageUrl(paymentId, successUrl);
        }
        else if (channelType === ChannelType.WECHAT) {
          redirectUrl = this.alphapay.getWechatJSAPIPaymentPageUrl(paymentId, successUrl);
        }
        else {
          // fix me
        }
        break;
      default: break;
    }
    return redirectUrl;
  }


}


