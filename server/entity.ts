import { Collection, ObjectId, ObjectID, InsertWriteOpResult, MongoError, BulkWriteResult, BulkWriteOpResultObject, InsertOneWriteOpResult } from "mongodb";
import { DB } from "./db";
import { Db } from 'mongodb';
import moment from 'moment';

export enum DbStatus {
  SUCCESS = 1,
  FAIL
}

export interface DbResult {
  status: DbStatus,
  msg: string
}

export interface IJoinParam {
  from: string,
  localField: string,
  foreignField: string,
  as: string
}

export class Entity {
  private db: Db;
  private collectionName: string;

  constructor(dbo: DB, name: string) {
    this.db = dbo.getDb();
    this.collectionName = name;
  }

  // v2
  filter(doc: any, fields?: string[]) {
    if (fields && fields.length > 0) {
      const it: any = {};
      fields.map((key: any) => {
        // if(key.indexOf(':')!== -1){
        //   const parentKey = key.split(':')[0];
        //   const children = key.split(':')[1].split(',').map((c: any) => c.trim());
        // }
        it[key] = doc[key];
      });
      return it;
    } else {
      return doc;
    }
  }

  filterArray(rs: any[], fields?: string[]) {
    if (fields && fields.length > 0) {
      const xs: any[] = [];
      if (rs && rs.length > 0) {
        rs.map(r => {
          const x = this.filter(r, fields);
          xs.push(x);
        });
        return xs;
      } else {
        return xs;
      }
    } else {
      return rs;
    }
  }

  // quick find
  async find(query: any, options?: any, fields?: any[]) {
    const self = this;
    query = this.convertIdFields(query);

    const c = await self.getCollection();
    const docs = await c.find(query, options).toArray();
    const rs = this.filterArray(docs, fields);
    return rs;
  }

  // v1
  getCollection(): Promise<Collection> {
    if (this.db) {
      const collection: Collection = this.db.collection(this.collectionName);
      if (collection) {
        return new Promise((resolve, reject) => {
          resolve(collection);
        });
      } else {
        return this.db.createCollection(this.collectionName);
      }
    } else {
      return new Promise((resolve, reject) => {
        reject(null);
      });
    }
  }

  join(params: any[], query: any = {}): Promise<any> {
    const q: any[] = Object.keys(query).length === 0 && query.constructor === Object ? [] : [
      { $match: query }
    ];

    params.map(p => {
      q.push(p);
    });

    const self = this;
    return new Promise((resolve, reject) => {
      self.getCollection().then((c: Collection) => {
        c.aggregate(q, (err, ret) => {
          ret.toArray().then(x => {
            resolve(x);
          });
        });
      });
    });
  }

  // load(query: any, params?: any): Promise<any> {
  //   const self = this;
  //   if (query && query.hasOwnProperty('id')) {
  //     let body = query.id;
  //     if (body && body.hasOwnProperty('$in')) {
  //       let a = body['$in'];
  //       const arr: any[] = [];
  //       a.map((id: string) => {
  //         arr.push({ _id: new ObjectID(id) });
  //       });

  //       query = { $or: arr };
  //     } else if (typeof body === "string") {
  //       query['_id'] = new ObjectID(query.id);
  //       delete query['id'];
  //     }
  //   }

  //   return new Promise((resolve, reject) => {
  //     self.getCollection().then((c: Collection) => {
  //       this.join(params, query).then((rs: any) => {
  //         resolve(rs);
  //       });
  //     });
  //   });
  // }

  // m --- moment object
  toLocalDateTimeString(m: any) {
    const dt = m.toISOString(true);
    return dt.split('.')[0];
  }

  async insertOne(doc: any): Promise<any> {
    const c = await this.getCollection();
    doc = this.convertIdFields(doc);
    doc.created = moment().toISOString();
    doc.modified = moment().toISOString();

    const result = await c.insertOne(doc);
    const ret = (result.ops && result.ops.length > 0) ? result.ops[0] : null;
    return ret;
  }

