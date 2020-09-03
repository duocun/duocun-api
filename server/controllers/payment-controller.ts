import { Request, Response } from 'express';

import { Snappay, SnappayPaymentMethod } from '../models/payment/snappay';
import { Stripe } from '../models/payment/stripe';

import { TransactionAction } from '../models/transaction';
import { Order } from '../models/order';
import { DB } from '../db';
import { Log } from '../models/log';
import { IPaymentResponse } from '../models/payment/index';
import { Code } from './controller';

export class PaymentController {
    
    snappay: Snappay;
    stripe: Stripe;
    orderModel: Order;

    constructor(db: DB) {
        this.snappay = new Snappay();
        this.stripe = new Stripe();
        this.orderModel = new Order(db);
    }

    snappayPay(req: Request, res: Response) {
        const {method, paymentMethod, amount, description, paymentId, returnUrl, browserType }: any = req.body;
        Log.save({ msg: `Snappay pay req --- paymentId: ${paymentId}, ${JSON.stringify(req.body)}`});
        this.snappay.pay(
            method, 
            paymentMethod, 
            amount, 
            returnUrl, 
            description, 
            paymentId,
            browserType
        ).then((r: IPaymentResponse) => {
            Log.save({ msg: `Snappay pay rsp --- paymentId: ${paymentId}, ${JSON.stringify(r)}`});
            res.setHeader('Content-Type', 'application/json');
            res.send(r);
        });
    }

    // fix me
    getTransactionActionCode(paymentMethod:string){
        if(paymentMethod === SnappayPaymentMethod.ALI){
            return TransactionAction.PAY_BY_ALI.code;
        }else if(paymentMethod === SnappayPaymentMethod.WECHAT){
            return TransactionAction.PAY_BY_WECHAT.code;
        }else if(paymentMethod === SnappayPaymentMethod.UNIONPAY){
            return TransactionAction.PAY_BY_UNIONPAY.code;
        }else{
            return '';
        }
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
        Log.save({ msg: `Snappay notify req --- paymentId: ${paymentId}, ${JSON.stringify(req.body)}`});
        
        if (rsp && rsp.trans_status === "SUCCESS") {
          const paymentActionCode = this.getTransactionActionCode(paymentMethod); // TransactionAction.PAY_BY_WECHAT.code;
          
          this.orderModel.processAfterPay(paymentId, paymentActionCode, amount, '').then(() => {
              res.setHeader("Content-Type", "application/json");
              res.send({ code: "0" }); // must return as snappay gateway required
          });
        }
    }


    // Stripe
    stripePay(req: Request, res: Response) {
    // const appType = req.body.appType;
    const paymentActionCode = req.body.paymentActionCode;
    const paymentMethodId = req.body.paymentMethodId;
    const paymentId = req.body.paymentId;
    const merchantNames = ['Duocun Inc.']; // req.body.merchantNames
    const accountId = req.body.accountId;
    const accountName = req.body.accountName;
    const note = req.body.note;
    let amount = +req.body.amount;

    res.setHeader("Content-Type", "application/json");
    this.stripe.pay(paymentActionCode, paymentMethodId, accountId, accountName, amount, note, paymentId, merchantNames).then((rsp: any) => {
      res.send(JSON.stringify({
        code: rsp ? Code.SUCCESS : Code.FAIL,
        data: rsp,
      })); // IPaymentResponse
    });
  }

}