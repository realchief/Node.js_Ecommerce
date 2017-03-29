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
   * @api {post} /set/create.json Create Set
   * @apiName CreateSet
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {get} /set/:_id/read.json Read Set
   * @apiName ReadSet
   * @apiGroup Set
   * @apiPermission public
   *
   */

  /**
   * @api {put} /set/:_id/update.json Update Set
   * @apiName UpdateSet
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /set/:_id/delete.json Delete Set
   * @apiName DeleteSet
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {get} /set/list.json List Sets
   * @apiName ListSet
   * @apiGroup Set
   * @apiPermission public
   *
   */

  /**
   * @api {put} /set/:_id/product/create.json Add Product to Set
   * @apiName CreateSetProduct
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /set/:_id/product/:product/delete.json Delete Product from Set
   * @apiName DeleteSetProduct
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {put} /set/:_id/media/create.json Add Media to Set
   * @apiName CreateSetMedia
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /set/:_id/media/:media/delete.json Delete Media from Set
   * @apiName DeleteSetMedia
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {put} /set/:_id/setmember/create.json Add Setmember to Set
   * @apiName CreateSetSetmember
   * @apiGroup Media
   * @apiPermission admin, current setmember user
   *
   */

  /**
   * @api {delete} /set/:_id/setmember/:setmember/delete.json Delete Setmember from Set
   * @apiName DeleteSetSetmember
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
