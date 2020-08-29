import { Md5 } from "ts-md5";
import axios from "axios";
export const SnappayMethod = {
    WEB: 'pay.webpay',
    H5: 'pay.h5pay'
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
        }else{
            return `${process.env.BACKEND_URL}/payments/snappay/webnotify`;
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
            // version: "1.0",
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

    async pay(
        // accountId: string,
        // appCode: string,
        // paymentActionCode: string,
        method: string,
        paymentMethod: string,
        amount: number,
        returnUrl: string,
        description: string,
        paymentId: string
    ) {
        const d = this.getPostData(
            paymentMethod,
            method,
            // accountId,
            paymentId,
            amount,
            returnUrl,
            description
        );
        const data = this.signPostData(d);
        return await axios.post(`https://open.snappay.ca/api/gateway`, data);
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