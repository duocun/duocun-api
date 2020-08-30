import { Model } from "./model";
import { ObjectId } from "mongodb";
import { EventLog } from "./event-log";
import { DB } from "../db";

export enum PAYMENT_METHOD {
  ALPHAPAY = "alphapay",
  SNAPPAY = "snappay",
}

export type SettingType = {
  _id: string | ObjectId;
  payment_method: PAYMENT_METHOD;
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
      setting = DEFAULT_MODEL;
      await this.insertOne(setting);
      setting = await super.findOne({});
    }
    return setting;
  }
}

export const DEFAULT_MODEL = {
  payment_method: PAYMENT_METHOD.SNAPPAY
};
