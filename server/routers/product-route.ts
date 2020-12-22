import express, { Request, Response } from "express";
import { ObjectId } from "mongodb";
import moment from 'moment';

import { DB } from "../db";
import { Model, Code } from "../models/model";
import { Product, ProductStatus, IProduct } from "../models/product";
import { Schedule, ISchedule } from "../models/schedule";
import { Area, IArea } from '../models/area';
import logger from "../lib/logger";

export function ProductRouter(db: DB) {
  const router = express.Router();
  const model = new Product(db);
  const controller = new ProductController(db);

  // grocery api
  router.get('/G/:id/schedules', (req, res) => { controller.gv1_scheduleList(req, res); });
  router.get('/G/:id', (req, res) => { controller.gv1_get(req, res); });
  router.get('/G/', (req, res) => { controller.gv1_list(req, res); });

  // admin api /products/admin
  router.get('/admin', (req, res) => { controller.av1_list(req, res); });


  // old api
  router.get('/', (req, res) => { controller.list(req, res); });
  router.get('/paginate/:page/:size', (req, res) => { controller.paginate(req, res) });
  router.get('/qFind', (req, res) => { model.quickFind(req, res); });
  router.get('/clearImage', (req, res) => { model.clearImage(req, res); });
  router.get('/categorize', (req, res) => { model.categorize(req, res); });
  router.get('/:id', (req, res) => { model.get(req, res); });
  router.post('/', (req, res) => { model.create(req, res); });
  router.put('/', (req, res) => { model.replace(req, res); });
  router.patch('/', (req, res) => { model.update(req, res); });
  router.delete('/', (req, res) => { model.remove(req, res); });

  return router;
};

function propReplace(obj: any, key: string) {
  const f: any = (v: string) => { return new RegExp(v, 'i') };
  if (Object.prototype.toString.call(obj) === '[object Array]') {
    const rs = [];
    const vs = obj
    for (let i = 0; i < vs.length; i++) {
      // console.log(obj[k][i]);
      const it: any = propReplace(vs[i], key);
      rs.push(it);
    }
    // console.log(rs);
    return rs;
  } else {
    if (typeof obj === 'object' && obj !== null) {
      const r: any = {};
      Object.keys(obj).forEach(k => {
        //         // console.log(k);
        //         // console.log(obj[k]);
        const v = obj[k];
        if (k == key) {
          r[k] = f(v);
          // console.log(f(v));
        } else {
          r[k] = propReplace(v, key);
        }
      });
      // console.log(r);
      return r;
    } else {
      // console.log(obj);
      return obj;
    }
  }
}

class ProductController extends Model {

  productModel: Product;
  scheduleModel: Schedule;
  areaModel: Area;

  constructor(db: DB) {
    super(db, 'products');
    this.productModel = new Product(db);
    this.scheduleModel = new Schedule(db);
    this.areaModel = new Area(db);
  }


