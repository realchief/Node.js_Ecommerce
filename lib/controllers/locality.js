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
   * @api {post} /locality/create.json Create Locality
   * @apiName Create Locality
   * @apiGroup Locality
   * @apiPermission admin
   *
   * @apiParam {String} name name of locality
   * @apiParam {String} long_name full name of locality
   * @apiParam {String} language ISO code for language in locality
   *
   * @apiSuccess {String} _id unique identifier of category
   * @apiSuccess {String} name name of locality
   * @apiSuccess {String} long_name full name of locality
   * @apiSuccess {String} language ISO code for language in locality
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "us"
   *       , "long_name": "United States"
   *       , "language": "en"
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
   * @api {get} /locality/:_id/read.json Read Locality
   * @apiName ReadLocality
   * @apiGroup Locality
   * @apiPermission public
   *
   */

  /**
   * @api {put} /locality/:_id/update.json Update Locality
   * @apiName UpdateLocality
   * @apiGroup Locality
   * @apiPermission admin
   *
   */

  /**
   * @api {delete} /locality/:_id/delete.json Delete Locality
   * @apiName DeleteLocality
   * @apiGroup Locality
   * @apiPermission admin
   *
   */

  /**
   * @api {get} /locality/list.json List Localities
   * @apiName ListLocality
   * @apiGroup Locality
   * @apiPermission public
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
