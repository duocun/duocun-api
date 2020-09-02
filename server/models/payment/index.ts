export interface IPaymentResponse {
  status: string;         // ResponseStatus
  code: string;           // stripe/snappay return code
  decline_code: string;   // strip decline_code
  msg: string;            // stripe/snappay retrun message
  chargeId: string;       // stripe { chargeId:x }
  url: string;            // snappay {url: data[0].h5pay_url} //  { code, data, msg, total, psn, sign }
  err: string;
}

export const ResponseStatus = {
  SUCCESS: "S",
  FAIL: "F",
};