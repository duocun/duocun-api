import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import path from "path";
import fs from "fs";
import Server from "socket.io";
import { ObjectID } from "mongodb";

// import swaggerUi from "swagger-ui-express";
// import swaggerJsDoc from "swagger-jsdoc";
// import YAML from "yamljs";

import jwt from "jsonwebtoken";
import { Config } from "./config";
//import * as SocketIOAuth from "socketio-auth";

import { DB } from "./db";
import { Utils } from "./utils";
import { Socket } from "./socket";
import socketio from "./socketio";

import { AccountRouter } from "./routers/account-route";
import { DistanceRouter } from "./routers/distance-route";
import { OrderRouter } from "./routers/order-route";
import { MerchantPaymentRouter } from "./routers/merchant-payment-route";
import { MerchantBalanceRouter } from "./routers/merchant-balance-route";
import { MerchantScheduleRouter } from "./routers/merchant-schedule-route";
import { MallScheduleRouter } from "./routers/mall-schedule-route";

import { ClientPaymentRouter } from "./routers/client-payment-route";
import { DriverPaymentRouter } from "./routers/driver-payment-route";
import { DriverBalanceRouter } from "./routers/driver-balance-route";
import { RegionRouter } from "./routers/region-route";
import { TransactionRouter } from "./routers/transaction-route";
import { OrderSequenceRouter } from "./routers/order-sequence-route";
import { DriverHourRouter } from "./routers/driver-hour-route";
import { CategoryRouter } from "./routers/category-route";
import { MerchantRouter } from "./routers/merchant-route";
import { ProductRouter } from "./routers/product-route";
import { ContactRouter } from "./routers/contact-route";
import { RangeRouter } from "./routers/range-route";
import { MallRouter } from "./routers/mall-route";
import { LocationRouter } from "./routers/location-route";
import { PickupRouter } from "./routers/pickup-route";
import { DriverRouter } from "./routers/driver-route";
import { DriverShiftRouter } from "./routers/driver-shift-route";
import { DriverScheduleRouter } from "./routers/driver-schedule-route";
import { LogRouter } from "./routers/log-route";
import { EventLogRouter } from "./routers/event-log-route";
import { PageRouter } from "./routers/page-route";
import { ToolRouter } from "./routers/tool-route";
import { ChatMessageRouter } from "./routers/message-route";

import { CellApplicationRouter } from "./routers/cell-application-route";

import { AreaRouter } from "./routers/area-route";

import { Product } from "./models/product";

import { ApiMiddleWare } from "./api-middleware";
import { schedule } from "node-cron";

import { Order } from "./models/order";

import dotenv from "dotenv";
import log from "./lib/logger";
dotenv.config();

// const swaggerDefinition = YAML.load(path.join(__dirname, "/swagger/info.yaml"));
// // options for the swagger docs
// const options = {
//   // import swaggerDefinitions
//   swaggerDefinition,
//   // path to the API docs
//   apis: [path.join(__dirname, "/swagger/**/*.yaml")],
// };
// // initialize swagger-jsdoc
// const swaggerSpec = swaggerJsDoc(options);

function startCellOrderTask(dbo: any) {
  // s m h d m w
  schedule("0 30 23 27 * *", () => {
    const orderModel = new Order(dbo);
    orderModel.createMobilePlanOrders();
  });
}
// schedule('0 45 23 * * *', () => {
//   let cb = new ClientBalance(dbo);
//   cb.updateAll();
// });

// console.log = function (msg: any) {
//   fs.appendFile("/tmp/log-duocun.log", msg, function (err) { });
// }

const apimw = new ApiMiddleWare();
const utils = new Utils();
const cfg = new Config();

const SVC_PATH = process.env.ENV === 'localhost' ? process.env.SVC_PATH : '';

const app = express();

// // logger middleware
// app.use((req, res, next) => {
//   // const ip = req.headers['x-forward-for'] || req.connection.remoteAddress;
//   if (req.path && req.path.match(/\.(png|jpg|jpeg|tiff|jfif)/)) {

//   } else {
//     if (req.method !== "OPTIONS") {
//       log.info(`[${req.method}] ${req.path}`);
//     }
//   }
//   next();
// });

const dbo = new DB();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req: any, file, cb) {
    cb(null, req.body.fname + "." + req.body.ext);
  },
});
const upload = multer({ storage: storage });
// const upload = multer({ dest: 'uploads/' });
let mysocket: any; // Socket;
let io: any;

function setupSocket(server: any) {
  io = Server(server);

  io.on("connection", function (socket: any) {
    log.info(`server socket connected: socket-id=${socket.id}`);

    // socket.on('authentication', function (token: any) {
    // });
  });
}

