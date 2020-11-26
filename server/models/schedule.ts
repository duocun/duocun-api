import express from 'express';

import { DB } from '../db';
import { Model } from './model';

export interface ISchedule {
  _id: string;
  title: string;
  description: string;
  areas: {
    areaId: string;
    periods: {
      startDate: string;
      endDate: string;
      dows: number[];
    }[];
  }[],
  endTimeMargin: string;
  startDate: string;
  endDate: string;
  appType: 'G';
  status: 'A' | 'I';
  created: string;
  modified: string;
}

export class Schedule extends Model {

  constructor(dbo: DB) {
    super(dbo, 'schedules');
  }
}
