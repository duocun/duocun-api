import { Injectable } from '@angular/core';
import { EntityService } from '../entity.service';
import { AuthService } from '../account/auth.service';
import { HttpClient } from '../../../node_modules/@angular/common/http';
import { Observable } from '../../../node_modules/rxjs';
import { IOrder } from '../order/order.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentService extends EntityService {
  url;
  constructor(
    public authSvc: AuthService,
    public http: HttpClient,
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'ClientPayments';
  }

  getSession(): Observable<any> {
    const url = this.url + '/session';
    return this.doGet(url);
  }

  stripeCharge( amount: number, merchantName: string, token: string): Observable<any> {
    const url = this.url + '/stripeCharge';
    return this.doPost(url, {token: token, amount: amount, merchantName: merchantName});
  }
  // description: b.merchantName,
  // method: 'pay.webpay',
  // merchant_no: this.cfg.SNAPPAY.MERCHANT_ID,
  // out_order_no: b.orderId,
  // payment_method: b.paymentMethod, // ALIPAY, UNIONPAY
  // trans_amount: b.amount

  snappayCharge( amount: number, merchantName: string, orderId: string, paymentMethod: string): Observable<any> {
    const url = this.url + '/snappayCharge';
    return this.doPost(url, {orderId: orderId,
      amount: amount,
      merchantName: merchantName,
      paymentMethod: paymentMethod});
  }

  refund(chargeId: string): Observable<any> {
    const url = this.url + '/refund';
    return this.doPost(url, {chargeId: chargeId});
  }
}
