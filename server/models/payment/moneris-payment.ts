import { Model, Code } from "../model";
import { Account } from "../account";
import { IOrder, Order, OrderStatus, PaymentMethod, PaymentStatus} from "../order";
import { Payment } from "./index";
import { DB } from "../../db";
import MonerisHt from 'moneris-node';
import MonerisCheckout from "moneris-checkout";
import { EnvironmentType, BooleanType } from "moneris-checkout/dist/types/global";
import { Config } from "../../config";
import { PaymentAction } from "../client-payment";
import { PaymentError } from "../client-payment";
import moment from "moment";

const fe = function(arr: any,assertion: any = false){
    return Array.isArray(arr) && arr.length>0 && arr[0] ? (assertion ? arr[0]===assertion: arr[0]) : null;
}
  
const cfg = new Config();

export const moneris = new MonerisCheckout(
  cfg.MONERIS.STORE_ID,
  cfg.MONERIS.API_TOKEN,
  cfg.MONERIS.CHECKOUT_ID,
  <EnvironmentType> cfg.MONERIS.ENVIRONMENT
);

export const monerisHt = new MonerisHt({
  app_name: 'Duocun Inc',
  store_id: cfg.MONERIS.STORE_ID,
  api_token: cfg.MONERIS.API_TOKEN,
  test: false
});

export class MonerisPayment extends Payment{
    constructor(db: DB) {
        super(db);
    }

    async preload(tokenId: string, paymentId: string) {
        // logger.info("--- BEGIN ALPHA PAY---");
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
    // logger.info("--- BEGIN MONERIS PRELOAD ---");

    // const paymentId = req.body.paymentId;
    // logger.info("paymentId: " + paymentId);

    try {
      const preload = await moneris.preload(total, {
        cust_id: account._id.toString(),
        contact_details: {
          first_name: account.username,
          phone: account.phone
        },
        shipping_details: {
          address_1: `${orders[0].location.streetNumber || ""} ${orders[0].location.streetName || ""}`,
          city: orders[0].location.city || "",
          province: orders[0].location.province || "",
          country: orders[0].location.country || "",
          postal_code: orders[0].location.postalCode || ""
        }
      });
      const success: BooleanType = preload.response.success;
      if (success === BooleanType.TRUE) {
        const cc = {
          accountId: account._id,
          accountName: account.username,
          total,
          paymentMethod: PaymentMethod.CREDIT_CARD,
          note: "",
          paymentId,
          status: PaymentStatus.UNPAID
        };
        // logger.info(`ticket: ${preload.response?.ticket}`);
        // logger.info("inserting client credit");
        await this.clientCreditModel.insertOne(cc);
        // logger.info("--- END MONERIS PRELOAD ---");
        return {
          code: Code.SUCCESS,
          data: preload.response.ticket
        };
      } else {
        // logger.info("preload response returns fail");
        // logger.info("--- END MONERIS PRELOAD ---");
        return {
          code: Code.FAIL,
          data: preload
        };
      }
    } catch (e) {
      console.error(e);
    //   logger.error(e);
    //   logger.info("--- END MONERIS PRELOAD ---");
      return {
        code: Code.FAIL,
        data: e
      };
    }
  }

  async receipt(tokenId: string, paymentId: string, ticket: any) {
    // logger.info("--- BEGIN MONERIS RECEIPT ---");
    // const account = await this.getCurrentUser(req, res);
    const account = await this.accountModel.getAccountByToken(tokenId);
    if (!account) {
    //   logger.info("authentication failed");
    //   logger.info("--- END MONERIS PRELOAD ---");
      return {
        code: Code.FAIL,
        message: "authentication failed"
      };
    }

    // const paymentId = req.body.paymentId;
    // const ticket = req.body.ticket;

    // logger.info(`paymentId: ${paymentId}, ticket: ${ticket}`);
    // logger.info("send receipt request to moneris");
    const receipt = await moneris.receipt(ticket);
    const cc = await this.clientCreditModel.findOne({
      paymentId
    });
    if (!cc) {
    //   logger.info("client credit not found");
    //   logger.info("--- END MONERIS PRELOAD ---");
      return {
        code: Code.FAIL,
        message: "client credits empty"
      };
    }
    if (receipt.response.success != BooleanType.TRUE) {
    //   logger.info("moneris response does not return true");
    //   logger.info("--- END MONERIS PRELOAD ---");
      return {
        code: Code.FAIL,
        data: receipt
      };
    }
    if (!receipt.response.receipt || !receipt.response.receipt.cc || !receipt.response.receipt.cc.amount) {
    //   logger.info("moneris receipt response is invalid");
    //   logger.info("--- END MONERIS PRELOAD ---");
      return {
        code: Code.FAIL,
        data: receipt
      };
    }
    // logger.info("processAfterPay");
    await this.orderModel.processAfterPay(paymentId, PaymentAction.PAY.code, parseFloat(receipt.response.receipt?.cc?.amount || "0"), ticket);
    cc.status = PaymentStatus.PAID;
    // logger.info("set client credit status paid");
    await this.clientCreditModel.updateOne({ _id: cc._id }, cc);
    // logger.info("--- END MONERIS PRELOAD ---");
    return {
      code: Code.SUCCESS
    };
  }

