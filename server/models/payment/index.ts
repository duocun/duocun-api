import { Model, Code } from "../model";
import { IAccount, Account } from "../account";
import { IOrder, Order, OrderStatus, PaymentStatus, PaymentMethod } from "../order";
import { DB } from "../../db";
import { CurrencyType, ChannelType } from "alphapay/dist/types/global";
import { ClientCredit } from "../client-credit";
import { Config } from "../../config";
import { PaymentAction } from "../client-payment";

export interface IPaymentResponse {
  status: string;         // ResponseStatus
  code: string;           // stripe/snappay return code
  decline_code: string;   // strip decline_code
  msg: string;            // stripe/snappay retrun message
  chargeId: string;       // stripe { chargeId:x }
  url: string;            // snappay {url: data[0].h5pay_url} //  { code, data, msg, total, psn, sign }
  err: string;
}

export const ResponseStatus = {
  SUCCESS: "S",
  FAIL: "F",
};


export class Payment extends Model{
  orderModel: Order;
  clientCreditModel: ClientCredit;
  accountModel: Account;
  cfg: Config;

  constructor(dbo: DB) {
    super(dbo, 'payments');
    this.orderModel = new Order(dbo);
    this.clientCreditModel = new ClientCredit(dbo);
    this.accountModel = new Account(dbo);
    this.cfg = new Config();
  }

  getDescription(orders: IOrder[]) {
    let description = "";
    for (let order of orders) {
      for (let item of (order.items || [])) {
        let productName = item.productName;
        description += `${productName || "Unknown"} x ${item.quantity} `;
      }
    }

    if (description.length > 90) {
      description = description.substring(0, 90) + "...";
    }
    return description;
  }

  getPayable(orders: IOrder[], account: IAccount) {
    let total: number = 0;
    orders.forEach((order: IOrder) => {
      total += order.total;
    });
    // logger.info(`total order price: ${total}`);
    // logger.info(`account balalnce: ${account.balance}`)
    if (account.balance) {
      total -= Number(account.balance);
    }
    return total;
  }


  async getPaymentInfo(tokenId: string, paymentId: string) {
    const account = await this.accountModel.getAccountByToken(tokenId);
    if (!account) {
      //   logger.info("authentication failed");
      //   logger.info('---  END ALPHAPAY  ---');
      return {
        code: Code.FAIL,
        msg: "authentication failed"
      };
    }

    const orders: Array<IOrder>  = await this.orderModel.find({
      paymentId,
      status: OrderStatus.TEMP
    });

    if (!orders || !orders.length) {
    //   logger.info("orders empty");
    //   logger.info("--- END MONERIS PRELOAD ---");
      return {
        code: Code.FAIL,
        msg: "cannot find orders"
      };
    }

    const total = this.getPayable(orders, account);
    if (total <= 0) {
      //   logger.warning('Total amount is below zero');
      //   logger.info('---  END ALPHAPAY  ---');
      return {
        code: Code.FAIL,
        msg: 'total_amount_is_below_zero'
      };
    }
    return {
      code: Code.SUCCESS,
      account,
      orders,
      total
    };
  }
}