  async list(req: Request, res: Response) {
    let query: any = {};
    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
    } else {
      // fix me, replace with middleware
      query = req.query;
      if (query && query.query) {
        query = JSON.parse(query.query);
        query = propReplace(query, '$regex');
        query.type = 'G';
      } else {
        query = { type: 'G' };
      }
    }
    query.status = ProductStatus.ACTIVE;
    const ps = await this.productModel.list(query);
    res.setHeader('Content-Type', 'application/json');
    res.send(ps);
  }

  async paginate(req: Request, res: Response) {
    let query: any = {};
    if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
      query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
      query = { ...query, type: 'G', status: 'A' };
    } else {
      query = req.query;
      if (query && query.query) {
        query = JSON.parse(query.query);
        query.type = 'G';
        query.status = 'A';
      } else {
        query = { type: 'G', status: 'A' };
      }
    }
    let page = parseInt(req.params.page);
    let size = parseInt(req.params.size);
    if (page < 1) page = 1;
    if (size < 1) size = 1;
    const limit = size;
    const skip = (page - 1) * size;
    try {
      if (query.categoryId) {
        query.categoryId = new ObjectId(query.categoryId);
      }
      if (query.merchantId && query.merchantId['$in']) {
        query.merchantId['$in'] = query.merchantId['$in'].map((id: string) => new ObjectId(id));
      }
    } catch (e) {
      res.setHeader('Content-Type', 'application/json');
      res.send({
        code: Code.FAIL
      });
    }

    const collection = await this.productModel.getCollection();
    const data = await collection.find(query, { skip, limit, sort: [["rank", -1]] }).toArray();
    const count = await collection.find(query).count();
    res.setHeader('Content-Type', 'application/json');
    res.send({
      code: Code.SUCCESS,
      data,
      meta: {
        page,
        size,
        count
      }
    });
  }

  gv1_list(req: Request, res: Response) {
    // const status = req.query.status;
    const merchantId = req.query.merchantId;
    const query = { status: 'A', type: 'G' }; // status ? {status, type: 'G'} : {type: 'G'};
    res.setHeader('Content-Type', 'application/json');

    merchantId ?
      this.productModel.joinFind({ ...query, merchantId }).then((products: any[]) => {
        res.send(JSON.stringify({
          code: Code.SUCCESS,
          data: products
        }));
      })
      :
      res.send(JSON.stringify({
        code: Code.FAIL,
        data: []
      }));
  }

  gv1_get(req: Request, res: Response) {
    const id = req.params.id;
    this.productModel.getById(id).then(product => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({
        code: product ? Code.SUCCESS : Code.FAIL,
        data: product
      }));
    });
  }

  av1_list(req: Request, res: Response) {
    res.setHeader('Content-Type', 'application/json');
    this.productModel.joinFind({}).then((products: any[]) => {
      res.send(JSON.stringify({
        code: Code.SUCCESS,
        data: products
      }));
    });
  }

  async gv1_scheduleList(req: Request, res: Response): Promise<express.Response> {
    const productID: string = req.params.id;
    const lat = req.query.lat?.toString() ?? '';
    const lng = req.query.lng?.toString() ?? '';
    if (productID && lat && lng) {
      try {
        const product: IProduct = await this.productModel.getById(productID);
        if (product.scheduleId) {
          const schedule: ISchedule = await this.scheduleModel.getById(product.scheduleId);
          let availableArea;
          for (const a of schedule.areas) {
            const area: IArea = await this.areaModel.getById(a.areaId);
            if (area && area.coords) {
              if (this.areaModel.inPolygon(
                {
                  lat: parseFloat(lat),
                  lng: parseFloat(lng),
                },
                area.coords,
              )) {
                availableArea = a;
                break;
              }
            }
          }
          if (availableArea) {
            const today = moment().format('YYYY-MM-DD');
            let dates: string[] = [];
            availableArea.periods.forEach(period => {
              period.dows.forEach(dow => {
                if (schedule.isSpecial) {
                  let index = 0;
                  while (moment(today).day(dow + index * 7).diff(moment(period.endDate), 'h') < 1) {
                    const diff = moment(today).diff(moment(today).day(dow + index * 7), 'h');
                    if (diff < 1
                      && moment(today).day(dow + index * 7).diff(moment(period.startDate), 'h') > -1
                      && moment(today).day(dow + index * 7).diff(moment(period.endDate), 'h') < 1) {
                      const date = moment(today).day(dow + index * 7).format('YYYY-MM-DD');
                      if (!dates.includes(date)) {
                        dates.push(date);
                      }
                    }
                    index++;
                  }
                } else {
                  const diff1 = moment(today).diff(moment(today).day(dow), 'h');
                  if (diff1 < 1
                    && diff1 > -24 * 6 - 1
                    && moment(today).day(dow).diff(moment(period.startDate), 'h') > -1
                    && moment(today).day(dow).diff(moment(period.endDate), 'h') < 1) {
                    const date = moment(today).day(dow).format('YYYY-MM-DD');
                    if (!dates.includes(date)) {
                      dates.push(date);
                    }
                  }
                  const diff2 = moment(today).diff(moment(today).day(dow + 7), 'h');
                  if (diff2 < 1
                    && diff2 > -24 * 6 - 1
                    && moment(today).day(dow + 7).diff(moment(period.startDate), 'h') > -1
                    && moment(today).day(dow + 7).diff(moment(period.endDate), 'h') < 1) {
                    const date = moment(today).day(dow + 7).format('YYYY-MM-DD');
                    if (!dates.includes(date)) {
                      dates.push(date);
                    }
                  }
                }
              });
            });
            const endTimeMargin = parseInt(schedule.endTimeMargin, 10);
            if (endTimeMargin > -1) {
              let curDate;
              dates = dates.filter(date => {
                if (date === moment().format('YYYY-MM-DD')) {
                  if (moment().diff(moment(date), 'h') < endTimeMargin) {
                    return true;
                  }
                  curDate = date;
                  return false;
                }
                return true;
              });
              if (curDate) {
                dates.push(moment(curDate).add(7, 'd').format('YYYY-MM-DD'));
              }
            } else {
              let curDate;
              dates = dates.filter(date => {
                if (date === moment().format('YYYY-MM-DD')) {
                  curDate = date;
                  return false;
                }
                if (date === moment().add(1, 'd').format('YYYY-MM-DD')) {
                  if (moment().diff(moment(date), 'h') < endTimeMargin + 1) {
                    return true;
                  }
                  curDate = moment().format('YYYY-MM-DD');
                  return false;
                }
                return true;
              });
              if (curDate) {
                dates.push(moment(curDate).add(7, 'd').format('YYYY-MM-DD'));
              }
            }
            dates.sort();
            const schedules: {
              date: string;
              time: string;
              margin: number;
            }[] = [];
            dates.forEach(date => {
              schedules.push({
                date,
                time: '10:00',
                margin: endTimeMargin,
              });
            });
            return res.json({
              code: Code.SUCCESS,
              data: schedules,
            });
          }
        }
        return res.json({
          code: Code.SUCCESS,
          data: [],
        });
      } catch (ex) {
        logger.error(ex.message);
        return res.json({
          code: Code.FAIL,
          message: ex.message,
        });
      }
    } else {
      logger.error('productID, lat and lng are required');
      return res.status(400).json('Bad request');
    }
  }
}
