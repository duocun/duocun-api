import { DB } from "../db";
import { Model } from "./model";

export const UNASSIGNED_DRIVER_ID = 'unassigned';
export const UNASSIGNED_DRIVER_NAME = 'Unassigned';

export class Driver extends Model {
  constructor(dbo: DB) {
    super(dbo, 'drivers');
  }
}