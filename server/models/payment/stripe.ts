export class Stripe {

  async stripeCreateCustomer(paymentMethodId: string) {
    // const stripe = require("stripe")(this.cfg.STRIPE.API_KEY);
    // try {
    //   const customer = await stripe.customers.create({
    //     payment_method: paymentMethodId,
    //   });
    //   const customerId = customer.id;
    //   return { customerId, err: PaymentError.NONE };
    // } catch(e) {
    //   console.error(e);
    //   return { err: e };
    // }
  }

  // metadata eg. { orderId: orderId, customerId: clientId, customerName: order.clientName, merchantName: order.merchantName };
  async stripePay(
    paymentMethodId: string,
    accountId: string,
    amount: number,
    currency: string,
    description: string,
    metadata: any
  ) {
    // const stripe = require("stripe")(this.cfg.STRIPE.API_KEY);
    // try {
    //   logger.info('Creating stripe customer');
    //   const rt = await this.stripeCreateCustomer(paymentMethodId);
    //   const customerId = rt.customerId;
      
    //   if (rt.err === PaymentError.NONE && customerId) {
    //     logger.info('Stripe customer created. ID: ' + customerId);
    //     logger.info('Creating payment intent');
    //     await stripe.paymentIntents.create({
    //       amount: Math.round(amount * 100),
    //       currency,
    //       customer: customerId,
    //       payment_method: paymentMethodId,
    //       error_on_requires_action: true,
    //       confirm: true,
    //       description,
    //       metadata,
    //     });
    //     return { status: ResponseStatus.SUCCESS, err: rt.err };
    //   }else{
    //     logger.info('Cannot create stripe customer, err: ' + rt.err);
    //     return { status: ResponseStatus.FAIL, err: rt.err };
    //   }
    // } catch (err) {
    //   // if (err.raw && err.raw.payment_intent) {
    //   //   const paymentIntentRetrieved = await stripe.paymentIntents.retrieve(
    //   //     err.raw.payment_intent.id
    //   //   );
    //   //   if(paymentIntentRetrieved){
    //   //     console.log('PI retrieved: ', paymentIntentRetrieved.id);
    //   //   }
    //   // }

    //   // add log into DB
    //   logger.error('Exception in stripePay');
    //   const type = err ? err.type : "";
    //   const code = err ? err.code : "N/A";
    //   const decline_code = err ? err.decline_code : "N/A";
    //   const message = 'type:' + type + ', code:' + code + ', decline_code' + decline_code + ', msg: ' + err ? err.message : "N/A";
    //   logger.error('Message: ' + message);
    //   await this.addLogToDB(accountId, "stripe error", '', message);

    //   let error = PaymentError.BANK_CARD_DECLIEND;
    //   if (err && err.code) {
    //     if (err.code === "authentication_required") {
    //       error = PaymentError.BANK_AUTHENTICATION_REQUIRED;
    //     }
    //   }
    //   return { status: ResponseStatus.FAIL, err: error };
    // }
  }


  async pay(paymentActionCode: string, paymentMethodId: string, accountId: string, accountName: string,
    amount: number, note: string, paymentId: string, merchantNames: string[]) {
    // const appType = req.body.appType;
    // let metadata = {};
    // let description = "";
    
    // if (paymentActionCode === PaymentAction.PAY.code) {
    //   metadata = { paymentId };
    //   description = accountName + " - Duocun Inc.";// merchantNames.join(',');
    // } else {
    //   metadata = { customerId: accountId, customerName: accountName };
    //   description = accountName + "add credit";
    // }


    // const orders = await this.orderEntity.find({ paymentId, status: { $nin: [OrderStatus.BAD, OrderStatus.DELETED] }, paymentStatus: { $ne: PaymentStatus.PAID }});

    // try {
    //   await this.orderEntity.validateOrders(orders);
    // } catch (e) {
    //   return {
    //     err: PaymentError.INVALID_ORDER,
    //     data: e
    //   }
    // }

    // const rsp = await this.stripePay(
    //   paymentMethodId,
    //   accountId,
    //   amount,
    //   "cad",
    //   description,
    //   metadata
    // );

    // const cc = {
    //   accountId,
    //   accountName,
    //   total: Math.round(amount * 100) / 100,
    //   paymentMethod: PaymentMethod.CREDIT_CARD,
    //   note,
    //   paymentId: paymentId ? paymentId : new ObjectID().toString(),
    //   status: PaymentStatus.UNPAID,
    // };

    // if (rsp.err === PaymentError.NONE) {
    //   logger.info("Insert credit");
    //   const c = await this.clientCreditModel.insertOne(cc);
    //   logger.info("Call process after pay");
    //   await this.orderEntity.processAfterPay(
    //       paymentId,
    //       TransactionAction.PAY_BY_CARD.code,
    //       amount,
    //       '' // rsp.chargeId
    //     );
    //   return rsp;
    // } else {
    //   logger.warn("Response error: " + rsp.err);
    //   return rsp;
    // }
    
  }
}