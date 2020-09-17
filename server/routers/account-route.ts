import express from "express";

import { DB } from "../db";
import { AccountController } from "../controllers/account-controller";
import { Account } from "../models/account";

export function AccountRouter(db: DB) {
  const router = express.Router();
  const model = new Account(db);
  const controller = new AccountController(model, db);
  
  router.get('/', (req, res) => { controller.list(req, res); });
  router.get('/current', (req, res) => { controller.getCurrentAccount(req, res); });
  router.post('/googleLogin', (req, res) => { controller.googleLogin(req, res) });
  router.post('/fbLogin', (req, res) => { controller.facebookLogin(req, res) });

  
  // grocery api
  router.get('/G/', (req, res) => { controller.gv1_list(req, res); });
  router.get('/G/:id', (req, res) => { controller.gv1_getById(req, res); });
  router.get('/G/token/:id', (req, res) => { controller.gv1_getByTokenId(req, res); });

  // v2 https://duocun.ca/api/Accounts/wechatLoginByOpenId
  router.post('/wechatLoginByOpenId', (req, res) => { controller.wechatLoginByOpenId(req, res); });
  router.get('/wechatLoginByCode', (req, res) => { controller.wechatLoginByCode(req, res); });
  router.post('/wechatSignup', (req, res) => {controller.wechatSignup(req, res); });
  
  router.get('/qFind', (req, res) => { controller.list(req, res); }); // deprecated
  router.post('/googleSignUp', (req, res) => { controller.googleSignUp(req, res) });
  // v1
  // router.get('/attributes', (req, res) => { this.attrModel.quickFind(req, res); });

  // v1
  // router.get('/wechatLogin', (req, res) => { controller.wechatLogin(req, res); });
  // router.post('/verifyCode', (req, res) => { controller.verifyCode(req, res); }); // deprecated

  router.get('/:id', (req, res) => { controller.get(req, res); }); // fix me

  // router.post('/', (req, res) => { controller.create(req, res); });
  // router.put('/', (req, res) => { controller.replace(req, res); });
  // router.patch('/', (req, res) => { controller.update(req, res); });
  // router.delete('/', (req, res) => { controller.remove(req, res); });

  // router.post('/sendClientMsg2', (req, res) => { controller.sendClientMsg2(req, res); });
  router.post('/sendClientMsg', (req, res) => { controller.sendClientMsg(req, res); });
  router.post('/verifyPhoneNumber', (req, res) => { controller.verifyPhoneNumber(req, res); });
  router.post('/sendVerifyMsg', (req, res) => { controller.sendVerifyMsg(req, res); });
  router.post('/applyMerchant', (req, res) => { controller.merchantStuff.applyMerchant(req, res); });
  router.post('/getMerchantApplication', (req, res) => { controller.merchantStuff.getApplication(req, res); });

  router.post('/login', (req, res) => { controller.login(req, res); });
  router.post('/loginByPhone', (req, res) => { controller.loginByPhone(req, res); });
  router.route('/signup').post((req, res) => { controller.signup(req, res); });
  router.post('/registerTempAccount', (req, res) => {controller.registerTempAccount(req, res)});
  router.post('/register', (req, res) => { controller.register(req, res) });
  // when an authenticated user tries to change phone number
  router.post('/sendVerificationCode', (req, res) => { controller.gv1_sendVerificationCode(req, res) });
  // when a user tries to log in with phone number
  router.post('/sendOTPCode', (req, res) => { controller.sendOTPCode(req, res) });
  router.post('/verifyCode', (req, res) => { controller.gv1_verifyCode(req, res) });
  router.post('/saveProfile', (req, res) => { controller.gv1_update(req, res) });
  return router;
};
