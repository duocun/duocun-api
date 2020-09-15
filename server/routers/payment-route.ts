import express from "express";
import { DB } from "../db";
import { PaymentController } from "../controllers/payment-controller";
import { Payment } from "../models/payment";

export function PaymentRouter(db: DB) {
  const router = express.Router();
  const controller = new PaymentController(new Payment(db), db);

  // input: paymentId
  router.post('/check-payment', (req, res) => { controller.checkPayment(req, res) });

  router.get('/snappay/notify', (req, res) => { controller.snappayNotify(req, res) });
  // input: paymentId, channelType, gateway
  router.post('/snappay/pay', (req, res) => { controller.snappayPay(req, res) });

  // input: paymentId, channelType, gateway: "qrcode" | "jsapi" | "h5"
  router.post('/alphapay/pay', (req, res) => { controller.alphapayPay(req, res) });
  router.post('/alphapay/notify', (req, res) => { controller.alphapayNotify(req, res) });


  // input: paymentId, cc, cvd, exp
  router.post('/moneris/pay', (req, res) => { controller.monerisPay(req, res) });
  // // input: paymentId
  // router.post('/moneris/preload', (req, res) => { controller.monerisPreload(req, res) });
  // // input: paymentId, ticket
  // router.post('/moneris/receipt', (req, res) => { controller.monerisReceipt(req, res) });

  return router;
};