  async deleteOne(query: any) {
    const c = await this.getCollection();
    const q = this.convertIdFields(query);
    const r = await c.deleteOne(q);
    return r;
  }
  
  distinct(key: string, query: any, options?: any): Promise<any> {
    const self = this;
    return new Promise((resolve, reject) => {
      self.getCollection().then((c: Collection) => {
        query = this.convertIdFields(query);
        c.distinct(key, query, options, (err, doc) => {
          resolve(doc);
        });
      });
    });
  }

  findOne(query: any, options?: any, fields?: any[]): Promise<any> {
    const self = this;
    return new Promise((resolve, reject) => {
      self.getCollection().then((c: Collection) => {
        query = this.convertIdFields(query);
        c.findOne(query, options, (err, doc) => {
          const r = this.filter(doc, fields);
          resolve(r);
        });
      });
    });
  }



  // deprecated
  replaceOne(query: any, doc: any, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        query = this.convertIdFields(query);
        doc = this.convertIdFields(doc);
        c.replaceOne(query, doc, options, (err, result: any) => {
          if (result && result._id) {
            result.id = result._id;
            delete (result._id);
          }
          resolve(result);
        });
      });
    });
  }

  updateOne(query: any, doc: any, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      if (Object.keys(doc).length === 0 && doc.constructor === Object) {
        resolve();
      } else {
        query = this.convertIdFields(query);
        doc = this.convertIdFields(doc);

        this.getCollection().then((c: Collection) => {
          c.updateOne(query, { $set: doc }, options, (err, r: any) => { // {n: 1, nModified: 0, ok: 1}
            resolve(r.result);
          });
        });
      }
    });
  }

  updateMany(query: any, data: any, options?: any): Promise<any> {
    query = this.convertIdFields(query);
    data = this.convertIdFields(data);

    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        c.updateMany(query, { $set: data }, options, (err, result: any) => {
          resolve(result);
        });
      });
    });
  }

  bulkUpdateV1(items: any[], options?: any) {
    this.getCollection().then((c: Collection) => {
      items.map(item => {
        let query = item.query;
        let doc = item.data;
        if (query && query.hasOwnProperty('id')) {
          query['_id'] = new ObjectID(query.id);
          delete query['id'];
        }

        c.updateOne(query, { $set: doc }, options, (err, result: any) => {
          if (result && result._id) {
            result.id = result._id;
            delete (result._id);
          }
        });
      });
    });
  }

  getProperty(doc: any, p: string) {
    let k = null;
    if (doc) {
      const keys = Object.keys(doc);
      keys.map(key => {
        if (key) {
          if (key.indexOf(p) !== -1) {
            k = key;
            return k;
          }
        }
      });
      return k;
    } else {
      return k;
    }
  }

  convertIdField(doc: any, fieldName: string) {
    if (doc && doc.hasOwnProperty(fieldName)) {
      const body = doc[fieldName];

      if (body && body.hasOwnProperty('$in')) {
        let a = body['$in'];
        const arr: any[] = [];
        a.map((id: any) => {
          if (typeof id === "string" && ObjectId.isValid(id)) {
            arr.push(new ObjectID(id));
          } else {
            arr.push(id);
          }
        });

        doc[fieldName] = { $in: arr };
      } else if (typeof body === "string" && ObjectId.isValid(body)) {
        doc[fieldName] = new ObjectID(body);
      }
    }

    return doc;
  }

  // only support query _id, not id
  convertIdFields(doc: any) {
    doc = this.convertIdField(doc, '_id');
    doc = this.convertIdField(doc, 'userId');
    doc = this.convertIdField(doc, 'areaId');
    doc = this.convertIdField(doc, 'paymentId');
    doc = this.convertIdField(doc, 'categoryId');
    doc = this.convertIdField(doc, 'merchantAccountId');
    doc = this.convertIdField(doc, 'clientId');
    doc = this.convertIdField(doc, 'productId');
    doc = this.convertIdField(doc, 'mallId');
    doc = this.convertIdField(doc, 'accountId');
    doc = this.convertIdField(doc, 'orderId');
    doc = this.convertIdField(doc, 'fromId');
    doc = this.convertIdField(doc, 'toId');

    if (doc && doc.hasOwnProperty('$or')) {
      const items: any[] = [];
      doc['$or'].map((it: any) => {
        if (it && it.hasOwnProperty('toId') && typeof it.toId === 'string' && it.toId.length === 24) {
          items.push({ toId: new ObjectID(it.toId) });
        } else if (it && it.hasOwnProperty('fromId') && typeof it.fromId === 'string' && it.fromId.length === 24) {
          items.push({ fromId: new ObjectID(it.fromId) });
        } else {
          items.push(it);
        }
      });
      doc['$or'] = items;
    }

    if (doc && doc.hasOwnProperty('items')) {
      doc['items'].map((it: any) => {
        if (it && it.hasOwnProperty('productId')) {
          const productId = it.productId;
          if (typeof productId === 'string' && productId.length === 24) {
            it.productId = new ObjectID(productId);
          }
        }
      });
    }

    if (doc && doc.hasOwnProperty('ownerIds')) {
      const ids: ObjectID[] = [];
      doc['ownerIds'].map((id: any) => {
        if (id) {
          if (typeof id === 'string' && id.length === 24) {
            ids.push(new ObjectID(id));
          }
        }
      });
      doc['ownerIds'] = ids;
    }

    return doc;
  }

  async bulkUpdate(items: any[], options?: any): Promise<any> {
    const c: Collection = await this.getCollection();
    const clonedArray: any[] = [...items];
    const a: any[] = [];

    clonedArray.forEach(item => {
      let query = item.query;
      let doc = item.data;

      query = this.convertIdFields(query);
      doc = this.convertIdFields(doc);
      a.push({ updateOne: { filter: query, update: { $set: doc }, upsert: true } });
    });

    if (a && a.length > 0) {
      await c.bulkWrite(a, options);
    }
    return { status: DbStatus.SUCCESS, msg: '' };
  }

  // use for test
  bulkDelete(queries: any[], options?: any): Promise<DbResult> {
    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        const clonedArray: any[] = JSON.parse(JSON.stringify(queries));
        const a: any[] = [];

        clonedArray.map(query => {
          query = this.convertIdFields(query);
          delete query['id'];
          a.push({ deleteOne: { filter: query } });
        });

        c.bulkWrite(a, (err: MongoError, result: BulkWriteOpResultObject) => {
          if (err) {
            const s: any = err.errmsg;
            resolve({ status: DbStatus.FAIL, msg: s });
          } else {
            resolve({ status: DbStatus.SUCCESS, msg: '' });
          }
        });
      });
    });
  }

  // deprecated
  replaceById(id: string, doc: any, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        doc = this.convertIdFields(doc);
        c.replaceOne({ _id: new ObjectId(id) }, doc, options, (err, result: any) => {
          if (result.ops) {
            let obj = result.ops[0]
            if (obj && obj._id) {
              obj.id = obj._id;
              // delete (obj._id);
            }
            resolve(obj);
          } else {
            console.log('replaceById failed.');
            reject();
          }
        });
      });
    });
  }



  deleteById(id: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        c.deleteOne({ _id: new ObjectId(id) }, (err, doc) => { // DeleteWriteOpResultObject
          resolve(doc);
        });
      });
    });
  }

  insertMany(items: any[]): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        items.map(it => {
          it = this.convertIdFields(it);
        });

        c.insertMany(items, {}, (err: MongoError, r: any) => { //InsertWriteOpResult
          if (!err) {
            resolve(r.ops);
          } else {
            reject(err);
          }
        });
      });
    });
  }


  deleteMany(query: any, options?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getCollection().then((c: Collection) => {
        query = this.convertIdFields(query);
        c.deleteMany(query, options, (err, ret) => { // DeleteWriteOpResultObject
          resolve(ret); // ret.deletedCount
        });
      });
    });
  }
}