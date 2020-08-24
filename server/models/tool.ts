import { Request, Response } from "express";
import fs from "fs";
import moment from 'moment';
import { ObjectID } from "mongodb";
import { createObjectCsvWriter } from 'csv-writer';

import { DB } from "../db";
import { ILocation } from "./location";
import { OrderSequence } from "./order-sequence";
import { Merchant, IPhase, IMerchant, IDbMerchant } from "./merchant";
import { Account, IAccount } from "./account";
import { Transaction, ITransaction, TransactionAction } from "./transaction";
import { Product, IProduct } from "./product";
import { CellApplication } from "./cell-application";
import { ClientCredit } from "./client-credit";
import { EventLog } from "./event-log";

const CASH_ID = '5c9511bb0851a5096e044d10';
const CASH_NAME = 'Cash';
const BANK_ID = '5c95019e0851a5096e044d0c';
const BANK_NAME = 'TD Bank';

const CASH_BANK_ID = '5c9511bb0851a5096e044d10';
const CASH_BANK_NAME = 'Cash Bank';
const TD_BANK_ID = '5c95019e0851a5096e044d0c';
const TD_BANK_NAME = 'TD Bank';
const SNAPPAY_BANK_ID = '5e60139810cc1f34dea85349';
const SNAPPAY_BANK_NAME = 'SnapPay Bank';

export class Tool {
    private productModel: Product;
    private sequenceModel: OrderSequence;
    private merchantModel: Merchant;
    private accountModel: Account;
    private transactionModel: Transaction;
    private cellApplicationModel: CellApplication;
    clientCreditModel: ClientCredit;
    eventLogModel: EventLog;
  
    constructor(dbo: DB) {
      this.productModel = new Product(dbo);
      this.sequenceModel = new OrderSequence(dbo);
      this.merchantModel = new Merchant(dbo);
      this.accountModel = new Account(dbo);
      this.transactionModel = new Transaction(dbo);
      this.cellApplicationModel = new CellApplication(dbo);
      this.clientCreditModel = new ClientCredit(dbo);
      this.eventLogModel = new EventLog(dbo);
  }

}