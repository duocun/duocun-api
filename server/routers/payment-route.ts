import express from "express";
import { DB } from "../db";
import { PaymentController } from "../controllers/payment-controller";

export function PaymentRouter(db: DB) {
  const router = express.Router();
  const controller = new PaymentController(db);

  router.get('/snappay/webnotify', (req, res) => { controller.snappayWebNotify(req, res) });
  router.post('/snappay/webalipay', (req, res) => { controller.snappayWebAliPay(req, res) });
  // router.get('/sync', (req, res) => { controller.sync(req, res) });

  return router;
};


