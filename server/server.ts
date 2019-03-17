
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import fs from "fs";
import path from "path";

import { DB } from "./db";
import { User } from "./user";
import { Restaurant } from "./restaurant";
import { Product } from "./product";

const cfg = JSON.parse(fs.readFileSync('../duocun.cfg.json', 'utf-8'));
const SERVER = cfg.API_SERVER;
const ROUTE_PREFIX = SERVER.ROUTE_PREFIX;

const app = express();
const dbo = new DB();
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'uploads/')
  },
  filename: function (req: any, file, cb) {
      cb(null, req.body.fname);
  }
});
const upload = multer({ storage: storage });

dbo.init(cfg.DATABASE).then(dbClient => {
  const user = new User(dbo);
  user.findOne({username: 'admin'}).then(x => {
    if(x){
      console.log('database duocun exists ...');
    }else{
      user.insertOne({username:'guest', password:'', type:'user'}).then((x: any) => {
        console.log('create database duocun and guest account ...');
        // res.setHeader('Content-Type', 'application/json');
        // res.end(JSON.stringify(x.ops[0], null, 3))
      });
    }
  });
});

app.use(cors());

app.use(bodyParser.urlencoded({ extended: false, limit: '1mb' }));
app.use(bodyParser.json({ limit: '1mb' }));

const uploadsPath = path.resolve('uploads');
console.log(uploadsPath);
app.use(express.static(uploadsPath));

app.get('/' + ROUTE_PREFIX + '/users', (req, res) => {
  const user = new User(dbo);
  // user.insertOne('Jack').then((x: any) => {
  //   res.setHeader('Content-Type', 'application/json');
  //   res.end(JSON.stringify(x.ops[0], null, 3))
  // });
});

app.post('/' + ROUTE_PREFIX + '/Accounts/login', (req, res) => {
  const user = new User(dbo);
  user.login(req, res);
});
app.post('/' + ROUTE_PREFIX + '/Accounts/signup', (req, res) => {
  const user = new User(dbo);
  user.signup(req, res);
});
app.get('/' + ROUTE_PREFIX + '/Accounts/:id', (req, res) => {
  const user = new User(dbo);
  user.get(req, res);
});

app.post('/' + ROUTE_PREFIX + '/Restaurants', (req, res) => {
  const restaurant = new Restaurant(dbo);
  restaurant.insertOne(req.body).then((x: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(x.ops[0], null, 3))
  });
});

app.get('/' + ROUTE_PREFIX + '/Restaurants', (req, res) => {
  const restaurant = new Restaurant(dbo);
  restaurant.find({}).then((x: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(x, null, 3))
  });
});

app.get('/' + ROUTE_PREFIX + '/Restaurants/:id', (req, res) => {
  const restaurant = new Restaurant(dbo);
  restaurant.get(req, res);
});

app.get('/' + ROUTE_PREFIX + '/Restaurants/:id/Products', (req, res) => {
  const product = new Product(dbo);
  product.find({restaurantId: req.params.id}).then((x: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(x, null, 3))
  });
});

app.post('/' + ROUTE_PREFIX + '/Products', (req, res) => {
  const product = new Product(dbo);
  product.insertOne(req.body).then((x: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(x.ops[0], null, 3))
  });
});

app.get('/' + ROUTE_PREFIX + '/Products', (req, res) => {
  const product = new Product(dbo);
  product.find({}).then((x: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(x, null, 3))
  });
});

app.get('/' + ROUTE_PREFIX + '/Products/:id', (req, res) => {
  const product = new Product(dbo);
  product.get(req, res);
});

app.post('/' + ROUTE_PREFIX + '/files/upload', upload.single('file'), (req, res, next) => {
  res.send('upload file success');
});

app.set('port', process.env.PORT || SERVER.PORT)

const server = app.listen(app.get("port"), () => {
  console.log("API is running on :%d", app.get("port"));
});

// const http = require('http');
// const express = require('express')
// const path = require('path')
// const fs = require('fs');
// const cfg = JSON.parse(fs.readFileSync('../duocun.cfg.json','utf8'));
// const DB = require('./db');
// // const User = require('./user');


// const SERVER = cfg.API_SERVER;
// const ROUTE_PREFIX = SERVER.ROUTE_PREFIX;

// const app = express();
// const db = DB().init(cfg.DATABASE);



// console.log(__dirname + '/dist');

// // app.use(express.static(__dirname + '/dist'));
// // app.get('*',function(req,res){
// //     res.sendFile(path.join(__dirname, '/dist/index.html'));
// // });
// //app.listen(SERVER_PORT, () => console.log('Server setup'))



// app.set('port', process.env.PORT || SERVER.PORT)

// var server = http.createServer(app)
// server.listen(app.get('port'), function () {
//   console.log('API server listening on port ' + SERVER.PORT)
// })