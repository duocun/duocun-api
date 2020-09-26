import express from 'express';
import { Model } from "./model";
import { ObjectId } from "mongodb";
import { EventLog } from "./event-log";
import { DB } from "../db";

export enum PAYMENT_GATEWAY_VENDOR {
  ALPHAPAY = "alphapay",
  SNAPPAY = "snappay",
}

export type SettingType = {
  _id: string | ObjectId;
  paymentGatewayVendor: PAYMENT_GATEWAY_VENDOR;
};

export class Setting extends Model {
  eventLogModel: EventLog;
  constructor(dbo: DB) {
    super(dbo, "setting");
    this.eventLogModel = new EventLog(dbo);
  }

  async findOne() {
    let setting = await super.findOne({});
    if (!setting) {
      setting = DEFAULT_PAYMENT_GATEWAY_VENDOR;
      await this.insertOne(setting);
      setting = await super.findOne({});
    }
    return setting;
  }

  async getPaymentGatewayVendor(req: express.Request, res: express.Response) {
    const setting = await this.findOne();
    return res.json({
      paymentGatewayVendor: setting?.paymentGatewayVendor || PAYMENT_GATEWAY_VENDOR.SNAPPAY
    });
  }
}

export const DEFAULT_PAYMENT_GATEWAY_VENDOR = {
  paymentGatewayVendor: PAYMENT_GATEWAY_VENDOR.SNAPPAY
};
