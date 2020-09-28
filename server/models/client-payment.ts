import { DB } from "../db";
import { Model } from "./model";
import { Request, Response } from "express";
import { Entity } from "../entity";
import { Config } from "../config";
import { IncomingMessage } from "http";
import https from "https";
// import NodeRSA from 'node-rsa';
import { Md5 } from "ts-md5";
import moment, { now } from "moment";
import {
  Order,
  OrderType,
  PaymentStatus,
  PaymentMethod,
  OrderStatus,
} from "../models/order";
import { Transaction, TransactionAction, IDbTransaction } from "./transaction";
import { Merchant } from "./merchant";
import { ClientCredit } from "./client-credit";
import { CellApplication, CellApplicationStatus } from "./cell-application";
import { EventLog } from "./event-log";
import { ObjectID, Logger } from "mongodb";
import { Account } from "./account";
import { SystemConfig } from "./system-config";

import log from "../lib/logger";
import logger from "../lib/logger";

const CASH_BANK_ID = "5c9511bb0851a5096e044d10";
const CASH_BANK_NAME = "Cash Bank";
const TD_BANK_ID = "5c95019e0851a5096e044d0c";
const TD_BANK_NAME = "TD Bank";
const SNAPPAY_BANK_ID = "5e60139810cc1f34dea85349";
const SNAPPAY_BANK_NAME = "SnapPay Bank";

// var fs = require('fs');
// var util = require('util');
// // var log_file = fs.createWriteStream('~/duocun-debug.log', {flags : 'w'}); // __dirname +
// var log_stdout = process.stdout;

// console.log = function (d: any) { //
//   // log_file.write(util.format(d) + '\n');
//   log_stdout.write(util.format(d) + '\n');
// };
export const PaymentError = {
  NONE: "N",
  PHONE_EMPTY: "PE",
  LOCATION_EMPTY: "LE",
  DUPLICATED_SUBMIT: "DS",
  CART_EMPTY: "CE",
  BANK_CARD_EMPTY: "BE",
  INVALID_BANK_CARD: "IB",
  BANK_CARD_FAIL: "BF",

  WECHATPAY_FAIL: "WF",
  ALIPAY_FAIL: "AF",
  UNIONPAY_FAIL: "UF",

  CREATE_BANK_CUSTOMER_FAIL: "CBCF",
  BANK_INSUFFICIENT_FUND: "BIF",
  BANK_CARD_DECLIEND: "BCD",
  INVALID_ACCOUNT: "IA",
  BANK_AUTHENTICATION_REQUIRED: "BAR",
  PAYMENT_METHOD_ID_MISSING: "IDM",
  INVALID_ORDER: "IO" // when product stock is out or product is deleted just after order has placed
};

export const PaymentAction = {
  PAY: { code: "P", text: "Pay" },
  ADD_CREDIT: { code: "A", text: "Add Credit" },
};

export const ResponseStatus = {
  SUCCESS: "S",
  FAIL: "F",
};

export interface IPaymentResponse {
  status: string; // ResponseStatus
  code: string; // stripe/snappay return code
  decline_code: string; // strip decline_code
  msg: string; // stripe/snappay retrun message
  chargeId: string; // stripe { chargeId:x }
  url: string; // snappay {url: data[0].h5pay_url} //  { code, data, msg, total, psn, sign }
}



export class ClientPayment extends Model {
  cfg: Config;
  orderEntity: Order;
  transactionModel: Transaction;
  merchantModel: Merchant;
  clientCreditModel: ClientCredit;
  cellApplicationModel: CellApplication;
  eventLogModel: EventLog;
  accountModel: Account;
  cfgModel: SystemConfig;

  constructor(dbo: DB) {
    super(dbo, "client_payments");
    this.accountModel = new Account(dbo);
    this.orderEntity = new Order(dbo);
    this.merchantModel = new Merchant(dbo);
    this.transactionModel = new Transaction(dbo);
    this.clientCreditModel = new ClientCredit(dbo);
    this.cellApplicationModel = new CellApplication(dbo);
    this.eventLogModel = new EventLog(dbo);
    this.cfgModel = new SystemConfig(dbo);
    this.cfg = new Config();
  }

  // // paymentActionCode --- code of PaymentAction
  // async payBySnappay(paymentActionCode: string, appCode: string, accountId: string, amount: number, returnUrl: string, paymentId: string, merchantNames:string[]) {
  //   if (paymentActionCode === PaymentAction.PAY.code) {
  //     const description: any = 'Duocun Inc.'; // (merchantNames && merchantNames.length>0) ? merchantNames.join(',') : 'N/A';
  //     // returnUrl = 'https://duocun.com.cn/cell?clientId=' + clientId + '&paymentMethod=' + paymentMethod + '&page=application_form';

  //     const orders = await this.orderEntity.find({ paymentId, status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED] }, paymentStatus: { $ne: PaymentStatus.PAID }});

