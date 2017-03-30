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
   * @api {post} /vendor/create.json Create Vendor
   * @apiName CreateVendor
   * @apiGroup Vendor
   * @apiPermission admin
   *
   * @apiParam {String} name unique name of vendor
   * @apiParam {LocalizationObject} label localized label (e.g. name) of vendor
   * @apiParam {String} label.us label (e.g. name) of vendor in US locality
   * @apiParam {LocalizationObject} description localized description of vendor
   * @apiParam {String} description.us description of vendor in US locality
   * @apiParam {LocalizationObject} shipping_description localized description of vendor's shipping policies
   * @apiParam {String} shipping_description.us description of vendor's shipping policies in US locality
   * @apiParam {LocalizationObject} returns_description localized description of vendor's returns policies
   * @apiParam {String} returns_description.us description of vendor's returns policies in US locality
   * @apiParam {String[]} setmembers unique _ids of setmembers connected to this brand
   *
   * @apiSuccess {String} _id unique identifier of user
   * @apiSuccess {String} name unique name of vendor
   * @apiSuccess {LocalizationObject} label localized label (e.g. name) of vendor
   * @apiSuccess {String} label.us label (e.g. name) of vendor in US locality
   * @apiSuccess {LocalizationObject} description localized description of vendor
   * @apiSuccess {String} description.us description of vendor in US locality
   * @apiSuccess {LocalizationObject} shipping_description localized description of vendor's shipping policies
   * @apiSuccess {String} shipping_description.us description of vendor's shipping policies in US locality
   * @apiSuccess {LocalizationObject} returns_description localized description of vendor's returns policies
   * @apiSuccess {Object[]} setmembers setmembers connected to this brand
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "Acme"
   *       , "label": {
   *           "us": "Acme Products"
   *         }
   *       , "description": {
   *           "us": "Creators of fine and non-generic products"
   *         }
   *       , "shipping_description": {
   *           "us": "Free two-day shipping"
   *         }
   *       , "returns_description": {
   *           "us": "Return for any reason with 30-days"
   *         }
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
   * @api {get} /vendor/:_id/read.json Read Vendor
   * @apiName ReadVendor
   * @apiGroup Vendor
   * @apiPermission public
   *
   */

  /**
   * @api {put} /vendor/:_id/update.json Update Vendor
   * @apiName UpdateVendor
   * @apiGroup Vendor
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /vendor/:_id/delete.json Delete Vendor
   * @apiName DeleteVendor
   * @apiGroup Vendor
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {get} /vendor/list.json List Vendors
   * @apiName ListVendors
   * @apiGroup Vendor
   * @apiPermission public
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
