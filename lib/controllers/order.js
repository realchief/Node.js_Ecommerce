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

  S['notification_url'] = 'https://2po.st/hwU18Eioy4Ti';

  /**
   * @api {post} /order/create.json Create Order
   * @apiName CreateOrder
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */
    S.instance.express.post('/' + S.name + '/create.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          S.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!Belt.get(gb, 'doc.products.0')) return cb(new Error('Bag is empty'));

          gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          Request({
            'url': self.notification_url
          , 'method': 'post'
          , 'json': _.extend({}, a.o.data, {
              'cart': gb.doc.toSanitizedObject()
            })
          }, Belt.cw(cb));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        });
      });
    });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
