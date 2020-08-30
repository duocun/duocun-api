import { Md5 } from "ts-md5";
import axios from "axios";
import { IPaymentResponse, ResponseStatus } from "./index";
import { PaymentError } from "../client-payment";

export const SnappayMethod = {
    WEB: 'pay.webpay',
    H5: 'pay.h5pay',
    QRCODE: 'pay.qrcodepay'
}

export const SnappayPaymentMethod = {
    ALI: 'ALIPAY',
    WECHAT: 'WECHATPAY',
    UNIONPAY: 'UNIONPAY_QR'
}

export class Snappay {
    
    getNotifyUrl(method: string){
        if(method === SnappayMethod.WEB){
            return `${process.env.BACKEND_URL}/payments/snappay/webnotify`;
        }else if(method === SnappayMethod.H5){
            return `${process.env.BACKEND_URL}/payments/snappay/h5notify`;
        }else if(method === SnappayMethod.QRCODE){
            return `${process.env.BACKEND_URL}/payments/snappay/qrcodenotify`;
        }else{
            return `${process.env.BACKEND_URL}/payments/snappay/qrcodenotify`;
        }
    }

    getPostData(
        paymentMethod: string,
        method: string,
        paymentId: string,
        amount: number,
        returnUrl: string,
        description: string
    ) {
        const return_url = returnUrl;                                   // `${process.env.FRONTEND_URL}?p=h&cId=${accountId}`;
        const notify_url = this.getNotifyUrl(method);                   // `${process.env.BACKEND_URL}/payments/notify`;
        const trans_amount = Math.round(amount * 100) / 100;

        return {
            // the order matters
            app_id: process.env.SNAPPAY_APP_ID,
            charset: "UTF-8",
            description: description,
            format: "JSON",
            merchant_no: process.env.SNAPPAY_MERCHANT_ID,
            method,
            notify_url,
            out_order_no: paymentId,
            payment_method: paymentMethod,
            return_url,
            trans_amount,
            trans_currency: 'CAD',
            version: "1.0"
        };
    }

    createLinkstring(data: any) {
        let s = "";
        Object.keys(data).map((k) => {
            s += k + "=" + data[k] + "&";
        });
        return s.substring(0, s.length - 1);
    }

    signPostData(data: any) {
        const sParams = this.createLinkstring(data);
        const encrypted = Md5.hashStr(sParams + process.env.SNAPPAY_MD5_KEY);
        data["sign"] = encrypted;
        data["sign_type"] = "MD5";
        return data;
    }

    getPaymentError(paymentMethod: string){
        let err = PaymentError.NONE;
        if(paymentMethod === SnappayPaymentMethod.ALI){
            err = PaymentError.ALIPAY_FAIL;
        }else if(paymentMethod === SnappayPaymentMethod.WECHAT){
            err = PaymentError.WECHATPAY_FAIL;
        }else if(paymentMethod === SnappayPaymentMethod.UNIONPAY){
            err = PaymentError.UNIONPAY_FAIL;
        }else{
            // pass
        }
        return err;
    }

    getPaymentUrl(method: string, data: any){
        if(method === 'pay.webpay'){
            return data && data[0] ? data[0].webpay_url : ""
        }else if(method === 'pay.h5pay') {
            return data && data[0] ? data[0].h5pay_url : ""
        }else if(method === SnappayMethod.QRCODE){
            return data && data[0] ? data[0].qrcode_url : ""
        }else{
            return '';
        }
    }

    /**
     * 
     * @param method 
     * @param paymentMethod 
     * @param amount 
     * @param returnUrl 
     * @param description 
     * @param paymentId 
     * 
     * return {
     *  "code":"0",
     *  "data":[{"webpay_url":"https://globalmapi.alipay.com/gateway.do?","out_order_no":"5f4aa50764e530467dfacd94","trans_status":"USERPAYING"}],
     *  "msg":"success",
     *  "psn":"08291857122767208110",
     *  "sign":"212a75e2791f04afc5132c582e4ce1b2",
     *  "total":1}
     */
    async pay(
        method: string,
        paymentMethod: string,
        amount: number,
        returnUrl: string,
        description: string,
        paymentId: string
    ): Promise<IPaymentResponse> {
        const d = this.getPostData(
            paymentMethod,
            method,
            paymentId,
            amount,
            returnUrl,
            description
        );
        const data = this.signPostData(d);
        const r = await axios.post(`https://open.snappay.ca/api/gateway`, data);

        const ret = r.data;
        const code = ret ? ret.code : "";
        const status = ret.msg === 'success'? ResponseStatus.SUCCESS : ResponseStatus.FAIL;
        const msg = "msg:" + (ret ? ret.msg : "N/A");

        return {
          status,
          code,             // stripe/snappay code
          decline_code: "", // stripe decline_code
          msg,              // stripe/snappay retrun message
          chargeId: "",     // stripe only { chargeId:x }
          url: this.getPaymentUrl(method, ret.data),
          err: ret.msg === 'success' ? PaymentError.NONE : this.getPaymentError(paymentMethod)
        };
    }

    // async handleNotify(paymentId: string, amount: number) {
    //     // logger.info("********** BEGIN SNAPPAY NOTIFY PROCESS ************");
    //     const paymentActionCode = TransactionAction.PAY_BY_WECHAT.code;
    //     // logger.info("Call process after pay");
    //     await this.orderEntity.processAfterPay(paymentId, paymentActionCode, amount, '');
    //     // logger.info("********** END SNAPPAY NOTIFY PROCESS ************");
    //     return;
    //   }
}