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
  , CRUD = require('./helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
;

module.exports = function(S){
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  /**
   * @api {post} /category/create.json Create Category
   * @apiName Create Category
   * @apiGroup Category
   * @apiPermission admin
   *
   * @apiParam {String} name name of category
   * @apiParam {LocalizationObject} label localized label (e.g. name) of category
   * @apiParam {String} label.us label (e.g. name) of category in US locality
   * @apiParam {String} parent_category unique _id of parent category for category
   *
   * @apiSuccess {String} _id unique identifier of category
   * @apiSuccess {String} name unique name of category
   * @apiSuccess {LocalizationObject} label localized label (e.g. name) of category
   * @apiSuccess {String} label.us label (e.g. name) of category in US locality
   * @apiSuccess {Object} parent_category parent category of category (if applicable)
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "Polos"
   *       , "label": {
   *           "us": "Polos"
   *         }
   *       , "parent_category": {
   *           "_id": "24fjm49m"
   *         , "name": "Shirts"
   *         , "label": {
   *             "us": "Shirts"
   *           }
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
   * @api {get} /category/:_id/read.json Read Category
   * @apiName ReadCategory
   * @apiGroup Category
   * @apiPermission public
   *
   * @apiParam {String} _id unique identifier of category
   */

  /**
   * @api {put} /category/:_id/update.json Update Category
   * @apiName UpdateCategory
   * @apiGroup Category
   * @apiPermission admin
   *
   * @apiParam {String} _id unique identifier of category
   * @apiSuccess {String} name unique name of category
   * @apiSuccess {LocalizationObject} label localized label (e.g. name) of category
   * @apiSuccess {String} label.us label (e.g. name) of category in US locality
   * @apiSuccess {Object} parent_category parent category of category (if applicable)
   */

  /**
   * @api {delete} /category/:_id/delete.json Delete Category
   * @apiName DeleteCategory
   * @apiGroup Category
   * @apiPermission admin
   *
   * @apiParam {String} _id unique identifier of category
   */

  /**
   * @api {get} /category/list.json List Categories
   * @apiName ListCategory
   * @apiGroup Category
   * @apiPermission public
   *
   * @apiParam {Object} query query criteria of setmembers
   * @apiParam {Number} skip skip to this record number
   * @apiParam {Number} limit limit to this number of records returned
   * @apiParam {Object} sort sort criteria of setmembers
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
