import express from "express";
import { PickupByOrderController } from "../controllers/pickup-by-order-controller";
import { DB } from "../db";
import { PickupByOrder } from "../models/pickup-by-order";

export function PickupByOrderRouter(db: DB){
  const router = express.Router();
  const model = new PickupByOrder(db);
  const controller = new PickupByOrderController(model, db);

  router.get('/', (req, res) => { controller.list(req, res); });
  router.put('/:id', (req, res) => { controller.updateOne(req, res); });
  router.post('/', (req, res) => { controller.create(req, res); });

  router.get('/:id', (req, res) => { model.get(req, res); });
  router.patch('/', (req, res) => { model.update(req, res); });
  router.delete('/', (req, res) => { model.remove(req, res); });

  return router;
};
