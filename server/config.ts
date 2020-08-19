import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const SVC_PORT: number = parseInt(process.env.SVC_PORT || '8000');
const SVC_PATH: any = process.env.SVC_PATH;
const DB_HOST: any = process.env.DB_HOST;
const DB_NAME: any = process.env.DB_NAME;
const DB_USERNAME: any = process.env.DB_USERNAME;
const DB_PASSWORD: any = process.env.DB_PASSWORD;

export interface IJWT {
  EXPIRY: string; // eg. '365 days'
  ALGORITHM: string;
  SECRET: string;
}

export interface IApiServer {
  SVC_PORT: number; //8000,
  SVC_PATH: string; // "api"
}

export interface IDatabase {
  // "DATABASE":{
  //   "HOST":"localhost",
  //   "NAME":"duocun",
  //   "PORT": 27017,
  //   "POOL_SIZE":10,
  //   "USERNAME":"x",
  //   "PASSWORD":"x"
  // },
  HOST: string;
  NAME: string;
  PORT: number;
  POOL_SIZE: number;
  USERNAME: string;
  PASSWORD: string;
}

export interface ISmsProvider {
  SID: string;
  TOKEN: string;
  FROM: string;
}

export interface ISNS {
  APP_ID: string;
  APP_SECRET: string;
  TOKEN: string;
}

export interface ISnappay {
  APP_ID: string;
  MERCHANT_ID: string;
  PRIVATE_KEY: string;
  PUBLIC_KEY: string;
  MD5_KEY: string;
}

export interface IAlphapay {
  PARTNER_CODE: string;
  CREDENTIAL_CODE: string;
}

export interface IStripe {
  API_KEY: string;
}

export interface IMoneris {
  STORE_ID: string;
  API_TOKEN: string;
  CHECKOUT_ID: string;
  ENVIRONMENT: "qa" | "prod";
}

export interface IAwsS3 {
  ACCESS_ID: string,
  ACCESS_KEY: string;
  BUCKET_NAME: string;
}

export class Config {
  private cfg: any;
  public JWT: IJWT;
  public GEOCODE_KEY: string = "";
  public GOOGLE_PLACE_KEY: string = "";
  public GOOGLE_MAP_KEY: string = "";
  public GOOGLE_DISTANCE_KEY: string = "";
  public SERVER: IApiServer;
  public DATABASE: IDatabase;
  public TWILIO: ISmsProvider;
  public WECHAT: ISNS;
  public STRIPE: IStripe;
  public SNAPPAY: ISnappay;
  public MONERIS: IMoneris;
  public GOOGLE_AUTH_CLIENT_ID: string = "";
  public ALPHAPAY: IAlphapay;
  public AWS_S3: IAwsS3;
  
  constructor() {
    this.cfg = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, "..", "..", "duocun.cfg.json"),
        "utf-8"
      )
    );
    this.JWT = this.cfg.JWT;
    this.GEOCODE_KEY = this.cfg.GEOCODE.KEY;
    this.GOOGLE_PLACE_KEY = this.cfg.GOOGLE_PLACE.KEY;
    this.GOOGLE_MAP_KEY = this.cfg.GOOGLE_MAP_KEY;
    this.GOOGLE_DISTANCE_KEY = this.cfg.GOOGLE_DISTANCE.KEY;

    this.TWILIO = this.cfg.TWILIO;
    this.WECHAT = this.cfg.WECHAT;
    this.STRIPE = this.cfg.STRIPE;
    this.SNAPPAY = this.cfg.SNAPPAY;
    this.MONERIS = this.cfg.MONERIS;
    this.GOOGLE_AUTH_CLIENT_ID = this.cfg.GOOGLE_AUTH_CLIENT_ID;
    this.ALPHAPAY = this.cfg.ALPHAPAY;
    this.AWS_S3 = this.cfg.AWS_S3;

    this.DATABASE = {
      HOST: DB_HOST,
      NAME: DB_NAME,
      PORT: 27017,
      POOL_SIZE: 10,
      USERNAME: DB_USERNAME,
      PASSWORD: DB_PASSWORD
    };
    this.SERVER = {SVC_PORT, SVC_PATH};
  }
}
