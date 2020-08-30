import express, { Request, Response } from "express";
import path from "path";
import { DB } from "../db";
import { Setting } from "../models/setting";
import { getLogger } from "../lib/logger";
import { SettingController } from "../controllers/setting-controller";

const logger = getLogger(path.basename(__filename));

export const SettingRouter = (db: DB) => {
  const router = express.Router();
  const model = new Setting(db);
  const controller = new SettingController(model, db);

  router.get("/", async (req, res) => {
    await controller.show(req, res);
  });

  return router;
}
