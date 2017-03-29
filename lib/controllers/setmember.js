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
   * @api {post} /setmember/create.json Create Setmember
   * @apiName Create Setmember
   * @apiGroup Setmember
   * @apiPermission admin
   *
   * @apiParam {String} name unique name of setmember
   * @apiParam {LocalizationObject} label localized label (e.g. name) of setmember
   * @apiParam {String} label.us label (e.g. name) of setmember in US locality
   * @apiParam {LocalizationObject} description localized description of setmember
   * @apiParam {String} description.us description of setmember in US locality
   * @apiParam {Object} identities social media accounts for setmember
   * @apiParam {String} identities.facebook Facebook account for setmember
   * @apiParam {String} identities.twitter Twitter account for setmember
   * @apiParam {String} identities.instagram Instagram account for setmember
   * @apiParam {String} identities.youtube Youtube account for setmember
   * @apiParam {String} identities.snapchat Snapchat account for setmember
   * @apiParam {String} identities.pinterest Pinterest account for setmember
   * @apiParam {String[]} users unique _ids of user accounts for setmember
   *
   * @apiSuccess {String} _id unique identifier of user
   * @apiSuccess {String} name unique name of setmember
   * @apiSuccess {LocalizationObject} label localized label (e.g. name) of setmember
   * @apiSuccess {String} label.us label (e.g. name) of setmember in US locality
   * @apiSuccess {LocalizationObject} description localized description of setmember
   * @apiSuccess {String} description.us description of setmember in US locality
   * @apiSuccess {Object} identities social media accounts for setmember
   * @apiSuccess {String} identities.facebook Facebook account for setmember
   * @apiSuccess {String} identities.twitter Twitter account for setmember
   * @apiSuccess {String} identities.instagram Instagram account for setmember
   * @apiSuccess {String} identities.youtube Youtube account for setmember
   * @apiSuccess {String} identities.snapchat Snapchat account for setmember
   * @apiSuccess {String} identities.pinterest Pinterest account for setmember
   * @apiSuccess {String[]} users unique _ids of user accounts for setmember
   * @apiSuccess {Number} created_at epoch timestamp of when user was created
   * @apiSuccess {Number} updated_at epoch timestamp of when user account was last updated
   *
   * @apiSuccessExample Success-Response:
   *     HTTP/1.1 200 OK
   *     {
   *       "data":   {
   *         "_id": "1234bCad"
   *       , "name": "Krusty the Clown"
   *       , "label": {
   *           "us": "Krusty the Clown"
   *         }
   *       , "description": {
   *           "us": "Krusty is one of the world's leading influencers, thinkers, and cultural icons"
   *         }
   *       , "identities": {
   *           "facebook": "krusty"
   *         , "twitter": "krustyclown"
   *         , "instagram": "krusty"
   *         , "youtube": "krustyTV"
   *         , "snapchat": "krusty"
   *         , "pinterest": "krustylu"
   *         }
   *       , "users": [
   *           "aFd234bCad"
   *         ]
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

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