  //     try {
  //       await this.orderEntity.validateOrders(orders);
  //     } catch (e) {
  //       return {
  //         err: PaymentError.INVALID_ORDER,
  //         data: e
  //       }
  //     }

  //     const rsp: any = await this.snappayPay(
  //       accountId,
  //       appCode,
  //       paymentActionCode,
  //       amount,
  //       returnUrl,
  //       description,
  //       paymentId
  //     );

  //     if (rsp && rsp.status === ResponseStatus.FAIL) {
  //       return { ...rsp, err: PaymentError.WECHATPAY_FAIL };
  //     } else {
  //       return { ...rsp, err: PaymentError.NONE };
  //     }
  //   } else {
  //     // to be done
  //     return { status: ResponseStatus.FAIL, err: PaymentError.BANK_CARD_DECLIEND };
  //     // add credit
  //     // if (amount > 0) {
  //     //   const paymentId = new ObjectID().toString();
  //     //   const cc = {
  //     //     accountId,
  //     //     accountName,
  //     //     total: Math.round(amount * 100) / 100,
  //     //     paymentMethod,
  //     //     note,
  //     //     paymentId,
  //     //     status: PaymentStatus.UNPAID,
  //     //   };

  //     //   this.clientCreditModel.insertOne(cc).then((c) => {
  //     //     // returnUrl = 'https://duocun.com.cn/cell?clientId=' + accountId + '&paymentMethod=' + paymentMethod + '&page=application_form';
  //     //     this.snappayPay(
  //     //       accountId,
  //     //       appCode,
  //     //       paymentActionCode,
  //     //       amount,
  //     //       "Add Credit",
  //     //       paymentId
  //     //     ).then((rsp: any) => {
  //     //       if (rsp && rsp.status === ResponseStatus.FAIL) {
  //     //         const r = { ...rsp, err: PaymentError.WECHATPAY_FAIL };
  //     //         res.send(JSON.stringify(r, null, 3)); // IPaymentResponse
  //     //       } else {
  //     //         const r = { ...rsp, err: PaymentError.NONE };
  //     //         res.send(JSON.stringify(r, null, 3)); // IPaymentResponse
  //     //       }
  //     //     });
  //     //   });
  //     // } else {
  //     //   res.send(JSON.stringify(null, null, 3));
  //     // }
  //   }
  // }


  // // appCode --- '122':grocery, '123':food delivery
  // // paymentActionCode --- P: Pay, A: Add credit
  // // paymentId --- paymentId represent a batch of orders
  // getSnappayData(
  //   appCode: string,
  //   paymentActionCode: string,
  //   accountId: string,
  //   paymentId: string,
  //   amount: number,
  //   returnUrl: string,
  //   description: string
  // ) {
  //   // const cfgs = await this.cfgModel.find({});
  //   // const cfg = cfgs[0];
  //   // const method = cfg.snappay.methods.find((m: any) => m.code = 'WECHATPAY');
  //   // const app = method.apps.find((a: any) => a.code === appCode);
  //   // const notify_url = app ? app.notifyUrl : ''; // 'https://duocun.com.cn/api/ClientPayments/notify';
  //   // const returnUrl = app ? app.returnUrls.find((r: any) => r.action === paymentActionCode) : { url: '' }; 'https://duocun.ca/grocery?p=h&cId='
  //   // const return_url = returnUrl.url + accountId; // 'https://duocun.ca/grocery?p=h&cId=' + accountId;
  //   const return_url = returnUrl ? returnUrl : `${process.env.FRONTEND_URL}/grocery?p=h&cId=${accountId}`;
  //   const notify_url = `${process.env.BACKEND_URL}/ClientPayments/notify`;
  //   const trans_amount = Math.round(amount * 100) / 100;

  //   return {
  //     // the order matters
  //     app_id: this.cfg.SNAPPAY.APP_ID, // Madatory
  //     charset: "UTF-8", // Madatory
  //     description: description, // Service Mandatory
  //     format: "JSON", // Madatory
  //     merchant_no: this.cfg.SNAPPAY.MERCHANT_ID, // Service Mandatory
  //     method: "pay.h5pay", // pc+wechat: 'pay.qrcodepay', // PC+Ali: 'pay.webpay' qq browser+Wechat: pay.h5pay,
  //     notify_url, // 'https://duocun.com.cn/api/ClientPayments/notify',
  //     out_order_no: paymentId, // Service Mandatory
  //     payment_method: "WECHATPAY", // paymentMethod, // WECHATPAY, ALIPAY, UNIONPAY
  //     return_url,
  //     trans_amount, // Service Mandatory
  //     // trans_currency: 'CAD',
  //     version: "1.0", // Madatory
  //   };
  // }

  async addLogToDB(accountId: string, type: string, code: string, message: string) {
    const eventLog = {
      accountId,
      type,
      code: code,
      decline_code: "",
      message,
      created: moment().toISOString(),
    };
    await this.eventLogModel.insertOne(eventLog);
    return;
  }

