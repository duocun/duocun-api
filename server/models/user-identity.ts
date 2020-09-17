import { Model } from "./model";
import { DB } from "../db";
import { Account } from "./account";
import { OAuth2Client } from "google-auth-library";

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

export class UserIdentity extends Model{
    // accountModel: Account;
    constructor(dbo: DB){
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

    async getGoogleProfile(tokenId: string){
        const GOOGLE_AUTH_CLIENT_ID = process.env.GOOGLE_AUTH_CLIENT_ID;
        const googleOAuthClient = new OAuth2Client(GOOGLE_AUTH_CLIENT_ID);
        const ticket = await googleOAuthClient.verifyIdToken({
            idToken: tokenId,
            audience: GOOGLE_AUTH_CLIENT_ID,
        });
        return await ticket.getPayload();
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