import { Injectable } from '@angular/core';
import { AuthService } from '../account/auth.service';
import { HttpClient } from '../../../node_modules/@angular/common/http';
import { EntityService } from '../entity.service';
import * as moment from 'moment';
import { IRestaurant } from '../restaurant/restaurant.model';

@Injectable({
  providedIn: 'root'
})
export class MerchantService extends EntityService {
  constructor(
    public authSvc: AuthService,
    public http: HttpClient
  ) {
    super(authSvc, http);
    this.url = super.getBaseUrl() + 'Restaurants';
  }


  isAfterOrderDeadline(restaurant) {
    if (restaurant.orderDeadline) {
      const a = restaurant.orderDeadline.split(':');
      if (a && a.length > 1) {
        const now = moment();
        const deadline = moment().set({ hours: +a[0], minutes: +a[1], seconds: 0 });
        return now.isAfter(deadline);
      } else {
        return true;
      }
    } else {
      return true;
    }
  }


  // dateTime --- moment object
  isClosed(restaurant: IRestaurant, dateTime: any) {

    if (restaurant.closed) { // has special close day
      if (restaurant.closed.find(d => moment(d).isSame(dateTime, 'day'))) {
        return true;
      } else {
        return this.isClosePerWeek(restaurant, dateTime);
      }
    } else {
      return this.isClosePerWeek(restaurant, dateTime);
    }
  }

  // dateTime --- moment object
  isClosePerWeek(restaurant: IRestaurant, dateTime: any) {
    if (restaurant.dow) {
      const days = restaurant.dow.split(',');
      if (days && days.length > 0) {
        const r = days.find(d => dateTime.day() === +d);
        return r ? false : true;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }
}