
import moment from "moment";
import axios from "axios";

export const AppId = {
  API_V1: 'apiv1',
  API_V2: 'apiv2',
  WX_API: 'wx',
  PROXY: 'proxy',
  MALL:   'mall',
  DRIVER: 'driver'
}

export interface ILog {
  _id?: string;
  appId?: string;
  msg: string;
  created?: string;
}

export const Log = {
  async save(data: ILog) {
    const url = `${process.env.LOG_SVC_URL}`;
    const payload = { ...data, created: moment().toISOString()};
    if(!payload.appId){
      payload.appId = AppId.API_V1;
    }
    return await axios.post(url, payload);
  }

  // list(req: Request, res: Response) {
  //   let query = null;
  //   if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
  //     query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
  //   }


  //   this.joinFind(query).then((rs: any) => {
  //     res.setHeader('Content-Type', 'application/json');
  //     if (rs) {
  //       res.send(JSON.stringify(rs, null, 3));
  //     } else {
  //       res.send(JSON.stringify(null, null, 3))
  //     }
  //   });
  // }

  // reqAllLatest(req: Request, res: Response){
  //   let query = null;
  //   if (req.headers && req.headers.filter && typeof req.headers.filter === 'string') {
  //     query = (req.headers && req.headers.filter) ? JSON.parse(req.headers.filter) : null;
  //   }

  //   this.getLatestByAccount(query.action, query.type, query.delivered).then((rs: any) => {
  //     res.setHeader('Content-Type', 'application/json');
  //     if (rs) {
  //       res.send(JSON.stringify(rs, null, 3));
  //     } else {
  //       res.send(JSON.stringify(null, null, 3))
  //     }
  //   });
  // }

  // getLatest(logs: any[]){
  //   if(logs && logs.length > 0){
  //     if(logs.length > 1){
  //       let tmp = logs[0];
  //       for(let i=1; i<logs.length; i++){
  //         if(moment(tmp.created).isBefore(moment(logs[i].created))){
  //           tmp = logs[i];
  //         }
  //       }
  //       return tmp;
  //     }else{
  //       return logs[0];
  //     }
  //   }else{
  //     return null;
  //   }
  // }

  // groupBy(items: any[], key: string) {
  //   const groups: any = {};
  //   items.map(it => {
  //     const id = it[key].toString();
  //     const ids = Object.keys(groups);
  //     const found = ids.length === 0 ? null : ids.find(_id => _id === id);
  //     if (found) {
  //       groups[id].push(it);
  //     } else {
  //       groups[id] = [it];
  //     }
  //   });

  //   return groups;
  // }

  // getLatestByAccount(actionId: number, accountType: number, delivered: string): Promise<any[]>{
  //   const range = { $gte: moment(delivered).startOf('day').toISOString(), $lte: moment(delivered).endOf('day').toISOString() };
  //   const query = { created: range, action: actionId, type: accountType };

  //   return new Promise((resolve, reject) => {
  //     this.joinFind(query).then(logs => {
  //       let groups: any = {};
  //       if(accountType === AccountType.MERCHANT){
  //         groups = this.groupBy(logs, 'merchantAccountId');
  //       }else{
  //         groups = this.groupBy(logs, 'accountId');
  //       }

  //       const rs: any[] = [];
  //       Object.keys(groups).map(id => {
  //         const ds = groups[id];
  //         const latest = this.getLatest(ds);
  //         if(latest){
  //           rs.push(latest);
  //         }
  //       });
  //       resolve(rs);
  //     });
  //   });
  // }

  // joinFind(query: any): Promise<IOrder[]> {
  //   let q = query ? query : {};

  //   return new Promise((resolve, reject) => {
  //     this.accountModel.find({}).then(accounts => {
  //       this.find(q).then((rs: any) => {
  //         rs.map((r: any) => {
  //           if(r.accountId){
  //             const account = accounts.find((a: any) => a._id.toString() === r.accountId.toString());
  //             if(account){
  //               if(account.password){
  //                 delete account.password;
  //               }
  //               r.account = account;
  //             }
  //           }
  //         });
  //         resolve(rs);
  //       });
  //     });
  //   });
  // }

}
