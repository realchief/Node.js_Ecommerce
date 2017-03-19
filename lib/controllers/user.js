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
  S = Validate(S);
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });

  /**
   * @api {get} /user/:_id/read.json Read User information
   * @apiName ReadUser
   * @apiGroup User
   * @apiPermission admin, current user
   *
   * @apiParam {Number} _id User's unique identifier.
   *
   * @apiSuccess {Number} _id unique identifier of user
   * @apiSuccess {String} name full name of user
   * @apiSuccess {String} email email of user
   * @apiSuccess {Object} locality locality of user
   * @apiSuccess {String} locality.name name of locality (e.g. "us")
   * @apiSuccess {String} locality.long_name full name of locality (e.g. "United States")
   * @apiSuccess {String} locality.language ISO code language of locality (e.g. "en")

   * @apiSuccess {Object[]} addresses List of addresses of user.

   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "firstname": "John",
   *       "lastname": "Doe"
   *     }
   *
   * @apiError UserNotFound The id of the User was not found.
   *
   * @apiErrorExample Error-Response:
   *     HTTP/1.1 404 Not Found
   *     {
   *       "error": "UserNotFound"
   *     }
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