// create db connection pool and return connection instance
dbo.init(cfg.DATABASE).then((dbClient) => {
  // socket = new Socket(dbo, io);
  startCellOrderTask(dbo);
  // require('socketio-auth')(io, { authenticate: (socket: any, data: any, callback: any) => {
  //   const uId = data.userId;
  //   console.log('socketio connecting with uid: ' + uId + '/n');
  //   if(uId){
  //     user.findOne({_id: new ObjectID(uId)}).then( x => {
  //       if(x){
  //         callback(null, true);
  //       }else{
  //         callback(null, false);
  //       }
  //     });
  //   }else{
  //     callback(null, false);
  //   }
  // }, timeout: 200000});

  // io.on("updateOrders", (x: any) => {
  //   const ss = x;
  // });

  app.get("/wx", (req, res) => {
    utils.genWechatToken(req, res);
  });

  // app.get('/wechatAccessToken', (req, res) => {
  //   utils.getWechatAccessToken(req, res);
  // });
  // app.get('/wechatRefreshAccessToken', (req, res) => {
  //   utils.refreshWechatAccessToken(req, res);
  // });
  app.get(SVC_PATH + "/geocodeLocations", (req, res) => {
    utils.getGeocodeLocationList(req, res);
  });

  app.get(SVC_PATH + "/places", (req, res) => {
    utils.getPlaces(req, res);
  });

  app.get(SVC_PATH + "/users", (req, res) => {
    const t = 1;
  });

  app.post(
    SVC_PATH + "/files/upload",
    upload.single("file"),
    (req, res) => {
      const product = new Product(dbo);
      product.uploadPicture(req, res);
    }
  );

  // app.get('/' + SVC_PATH + '/Pictures', (req, res) => {
  //   picture.get(req, res);
  // });

  app.post(
    SVC_PATH + "/files/upload",
    upload.single("file"),
    (req, res, next) => {
      res.send("upload file success");
    }
  );
  app.post("/alphatest", (res) => {
    const room = "payment:5cba947eca9f641b677138ef";
  });
  // disable auth token for testing
  if (process.env.ENV != "dev") {
    app.use(apimw.auth);
  }

  // app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.use(SVC_PATH + "/Accounts", AccountRouter(dbo));
  app.use(SVC_PATH + "/Merchants", MerchantRouter(dbo));
  app.use(SVC_PATH + "/Restaurants", MerchantRouter(dbo)); // deprecated
  app.use(SVC_PATH + "/Areas", AreaRouter(dbo));
  app.use(SVC_PATH + "/Transactions", TransactionRouter(dbo));
  app.use(SVC_PATH + "/Categories", CategoryRouter(dbo));
  app.use(SVC_PATH + "/Products", ProductRouter(dbo));
  app.use(SVC_PATH + "/Pages", PageRouter(dbo));

  app.use(SVC_PATH + "/Tools", ToolRouter(dbo));
  app.use(SVC_PATH + "/Contacts", ContactRouter(dbo));
  app.use(SVC_PATH + "/Ranges", RangeRouter(dbo));
  app.use(SVC_PATH + "/Malls", MallRouter(dbo));
  app.use(SVC_PATH + "/Locations", LocationRouter(dbo));
  app.use(SVC_PATH + "/Pickups", PickupRouter(dbo));
  app.use(SVC_PATH + "/Drivers", DriverRouter(dbo));

  app.use(SVC_PATH + "/Distances", DistanceRouter(dbo));
  app.use(SVC_PATH + "/Regions", RegionRouter(dbo));
  app.use(SVC_PATH + "/Orders", OrderRouter(dbo));
  app.use(SVC_PATH + "/MerchantPayments", MerchantPaymentRouter(dbo));
  app.use(SVC_PATH + "/MerchantBalances", MerchantBalanceRouter(dbo));
  app.use(
    SVC_PATH + "/MerchantSchedules",
    MerchantScheduleRouter(dbo)
  );
  app.use(SVC_PATH + "/MallSchedules", MallScheduleRouter(dbo));

  app.use(SVC_PATH + "/ClientPayments", ClientPaymentRouter(dbo));
  app.use(SVC_PATH + "/DriverPayments", DriverPaymentRouter(dbo));
  app.use(SVC_PATH + "/DriverBalances", DriverBalanceRouter(dbo));

  app.use(SVC_PATH + "/OrderSequences", OrderSequenceRouter(dbo));
  app.use(SVC_PATH + "/DriverHours", DriverHourRouter(dbo));
  app.use(SVC_PATH + "/DriverShifts", DriverShiftRouter(dbo));
  app.use(SVC_PATH + "/DriverSchedules", DriverScheduleRouter(dbo));
  app.use(SVC_PATH + "/Logs", LogRouter(dbo));
  app.use(SVC_PATH + "/EventLogs", EventLogRouter(dbo));
  app.use(SVC_PATH + "/Messages", ChatMessageRouter(dbo));

  app.use(SVC_PATH + "/CellApplications", CellApplicationRouter(dbo));

  app.use(express.static(path.join(__dirname, "/../uploads")));
  app.set("port", cfg.SERVER.SVC_PORT);

  const server = app.listen(app.get("port"), () => {
    console.log(`server path: ${cfg.SERVER.SVC_PATH}`);
    console.log("API is running on :%d/n", app.get("port"));
  });

  // setupSocket(server);
  socketio(server, dbo);
});

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false, limit: "1mb" }));
app.use(bodyParser.json({ limit: "1mb" }));

const staticPath = path.resolve("uploads");

console.log(staticPath + "/n/r");

app.use(express.static(staticPath));
