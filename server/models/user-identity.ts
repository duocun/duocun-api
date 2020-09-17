import { Model } from "./model";
import { DB } from "../db";
import { Account } from "./account";
import { OAuth2Client } from "google-auth-library";
import axios from "axios";

export const IdentityType = {
    GOOGLE: 'google',
    FACEBOOK: 'facebook',
    WECHAT: 'wechat',
    PHONE: 'phone'
}

export interface IUserIdentity {
    _id: string;
    type: string;           // IdentityType wechat, google, fb
    profileId: string;
    username: string;
    email: string;

    phone?: string;
    verificationCode?: string;

    userId: string;
}

export class UserIdentity extends Model {
    // accountModel: Account;
    constructor(dbo: DB) {
        super(dbo, 'user_identities');
        // this.accountModel = new Account(dbo);
    }


    // /**
    //  *  save if does not exist
    //  */
    // async save(ui: IUserIdentity){
    //     const identity = await this.findOne({type: ui.type, identifier: ui.identifier});
    //     if(!identity){
    //         const r = await this.insertOne(ui);

    //         return {...ui, _id: r.insertedId};
    //     }else{
    //         return identity;
    //     }
    // }

    async getGoogleProfile(tokenId: string) {
        const GOOGLE_AUTH_CLIENT_ID = process.env.GOOGLE_AUTH_CLIENT_ID;
        const googleOAuthClient = new OAuth2Client(GOOGLE_AUTH_CLIENT_ID);
        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: tokenId,
            audience: GOOGLE_AUTH_CLIENT_ID,
        });
        return await ticket.getPayload();
    }

    // return
    // fbUserId: fbUser.id,
    // username: fbUser.name,
    // imageurl: fbUser.profile_pic,
    // type: "client",
    // sex: 0,
    // balance: 0,
    async getFacebookProfile(accessToken: string, userId: string) {
        const url = `https://graph.facebook.com/${userId}?access_token=${accessToken}&locale=en_US`;
        const r = await axios.get(url);
        return r.data;
    }

    // return:
    //     "openid":" OPENID",
    //     "nickname": NICKNAME,
    //     "sex":"1",
    //     "province":"PROVINCE"
    //     "city":"CITY",
    //     "country":"COUNTRY",
    //     "headimgurl":"http://thirdwx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6/46",
    //     "privilege":[ "PRIVILEGE1" "PRIVILEGE2" ],
    //     "unionid": "o6_bmasdasdsad6_2sg"
    async getWechatProfile(accessToken: string, openId: string): Promise<any> {
        const url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + accessToken + '&openid=' + openId + '&lang=zh_CN';
        const r = await axios.get(url);
        if (r.data && r.data.openid) {
            return r.data;
        } else {
            return;
        }
    }


    async getWechatAccessToken(authCode: string): Promise<any> {
        const APP_ID = process.env.WECHAT_APP_ID;
        const SECRET = process.env.WECHAT_APP_SECRET;
        let url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + APP_ID +
            '&secret=' + SECRET + '&code=' + authCode + '&grant_type=authorization_code';

        const r = await axios.get(url);
        if (r.data) {
            if (r.data.access_token) {
                return r.data;
            } else {
                const s = r.data;
                return { code: s.errcode, msg: s.errmsg };
            }
        } else {
            return { code: -2, msg: 'wechat no response' };
        }
    }

    // async bindIdentity(phone: string, ui: IUserIdentity){
    //     const account = await this.accountModel.findOne({phone});
    //     if(account){
    //         await this.updateOne({_id: ui._id}, {userId: account._id, phone});
    //     }else if(ui.email) {
    //         const acc = await this.accountModel.findOne({email: ui.email});
    //         if(acc){
    //             await this.updateOne({_id: ui._id}, {userId: account._id});
    //         }
    //     }else{
    //         // cannot bind
    //     }
    //     return;
    // }
}