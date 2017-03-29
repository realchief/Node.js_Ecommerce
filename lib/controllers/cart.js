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
   * @api {post} /cart/create.json Create Cart
   * @apiName CreateCart
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {get} /cart/:_id/read.json Read Cart
   * @apiName ReadCart
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {put} /cart/:_id/update.json Update Cart
   * @apiName UpdateCart
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {post} /cart/:_id/product/create.json Add Product to Cart
   * @apiName CreateCartProduct
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {put} /cart/:_id/product/:_id/update.json Update Product in Cart
   * @apiName UpdateCartProduct
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {delete} /cart/:_id/product/:_id/delete.json Delete Product in Cart
   * @apiName DeleteCartProduct
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {delete} /cart/:_id/delete.json Delete Cart
   * @apiName DeleteCart
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */

  /**
   * @api {get} /cart/list.json List Carts
   * @apiName ListCart
   * @apiGroup Cart
   * @apiPermission admin
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
