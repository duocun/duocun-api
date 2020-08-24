import express, {Request, Response} from "express";
import { DB } from "../db";
import { Order } from "../models/order";
import { OrderController } from "../controllers/order-controller";

export function OrderRouter(db: DB) {
  const router = express.Router();
  const model = new Order(db);

  const controller = new OrderController(db);

  router.get('/routes', (req: Request, res: Response) => { controller.getRoutes(req, res); });

  // yaml
  router.post('/bulk', async (req, res) => { await controller.placeOrders(req, res); });
  router.delete('/:id', (req, res) => { controller.removeOrder(req, res); });
  router.post('/validateCart', (req, res) => { controller.validateCart(req, res); });
  // v2
  router.get('/v2/transactions', (req, res) => { model.reqTransactions(req, res); });
  router.get('/v2/', (req, res) => { controller.listV2(req, res); });

  // Public
  // input:
  //  orders --- [ IOrders[] ], without _id and paymentId
  // return:
  //  orders ---- [IOrders[]],  new orders with _id and paymentId  
  router.post('/placeOrders', (req, res) => { controller.reqPlaceOrders(req, res); });

  // tools
  // router.post('/missingWechatpayments', (req, res) => { model.reqMissingWechatPayments(req, res); });
  // router.post('/missingPaid', (req, res) => { model.reqFixMissingPaid(req, res); });
  // router.post('/missingUnpaid', (req, res) => { model.reqFixMissingUnpaid(req, res); });

  router.get('/v2/correctTime', (req, res) => { model.reqCorrectTime(req, res); });

  router.get('/history/:currentPageNumber/:itemsPerPage', (req, res) => { controller.loadHistory(req, res); });
  router.get('/loadPage/:currentPageNumber/:itemsPerPage', (req, res) => { controller.loadPage(req, res); });
  router.get('/getByCode/:code', (req, res) => {controller.getByCode(req, res)});
  router.get('/getByPaymentId/:paymentId', (req, res) => { controller.getByPaymentId(req, res) });
  // v1
  router.get('/csv', (req, res) => { model.reqCSV(req, res); });
  router.get('/clients', (req, res) => { model.reqClients(req, res); });
  router.get('/statisticsByClient', (req, res) => { model.reqStatisticsByClient(req, res); });
  router.get('/latestViewed', (req, res) => { model.reqLatestViewed(req, res); });
  
  router.get('/trends', (req, res) => { model.getOrderTrends(req, res); });
  router.get('/qFind', (req, res) => { model.quickFind(req, res); });
  router.get('/', (req, res) => { model.list(req, res); });
  
  router.get('/:id', (req, res) => { model.get(req, res); });

  router.put('/updatePurchaseTag', (req, res) => { model.updatePurchaseTag(req, res) });
  router.put('/', (req, res) => { model.replace(req, res); });
  router.post('/checkStripePay', (req, res) => { model.checkStripePay(req, res); });
  router.post('/checkWechatpay', (req, res) => { model.checkWechatpay(req, res); });
  
  //
  router.post('/payOrder', (req, res) => { model.payOrder(req, res); });
  router.post('/', (req, res) => { model.create(req, res); });


  // deprecated
  // router.post('/afterRemoveOrder', (req, res) => { model.afterRemoveOrder(req, res); });

  router.patch('/fixCancelledTransaction', (req, res) => { model.fixCancelledTransaction(req, res); });
  router.patch('/updateDelivered', (req, res) => { model.updateDeliveryTime(req, res); });
  router.patch('/', (req, res) => { model.update(req, res); });
  router.delete('/', (req, res) => { model.remove(req, res); });
  

  // router.post('/checkGroupDiscount', (req, res) => { model.checkGroupDiscount(req, res); });


  return router;
};

