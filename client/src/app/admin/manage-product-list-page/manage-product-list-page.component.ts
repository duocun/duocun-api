import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { Product } from '../../shared/lb-sdk';
import { environment } from '../../../environments/environment';
import { NgRedux } from '@angular-redux/store';
import { IAppState } from '../../store';
import { RestaurantService } from '../../restaurant/restaurant.service';

@Component({
    selector: 'app-manage-product-list-page',
    templateUrl: './manage-product-list-page.component.html',
    styleUrls: ['./manage-product-list-page.component.scss']
})
export class ManageProductListPageComponent implements OnInit {
    products: Product[];
    constructor(private route: ActivatedRoute,
        private restaurantSvc: RestaurantService,
        private rx: NgRedux<IAppState>) {
        const self = this;

        this.route.queryParams.subscribe(params => {
            const restaurant_id = params['restaurant_id'];
            self.restaurantSvc.getProducts(restaurant_id).subscribe(
                (ps: Product[]) => {
                    self.products = ps;
                });
        });
    }

    ngOnInit() {
    }

}
