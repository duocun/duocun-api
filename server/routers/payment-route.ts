import express from "express";
import { DB } from "../db";
import { PaymentController } from "../controllers/payment-controller";

export function PaymentRouter(db: DB) {
  const router = express.Router();
  const controller = new PaymentController(db);

  router.get('/snappay/notify', (req, res) => { controller.snappayNotify(req, res) });

  // snappayPay
  // description: if orders > 0 it means buy goods, if orders == null it means add credit
  // Input:
  // @deprecated paymentActionCode --- [string] 'P' for purchase good, 'A' for add credit
  // @deprecated appCode --- [number], 123 for Grocery, 122 for Food Delivery
  // @deprecated accountId --- [string] client account Id;
  // amount --- [number] payable = purchase amount - balance
  // returnUrl --- [string]
  // paymentId --- [string]     (optional for add credit)
  // @deprecated merchantNames --- [string[]]  (optional for add credit)
  //
  // Return: {err, {url}}, then wait snappy post notify
  router.post('/snappay/pay', (req, res) => { controller.snappayPay(req, res) });


  // Input:
  // paymentActionCode --- [string] 'P' for purchase good, 'A' for add credit
  // paymentMethodId = [string] get from stripe;
  // accountId --- [string] client account Id;
  // accountName --- [string]
  // amount --- [number] client payable
  // note --- [string]
  // paymentId --- [string]     (optional for add credit)
  // merchantNames --- [string[]]  (optional for add credit)
  // Return: None
  router.post('/stripe/pay', (req, res) => { controller.stripePay(req, res) });

  return router;
};