  async pay(tokenId: string, paymentId: string, cc: any, cvd: any, exp: any) {
    // logger.info('--- BEGIN MONERIS HT PAY ---');
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

    if (!cc) {
        return {
          code: Code.FAIL,
          message: 'credit_cart_empty'
        };
      }
      if (!cvd) {
        return {
          code: Code.FAIL,
          message: 'cvd_empty'
        };
      }
      if (!exp) {
        return {
          code: Code.FAIL,
          message: 'exp_empty'
        };
      }
    cc = cc.replace(/\s/g, '');
    exp = exp.replace(/(\s|\/)/g, '');
    cvd = cvd.replace(/\s/g, '');
    
    if (!/^\d{12,20}$/.test(cc)) {
      return {
        code: Code.FAIL,
        msg: 'invalid_card_number'
      };
    }
    if (!/^\d{4}$/.test(exp)) {
      return {
        code: Code.FAIL,
        msg: 'invalid_exp'
      };
    }
    if (!/^\d{3}$/.test(cvd)) {
      return {
        code: Code.FAIL,
        msg: 'invalid_cvd'
      };
    }

    // logger.info("paymentId: " + paymentId);


    try {
      await this.orderModel.validateOrders(orders);
    } catch (e) {
    //   logger.info("--- END MONERIS HT PAY ---");
      return {
        code: Code.FAIL,
        data: e
      };
    }

    let clientCredit = {
      accountId: account._id,
      accountName: account.username,
      total,
      paymentMethod: PaymentMethod.CREDIT_CARD,
      note: "",
      paymentId,
      status: PaymentStatus.UNPAID
    };
    // logger.info("inserting client credit");
    await this.clientCreditModel.insertOne(clientCredit);

    let resp;
    try {
      resp = await monerisHt.send({
        type: 'purchase',
        crypt_type: 7,
        order_id: paymentId + "_" + moment().tz("America/Toronto").format("MMDDHHmmss"),
        amount: Number(total).toFixed(2),
        pan: cc,
        expdate: this.convertMMYYtoYYMM(exp),
        description: `User: ${account.username}, PaymentID: ${paymentId}, Total: ${total}, Deliver Date: ${orders[0].deliverDate}`,
        cust_id: `${account._id.toString()}`,
        cvd_info: {
          cvd_indicator: "1",
          cvd_value: cvd,
        }
      });
      
    } catch (e) {
      console.error(e);
    //   logger.error('Moneris pay error: ' + e);
    //   logger.info("--- END MONERIS HT PAY ---");
      return {
        code: Code.FAIL,
        msg: 'payment_failed'
      };
    }
    const code = fe(resp.ResponseCode);
    const status = {
        msg: fe(resp.Message),
        code,
        reference: fe(resp.ReferenceNum),
        iso: fe(resp.ISO),
        receipt: fe(resp.ReceiptId),
        raw: resp,
        isVisa: fe(resp.CardType,"V"),
        isMasterCard: fe(resp.CardType,"M"),
        isVisaDebit: fe(resp.IsVisaDebit,"true"),
        authCode: fe(resp.AuthCode),
        timeout: fe(resp.TimedOut,"true"),
        date: fe(resp.TransDate),
        time: fe(resp.TransTime)
    };
    const approved =  !status.timeout && ((code)=="00" || code ? parseInt(code)<50 : false );
    // logger.info(`Moneris response: Message: ${status.msg}, Code: ${status.code}, Reference: ${status.reference}, ISO: ${status.iso}, timeout: ${status.timeout}, Approved: ${approved}`)
    if (!approved) {
    //   logger.info('Not approved');
    //   logger.info("--- END MONERIS HT PAY ---");
      return {
        code: Code.FAIL,
        msg: this.getMonerisErrorMessage(status.code),
        mcode: {
          iso: status.iso,
          code: status.code
        }
      };
    }

    // logger.info("processAfterPay");
    await this.orderModel.processAfterPay(paymentId, PaymentAction.PAY.code, total, resp.reference);
    clientCredit.status = PaymentStatus.PAID;
    // logger.info("set client credit status paid");
    await this.clientCreditModel.updateOne({ paymentId: cc.paymentId, status: PaymentStatus.UNPAID }, clientCredit);
    // logger.info("--- END MONERIS PRELOAD ---");
    return {
      code: Code.SUCCESS,
      err: PaymentError.NONE
    };
  }


  getMonerisErrorMessage(code: string) {
    let codeTable = {
      "051": "card_expired",
      "057": "card_stolen",
      "058": "card_invalid_status",
      "059": "card_restricted",
      "076": "card_low_funds",
      "105": "card_not_supported",
      "200": "card_invalid_account",
      "208": "card_invalid_expiration_date",
      "408": "card_limited",
      "475": "card_invalid_expiration_date",
      "476": "card_declined",
      "477": "card_invalid_number",
      "481": "card_declined",
      "482": "card_expired",
      "486": "cvv_invalid",
      "487": "cvv_invalid",
      "489": "cvv_invalid",
      "490": "cvv_invalid"
    };
    // @ts-ignore
    return codeTable[code] || "payment_failed"
  }

  convertMMYYtoYYMM(exp: string) {
    return `${exp.charAt(2)}${exp.charAt(3)}${exp.charAt(0)}${exp.charAt(1)}`
  }
}