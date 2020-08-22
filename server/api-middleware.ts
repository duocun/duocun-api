import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Config } from "./config";

const SVC_PATH = process.env.ENV === 'localhost' ? process.env.SVC_PATH : '';

export class ApiMiddleWare {
  constructor(options?: any) {}

  auth(req: Request, res: Response, next: any) {
    let token = req.get("Authorization") || "";
    token = token.replace("Bearer ", "");
    const cfg = new Config();
    next();
    // if (
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/wxLogin` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/wechatLogin` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/login` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/signup` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/logout` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/loginByPhone` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/verifyCode` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/sendVerifyMsg` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/sendOTPCode` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/verifyAndLogin` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/registerTempAccount` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/register` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/googleLogin` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/fbLogin` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Accounts/googleSignUp` ||
    //   // req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Accounts/wechatLoginByOpenId`) !== -1 ||
    //   // req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Accounts/wechatLoginByCode`) !== -1 ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Categories/G` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Pages/loadTabs` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Areas/G/my` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/EventLogs` ||
    //   // (req.path && req.path.startsWith(`/${cfg.SERVER.SVC_PATH}/Pages/page`)) ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/MerchantSchedules/availableMerchants` ||
    //   // (req.method === "GET" && req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Accounts`) !== -1) ||
    //   // req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Locations`) !== -1 ||
    //   // req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Restaurants`) !== -1 ||
    //   // req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Products`) !== -1 ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Restaurants` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Restaurants/qFind` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Restaurants/load` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Products` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Products/qFind` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Products/categorize` ||
    //   // (req.path.includes(`/${cfg.SERVER.SVC_PATH}/products`) && req.method == "GET") ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Pages/loadTabs` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Ranges` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Ranges/overRange` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/Ranges/inRange` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/ClientPayments/notify` ||
    //   // req.path === `/${cfg.SERVER.SVC_PATH}/ClientPayments/alphapay/success` ||
    //   // req.path.indexOf(`/${cfg.SERVER.SVC_PATH}/Messages`) !== -1 ||
    //   // req.path.indexOf(`${cfg.SERVER.SVC_PATH}`) !== -1 ||
    //   // (req.path.includes(`/${cfg.SERVER.SVC_PATH}/Categories/G`) && req.method == "GET") ||
    //   req.path.includes(".jpeg") ||
    //   req.path.includes(".jpg") ||
    //   req.path.includes(".png")
    // ) {
    //   next();
    // } else {
    //   res.setHeader("Content-Type", "application/json");
      
    //   if (token) {
    //     try {
    //       let accountId: any = jwt.verify(token, cfg.JWT.SECRET);
    //       accountId = accountId.accountId;
    //       // TODO: compare redis token
    //       if (accountId) {
    //         next();
    //       } else {
    //         // return res.send(JSON.stringify({err: 401, msg:"Authorization: bad token"}, null, 3));
    //         return res.status(401).send("Authorization: bad token");
    //       }
    //     } catch (err) {
    //       // return res.send(JSON.stringify({err: 401, msg:"Authorization: bad token"}, null, 3));
    //       return res.status(401).send("Authorization: bad token err=" + err);
    //     }
    //   } else {
    //     return res.status(401).send("API Authorization token is required.");
    //   }
    // }
  }
}
