#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , Str = require('underscore.string')
  , Request = require('request')
  , CRUD = require('../../node_modules/basecmd/lib/controllers/helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
;

module.exports = function(S){
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  /**
   * @api {post} /order/create.json Create Order
   * @apiName CreateOrder
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {get} /order/:_id/read.json Read Order
   * @apiName ReadOrder
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {put} /order/:_id/update.json Update Order
   * @apiName UpdateOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /order/:_id/delete.json Delete Order
   * @apiName DeleteOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {get} /order/list.json List Orders
   * @apiName ListOrder
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {post} /order/:_id/cancel.json Cancel and Refund Order
   * @apiName CancelOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /order/:_id/product/create.json Add Product to Order
   * @apiName CreateOrderProduct
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /order/:_id/product/:product/update.json Update Product in Order
   * @apiName UpdateOrderProduct
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /order/:_id/product/:product/delete.json Delete Product from Order
   * @apiName DeleteOrderProduct
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /order/:_id/line_item/create.json Add Line Item to Order
   * @apiName CreateOrderLineItem
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /order/:_id/line_item/:line_item/update.json Update Line Item in Order
   * @apiName UpdateOrderLineItem
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /order/:_id/line_item/:line_item/delete.json Delete Line Item from Order
   * @apiName DeleteOrderLineItem
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /order/:_id/transaction/create.json Create Transaction for Order
   * @apiName CreateOrderTransaction
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /order/:_id/transaction/:transaction/cancel.json Cancel / Refund Transaction from Order
   * @apiName CancelOrderTransaction
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /order/:_id/shipment/create.json Add Shipment to Order
   * @apiName CreateOrderShipment
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {put} /order/:_id/shipment/:shipment/update.json Update Shipment in Order
   * @apiName UpdateOrderShipment
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /order/:_id/shipment/:shipment/delete.json Delete Shipment from Order
   * @apiName DeleteOrderShipment
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  /**
   * @api {post} /order/:_id/message/create.json Add Message to Order
   * @apiName CreateOrderMessage
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {put} /order/:_id/message/:message/update.json Update Message in Order
   * @apiName UpdateOrderMessage
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {delete} /order/:_id/message/:message/delete.json Delete Message from Order
   * @apiName DeleteOrderMessage
   * @apiGroup Order
   * @apiPermission admin
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
