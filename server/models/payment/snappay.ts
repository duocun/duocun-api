import { Md5 } from "ts-md5";
import axios from "axios";
import { IPaymentResponse, ResponseStatus } from "./index";
import { PaymentError } from "../client-payment";
import { Log } from '../log';

import https from 'https';
import { IncomingMessage } from "http";

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
    
    // getNotifyUrl(method: string){
    //     if(method === SnappayMethod.WEB){
    //         return `${process.env.BACKEND_URL}/payments/snappay/webnotify`;
    //     }else if(method === SnappayMethod.H5){
    //         return `${process.env.BACKEND_URL}/payments/snappay/h5notify`;
    //     }else if(method === SnappayMethod.QRCODE){
    //         return `${process.env.BACKEND_URL}/payments/snappay/qrcodenotify`;
    //     }else{
    //         return `${process.env.BACKEND_URL}/payments/snappay/qrcodenotify`;
    //     }
    // }

    getPostData(
        method: string,
        paymentMethod: string,
        paymentId: string,
        amount: number,
        returnUrl: string,
        description: string
    ) {
        const return_url = returnUrl;                                           // `${process.env.FRONTEND_URL}?p=h&cId=${accountId}`;
        const notify_url = `${process.env.BACKEND_URL}/payments/snappay/notify`; // `${process.env.BACKEND_URL}/payments/notify`;
        const trans_amount = Math.round(amount * 100) / 100;

        return {
            // the order matters
            app_id: process.env.SNAPPAY_APP_ID,
            charset: "UTF-8",
            description,
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
            method,
            paymentMethod,
            paymentId,
            amount,
            returnUrl,
            description
        );
        const data = this.signPostData(d);
        let r;
        try{
            r = await axios.post(`https://open.snappay.ca/api/gateway`, data);
            Log.save({msg: `snappay axios return success`});
        }catch(e){
            Log.save({msg: `snappay axios return: ${JSON.stringify(e)}`});
        }
        const ret = r?.data;
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


    payv1(
        accountId: string,
        appCode: string,
        paymentActionCode: string,
        amount: number,
        returnUrl: string,
        description: string,
        paymentId: string
      ) {
        const self = this;
    
        return new Promise((resolve, reject) => {
          const data = this.getPostData(
            'ALIPAY',
            'pay.webpay',
            paymentId,
            amount,
            returnUrl,
            description
          );
          const params = this.signPostData(data);
          const options = {
            hostname: "open.snappay.ca",
            port: 443,
            path: "/api/gateway",
            method: "POST",
            headers: {
              "Content-Type": "application/json", // 'Content-Length': Buffer.byteLength(data)
            },
          };
    
          // const message = "paymentId:" + paymentId + ", params:" + JSON.stringify(params)
          // this.addLogToDB(accountId, "snappay req", '', message).then(() => { });
    
          try {
            const post_req = https.request(options, (res: IncomingMessage) => {
              let ss = "";
              res.on("data", (d) => {
                ss += d;
              });
              res.on("end", (r: any) => {
                  resolve(JSON.parse(ss));
                // if (ss) { // { code, data, msg, total, psn, sign }
                //   const ret = JSON.parse(ss); // s.data = {out_order_no:x, merchant_no:x, trans_status:x, h5pay_url}
                //   const code = ret ? ret.code : "";
                //   const message = "sign:" + (ret ? ret.sign : "N/A") + ", msg:" + (ret ? ret.msg : "N/A");
                //   const rsp: IPaymentResponse = {
                //     status: ret && ret.msg === "success" ? ResponseStatus.SUCCESS : ResponseStatus.FAIL,
                //     code, // stripe/snappay code
                //     decline_code: "", // stripe decline_code
                //     msg: message, // stripe/snappay retrun message
                //     chargeId: "", // stripe { chargeId:x }
                //     url: ret.data && ret.data[0] ? ret.data[0].h5pay_url : "", // snappay data[0].h5pay_url
                //   };
                //   if (ret && ret.msg === "success") {
                //     resolve(rsp);
                //   } else {
                //     // this.addLogToDB(accountId, "snappay rsp", '', message).then(() => {
                //       resolve(rsp);
                //     });
                //   }
                // } else {
                //   const rsp: IPaymentResponse = {
                //     status: ResponseStatus.FAIL,
                //     code: "UNKNOWN_ISSUE", // snappay return code
                //     decline_code: "", // stripe decline_code
                //     msg: "UNKNOWN_ISSUE", // snappay retrun message
                //     chargeId: "", // stripe { chargeId:x }
                //     url: "", // for snappay data[0].h5pay_url
                //   };
                //   resolve(rsp);
                // }
              });
            });
      
            post_req.on("error", (error: any) => {
            //   const message = JSON.stringify(error);
            //   self.addLogToDB(accountId, 'snappay error', '', message).then(() => {
            //     // Reject on request error.
            //     const rsp: IPaymentResponse = {
            //       status: ResponseStatus.FAIL,
            //       code: "UNKNOWN_ISSUE", // snappay return code
            //       decline_code: "", // stripe decline_code
            //       msg: message, // snappay retrun message
            //       chargeId: "", // stripe { chargeId:x }
            //       url: "", // for snappay data[0].h5pay_url
            //     };
            //     resolve(rsp);
            // });
        resolve(error);
      
            });
            post_req.write(JSON.stringify(params));
            post_req.end();
          } catch (e) {
            // console.error(e);
            // resolve({
            //   status: ResponseStatus.FAIL,
            //   code: "UNKNOWN_ISSUE",
            //   decline_code: "",
            //   msg: e,
            //   chargeId: "",
            //   url: ""
            // });
            resolve(e);
          }
        });
      }
}