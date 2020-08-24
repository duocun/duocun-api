import { Request, Response }  from "express";
// import { Log, AppId } from "../models/log";
import { DB } from "../db";
import { Order, IOrder, OrderStatus, IOrderItem } from "../models/order";
import { Code } from "../models/model";
import { Account } from "../models/account";
import { Product } from "../models/product";
import logger from "../lib/logger";
import { Controller } from "./controller";

export class OrderController extends Controller {
  model: Order;
  accountModel: Account;
  productModel: Product;
  constructor(model: Order, db: DB) {
    super(model, db);
    this.model = model;
    this.accountModel = new Account(db);
    this.productModel = new Product(db);
  }


  async getRoutes(req: Request, res: Response){

    // fix me, replace with middleware
    let query: any = req.query;
    if (query && query.query) {
      query = JSON.parse(query.query);
    }

    res.setHeader("Content-Type", "application/json");
    let data;
    let code = Code.FAIL;

    try {
      const deliverDate: any = query.deliverDate;
      const driverId: any = query.driverId; // optional

      if(deliverDate && driverId){
        const r = await this.model.getRoutes(deliverDate, driverId);
        code = Code.SUCCESS;
        data = r.data;
      }
    } catch (error) {
      logger.error(`list error: ${error}`);
    } finally {
      res.send({
          code,
          data
        }
      );
    }
  }

