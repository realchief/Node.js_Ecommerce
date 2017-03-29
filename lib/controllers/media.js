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
   * @api {post} /media/create.json Create Media
   * @apiName Create Media
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   * @apiHeader {String} Content-Type =multipart/form-data content type of request
   *
   * @apiParam {File} file uploaded file
   * @apiParam {String} url url to download media file from (if file not included in request)
   * @apiParam {LocalizationObject} label localized label (e.g. name) of setmember
   * @apiParam {String} label.us label (e.g. name) of setmember in US locality
   * @apiParam {LocalizationObject} description localized description of setmember
   * @apiParam {String} description.us description of setmember in US locality
   * @apiParam {Object[]} products products featured in this media
   * @apiParam {String} products.product unique _id of product in media
   * @apiParam {Number} products.x_coordinate horizontal location of product in media
   * @apiParam {Number} products.y_coordinate vertical location of product in media
   * @apiParam {Object} products.options options (e.g. size, color) of product featured in media
   * @apiParam {Object[]} setmembers setmembers featured in this media
   * @apiParam {String} setmembers.setmember unique _id of setmembers in media
   * @apiParam {Number} setmembers.x_coordinate horizontal location of setmembers in media
   * @apiParam {Number} setmembers.y_coordinate vertical location of setmembers in media
   *
   * @apiSuccess {String} _id unique identifier of category
   * @apiSuccess {String} url url to download media file from (if file not included in request)
   * @apiSuccess {LocalizationObject} label localized label (e.g. name) of media
   * @apiSuccess {String} label.us label (e.g. name) of media in US locality
   * @apiSuccess {LocalizationObject} description localized description of media
   * @apiSuccess {String} description.us description of media in US locality
   * @apiSuccess {Object[]} products products featured in this media
   * @apiSuccess {Object} products.product product in media
   * @apiSuccess {Number} products.x_coordinate horizontal location of product in media
   * @apiSuccess {Number} products.y_coordinate vertical location of product in media
   * @apiSuccess {Object} products.options options (e.g. size, color) of product featured in media
   * @apiSuccess {Object[]} setmembers setmembers featured in this media
   * @apiSuccess {Object} setmembers.setmember setmember in media
   * @apiSuccess {Number} setmembers.x_coordinate horizontal location of setmembers in media
   * @apiSuccess {Number} setmembers.y_coordinate vertical location of setmembers in media
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {

   *       }
   *     }
   *
   * @apiError NotPermitted Current user not permitted to perform operation
   *
   * @apiErrorExample NotPermitted:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "NotPermitted"
   *     }
   *
   * @apiError Error Error messages vary. Errors are returned for various data validation, missing field, and duplicate value issues
   *
   * @apiErrorExample ExampleError:
   *     HTTP/1.1 200 OK
   *     {
   *       "error": "ExampleError"
   *     }
   */

  /**
   * @api {get} /media/:_id/read.json Read Media
   * @apiName ReadMedia
   * @apiGroup Media
   * @apiPermission public
   *
   */

  /**
   * @api {put} /media/:_id/update.json Update Media
   * @apiName UpdateMedia
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /media/:_id/delete.json Delete Media
   * @apiName DeleteMedia
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {get} /media/list.json List Media
   * @apiName ListMedia
   * @apiGroup Media
   * @apiPermission public
   *
   */

  /**
   * @api {put} /media/:_id/product/create.json Add Product to Media
   * @apiName CreateMediaProduct
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /media/:_id/product/:product/delete.json Delete Product from Media
   * @apiName DeleteMediaProduct
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {put} /media/:_id/setmember/create.json Add Setmember to Media
   * @apiName CreateMediaSetmember
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /media/:_id/setmember/:setmember/delete.json Delete Setmember from Media
   * @apiName DeleteMediaSetmember
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
