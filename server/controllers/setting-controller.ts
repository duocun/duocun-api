import { Request, Response } from "express";
import { getLogger } from "../lib/logger";
import path from "path";
import { Controller, Code } from "./controller";
import { DB } from "../db";
import { Setting } from "../models/setting";


const logger = getLogger(path.basename(__filename));

export class SettingController extends Controller {
  model: Setting;

  constructor(model: Setting, db: DB) {
    super(model, db);
    this.model = model;
  }

  async show(req: Request, res: Response) {
    let setting;
    try {
      setting = await this.model.findOne();
      return res.json({
        code: Code.SUCCESS,
        data: setting,
      });
    } catch (e) {
      return res.json({
        code: Code.FAIL,
        message: e.message,
      });
    }
  }

}