  reqPlaceOrders(req: Request, res: Response) {
    const orders = req.body;
    this.model.placeOrders(orders).then((savedOrders: IOrder[]) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(savedOrders, null, 3));
    }).catch(e => {
      res.json({
        code: Code.FAIL,
        data: e
      })
    });
  }

  listV2(req: Request, res: Response) {
    let query = null;

    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
    }

    this.model.joinFindV2(query).then((rs: any[]) => {
      res.setHeader('Content-Type', 'application/json');
      if (rs) {
        res.send(JSON.stringify(rs, null, 3));
      } else {
        res.send(JSON.stringify(null, null, 3))
      }
    });
  }

  loadPage(req: Request, res: Response) {
    const itemsPerPage = +req.params.itemsPerPage;
    const currentPageNumber = +req.params.currentPageNumber;  

    let query = null;
    let fields = null;
    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
    }

    if (req.headers && req.headers.fields && typeof req.headers.fields === 'string') {
      fields = (req.headers && req.headers.fields) ? JSON.parse(req.headers.fields) : null;
    }

    if (query.hasOwnProperty('pickup')) {
      query.delivered = this.model.getPickupDateTime(query['pickup']);
      delete query.pickup;
    }
    let q = query ? query : {};

    res.setHeader('Content-Type', 'application/json');

    this.model.loadPage(query, itemsPerPage, currentPageNumber).then(arr => {
      const len = arr.length;
      if (arr && arr.length > 0) {
        res.send(JSON.stringify({ total: len, orders: arr }, null, 3));
      } else {
        res.send(JSON.stringify({ total: len, orders: [] }, null, 3));
      }
    });
  }

  

  // return [{_id, address, description,items, merchantName, clientPhoneNumber, price, total, tax, delivered, created}, ...]
  loadHistory(req: Request, res: Response) {
    const itemsPerPage = +req.params.itemsPerPage;
    const currentPageNumber = +req.params.currentPageNumber;
    let query = null;
    // let fields = null;
    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
    }

    // if (req.headers && req.headers.fields && typeof req.headers.fields === 'string') {
    //   fields = (req.headers && req.headers.fields) ? JSON.parse(req.headers.fields) : null;
    // }

    // let q = query ? query : {};
    let clientId = query.clientId;

    this.model.loadHistoryV2(clientId, itemsPerPage, currentPageNumber).then(r => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(r, null, 3));
    });
  }

  async getByCode(req: Request, res: Response) {
    const code = req.params.code;
    let query = null;
    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
    }
    if (!query || !query.clientId) {
      return res.json({
        code: Code.FAIL,
        message: 'authentication failed'
      });
    }
    const client = await this.accountModel.findOne({ _id: query.clientId });
    if (!client) {
      return res.json({
        code: Code.FAIL,
        message: 'authentication failed'
      });
    }
    const order = await this.model.findOne({
      code,
      clientId: query.clientId
    });
    if (!order) {
      return res.json({
        code: Code.FAIL,
        message: 'no such order'
      });
    }
    return res.json({
      code: Code.SUCCESS,
      data: await this.getOrderDetail(order)
    });
  }

  async getByPaymentId(req: Request, res: Response) {
    const paymentId = req.params.paymentId;
    let query = null;
    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
    }
    if (!query || !query.clientId) {
      return res.json({
        code: Code.FAIL,
        message: 'authentication failed'
      });
    }
    const client = await this.accountModel.findOne({ _id: query.clientId });
    if (!client) {
      return res.json({
        code: Code.FAIL,
        message: 'authentication failed'
      });
    }
    const orders = await this.model.find({ paymentId, clientId: query.clientId });
    const data = [];
    for (let order of orders) {
      data.push(await this.getOrderDetail(order));
    }
    return res.json({
      code: Code.SUCCESS,
      data
    });
  }

  async getOrderDetail(order: IOrder) {
    const client = await this.accountModel.findOne({ _id: order.clientId });
    const items = [];
    if (order.items) {
      for (let item of order.items) {
        const product = await this.productModel.findOne({ _id: item.productId });
        if (product) {
          items.push({ product, quantity: item.quantity, price: item.price });
        }
      }
    }
    const description = this.model.getDescription(order, 'zh');
    const address = this.model.locationModel.getAddrString(order.location);
    return { ...order, address, description, items, clientPhoneNumber: client.phone };
  }

  async placeOrders(req: Request, res: Response) {
    logger.info("--- BEGIN PLACE ORDERS ---");
    let orders: any = req.body;
    if (!orders || !orders.length) {
      logger.warn("Orders empty");
      logger.info("--- END PLACE ORDERS ---");
      return res.json({
        code: Code.FAIL,
        data: "order empty"
      });
    }
    // filter duplicated orders
    logger.info("Check for duplicated orders");
    orders = this.filterOrders(orders);
    logger.info(`Duplication check ended. Client ID: ${orders[0].clientId}`);
    try {
      logger.info("Saving orders");
      const savedOrders: IOrder[] = await this.model.placeOrders(orders);
      for (let order of savedOrders) {
        if (order.status === OrderStatus.NEW) {
          logger.info(`Change product quantity after payment (type: ${order.paymentMethod}). Client Name: ${order.clientName} Payment ID: ${order.paymentId} Order ID: ${order._id}`);
          await this.model.changeProductQuantity(order);
        }
      }
      res.setHeader('Content-Type', 'application/json');
      logger.info("--- END PLACE ORDERS ---");
      res.send({
        code: Code.SUCCESS,
        data: savedOrders 
      });
    } catch (e) {
      logger.info("--- END PLACE ORDERS ---");
      res.json({
        code: Code.FAIL,
        data: e
      });
    }
  }

  generateOrderDescription(order: IOrder) {
    let desc = `Client ID: ${order.clientId} `
      + `Client Name: ${order.clientName} `
      + `Delivery: ${order.deliverDate} ${order.deliverTime} `;
    if (order.items && order.items.length) {
      [...order.items].sort((a: IOrderItem, b:IOrderItem) => {
        if (a.productId > b.productId) {
          return 1;
        }
        if (a.productId < b.productId) {
          return -1;
        }
        return 0;
      }).forEach((item: IOrderItem) => {
        desc += ` Product ID: ${item.productId} Price: ${item.price} Quantity: ${item.quantity}`
      });
    }
    return desc;
  }

  filterOrders(orders: IOrder[]) {
    const insertedKeys: string[] = [];
    const insertedOrders: IOrder[] = [];
    orders.forEach((order: IOrder) => {
      const desc = this.generateOrderDescription(order);
      logger.info("Order requested: " + desc);
      if (!insertedKeys.includes(desc)) {
        insertedKeys.push(desc);
        insertedOrders.push(order);
      } else {
        logger.error("Order duplicated: " + desc);
      }
    });
    return insertedOrders;
  }

  async removeOrder(req: Request, res: Response) {
    const orderId = req.params.id;
    if(orderId){
      const x = await this.model.doRemoveOne(orderId);
      res.setHeader('Content-Type', 'application/json');
      res.send(x);
    }else{
      res.send();
    }
  }
  
  async validateCart(req: Request, res: Response) {
    const items = req.body.items;
    if (!items) {
      return res.json({
        code: Code.SUCCESS
      });
    }
    for (let item of items) {
      
    }
  }
}