  // // This request could response multiple times !!!
  // async processSnappayNotify(paymentId: string, amount: number) {
  //   logger.info("********** BEGIN SNAPPAY NOTIFY PROCESS ************");
  //   const paymentActionCode = TransactionAction.PAY_BY_WECHAT.code;
  //   logger.info("Call process after pay");
  //   await this.orderEntity.processAfterPay(paymentId, paymentActionCode, amount, '');
  //   logger.info("********** END SNAPPAY NOTIFY PROCESS ************");
  //   return;
  // }

  // // return {status, code, declient_code, msg, chargeId, url}
  // snappayPay(
  //   accountId: string,
  //   appCode: string,
  //   paymentActionCode: string,
  //   amount: number,
  //   returnUrl: string,
  //   description: string,
  //   paymentId: string
  // ) {
  //   const self = this;

  //   return new Promise((resolve, reject) => {
      
  //     const data = this.getSnappayData(
  //       appCode,
  //       paymentActionCode,
  //       accountId,
  //       paymentId,
  //       amount,
  //       returnUrl,
  //       description
  //     );
  //     const params = this.snappaySignParams(data);
  //     const options = {
  //       hostname: "open.snappay.ca",
  //       port: 443,
  //       path: "/api/gateway",
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json", // 'Content-Length': Buffer.byteLength(data)
  //       },
  //     };

  //     const message = "paymentId:" + paymentId + ", params:" + JSON.stringify(params)
  //     this.addLogToDB(accountId, "snappay req", '', message).then(() => { });

  //     try {
  //       const post_req = https.request(options, (res: IncomingMessage) => {
  //         let ss = "";
  //         res.on("data", (d) => {
  //           ss += d;
  //         });
  //         res.on("end", (r: any) => {
  //           if (ss) { // { code, data, msg, total, psn, sign }
  //             const ret = JSON.parse(ss); // s.data = {out_order_no:x, merchant_no:x, trans_status:x, h5pay_url}
  //             const code = ret ? ret.code : "";
  //             const message = "sign:" + (ret ? ret.sign : "N/A") + ", msg:" + (ret ? ret.msg : "N/A");
  //             const rsp: IPaymentResponse = {
  //               status: ret && ret.msg === "success" ? ResponseStatus.SUCCESS : ResponseStatus.FAIL,
  //               code, // stripe/snappay code
  //               decline_code: "", // stripe decline_code
  //               msg: message, // stripe/snappay retrun message
  //               chargeId: "", // stripe { chargeId:x }
  //               url: ret.data && ret.data[0] ? ret.data[0].h5pay_url : "", // snappay data[0].h5pay_url
  //             };
  //             if (ret && ret.msg === "success") {
  //               resolve(rsp);
  //             } else {
  //               this.addLogToDB(accountId, "snappay rsp", '', message).then(() => {
  //                 resolve(rsp);
  //               });
  //             }
  //           } else {
  //             const rsp: IPaymentResponse = {
  //               status: ResponseStatus.FAIL,
  //               code: "UNKNOWN_ISSUE", // snappay return code
  //               decline_code: "", // stripe decline_code
  //               msg: "UNKNOWN_ISSUE", // snappay retrun message
  //               chargeId: "", // stripe { chargeId:x }
  //               url: "", // for snappay data[0].h5pay_url
  //             };
  //             resolve(rsp);
  //           }
  //         });
  //       });
  
  //       post_req.on("error", (error: any) => {
  //         const message = JSON.stringify(error);
  //         self.addLogToDB(accountId, 'snappay error', '', message).then(() => {
  //           // Reject on request error.
  //           const rsp: IPaymentResponse = {
  //             status: ResponseStatus.FAIL,
  //             code: "UNKNOWN_ISSUE", // snappay return code
  //             decline_code: "", // stripe decline_code
  //             msg: message, // snappay retrun message
  //             chargeId: "", // stripe { chargeId:x }
  //             url: "", // for snappay data[0].h5pay_url
  //           };
  //           resolve(rsp);
  //         });
  
  //       });
  //       post_req.write(JSON.stringify(params));
  //       post_req.end();
  //     } catch (e) {
  //       console.error(e);
  //       resolve({
  //         status: ResponseStatus.FAIL,
  //         code: "UNKNOWN_ISSUE",
  //         decline_code: "",
  //         msg: e,
  //         chargeId: "",
  //         url: ""
  //       });
  //     }
  //   });
  // }



  getChargeSummary(orders: any[]) {
    let price = 0;
    let cost = 0;

    if (orders && orders.length > 0) {
      orders.map((order: any) => {
        order.items.map((x: any) => {
          price += x.price * x.quantity;
          cost += x.cost * x.quantity;
        });
      });
    }

    return { price, cost };
  }


  // createLinkstring(data: any) {
  //   let s = "";
  //   Object.keys(data).map((k) => {
  //     s += k + "=" + data[k] + "&";
  //   });
  //   return s.substring(0, s.length - 1);
  // }

  


}
