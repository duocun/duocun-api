import { Request, Response } from 'express';

import { TransactionAction } from '../models/transaction';
import { Order, PaymentStatus } from '../models/order';
import { DB } from '../db';
import { Log } from '../models/log';
import { IPaymentResponse } from '../models/payment/index';
import { Account } from '../models/account';

import { SnappayPayment } from '../models/payment/snappay-payment';
import { AlphapayPayment } from '../models/payment/alphapay-payment';
import { MonerisPayment } from '../models/payment/moneris-payment';
import { Code, Controller } from './controller';

export class PaymentController extends Controller {

  snappay: SnappayPayment;
  alphapay: AlphapayPayment;
  moneris: MonerisPayment;

  orderModel: Order;
  accountModel: Account;

  constructor(model: any, db: DB) {
    super(model, db);
    this.snappay = new SnappayPayment();
    this.alphapay = new AlphapayPayment(db);
    this.moneris = new MonerisPayment(db);

    this.orderModel = new Order(db);
    this.accountModel = new Account(db);
  }

  snappayPay(req: Request, res: Response) {
    const { method, paymentMethod, amount, description, paymentId, returnUrl, browserType }: any = req.body;
    console.log(`Snappay pay req --- paymentId: ${paymentId}, ${JSON.stringify(req.body)}`)
    Log.save({ msg: `Snappay pay req --- paymentId: ${paymentId}, ${JSON.stringify(req.body)}` });
    this.snappay.pay(
      method,
      paymentMethod,
      amount,
      returnUrl,
      description,
      paymentId,
      browserType
    ).then((r: IPaymentResponse) => {
      console.log(`Snappay pay rsp --- paymentId: ${paymentId}, ${JSON.stringify(r)}`)
      Log.save({ msg: `Snappay pay rsp --- paymentId: ${paymentId}, ${JSON.stringify(r)}` });
      res.setHeader('Content-Type', 'application/json');
      res.send(r);
    });
  }



  snappayNotify(req: Request, res: Response) {
    const rsp = req.body;
    // console.log('snappayNotify trans_status:' + b.trans_status);
    // console.log('snappayNotify trans_no:' + b.trans_no);
    // console.log('snappayNotify out_order_no' + b.out_order_no);
    // console.log('snappayNotify customer_paid_amount' + b.customer_paid_amount);
    // console.log('snappayNotify trans_amount' + b.trans_amount);
    const paymentMethod = req.body.payment_method;
    const amount = Math.round(+req.body.trans_amount * 100) / 100;
    const paymentId = rsp ? rsp.out_order_no : "";

    console.log(`Snappay notify req --- paymentId: ${paymentId}, ${JSON.stringify(req.body)}`);


    Log.save({ msg: `Snappay notify req --- paymentId: ${paymentId}, ${JSON.stringify(req.body)}` });

    if (rsp && rsp.trans_status === "SUCCESS") {
      const paymentActionCode = this.snappay.getTransactionActionCode(paymentMethod); // TransactionAction.PAY_BY_WECHAT.code;
      console.log(`before process pay`);
      this.orderModel.processAfterPay(paymentId, paymentActionCode, amount, '').then(() => {
        console.log('after process pay');
        res.setHeader("Content-Type", "application/json");
        res.send({ code: "0" }); // must return as snappay gateway required
      });
    }
  }

  // gateway --- qrcode, h5, jsapi
  async alphapayPay(req: Request, res: Response) {
    const tokenId: any = this.getAuthToken(req);
    const { paymentId, channelType, gateway } = req.body;
    const rsp = await this.alphapay.pay(tokenId, channelType, paymentId, gateway);
    res.send(rsp);
  }

  /* From official alphapay doc:
  *     The system will retry the notification up to 3 times
  */
  async alphapayNotify(req: Request, res: Response) {
    this.alphapay.handleNotify(req.body);
    res.send();
  }


  async monerisPreload(req: Request, res: Response) {
    const tokenId: any = this.getAuthToken(req);
    const { paymentId } = req.body;
    const r = await this.moneris.preload(tokenId, paymentId);
    res.send(r);
  }

  async monerisReceipt(req: Request, res: Response) {
    // logger.info("--- BEGIN MONERIS RECEIPT ---");
    const tokenId: any = this.getAuthToken(req);
    const { paymentId, ticket } = req.body;
    const r = await this.moneris.receipt(tokenId, paymentId, ticket);
    res.send(r);
  }

  async monerisPay(req: Request, res: Response) {
    const tokenId: any = this.getAuthToken(req);
    const { paymentId, cc, cvd, exp } = req.body;
    const r = await this.moneris.pay(tokenId, paymentId, cc, cvd, exp);
    res.send(r);
  }

  // public
  async checkPayment(req: Request, res: Response) {
    const tokenId: any = this.getAuthToken(req);
    const paymentId = req.body.paymentId;

    const account = await this.accountModel.getAccountByToken(tokenId);

    if (!account) {
      return res.json({
        code: Code.FAIL,
        msg: 'account_empty'
      });
    }
    if (!paymentId) {
      return res.json({
        code: Code.FAIL,
        msg: 'payment_id_empty'
      });
    }
    const orders = await this.orderModel.find({ paymentId, clientId: account._id.toString() });
    if (!orders || !orders.length) {
      return res.json({
        code: Code.FAIL,
        msg: 'order_empty'
      });
    }
    if (orders[0].paymentStatus == PaymentStatus.PAID) {
      return res.json({
        code: Code.SUCCESS
      });
    } else {
      return res.json({
        code: Code.FAIL,
        msg: 'order_unpaid'
      });
    }
  }
}