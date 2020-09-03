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

export interface IStripeError {
  type: string;
  code: string;
  decline_code: string;
  message: string;
  param: string;
  payment_intent: any;
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
  
}
