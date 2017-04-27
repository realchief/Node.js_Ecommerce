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
   */
    S.instance.express.post('/' + S.name + '/create.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          if (a.o.files.file){
            a.o.data['local_path'] = a.o.files.file.path;
          }

          self.model.create(a.o.data, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

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
