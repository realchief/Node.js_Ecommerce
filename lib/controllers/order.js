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
          if (!Belt.get(a.o, 'data.token')) return cb(new Error('Payment method is missing'));

          S.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          if (!Belt.get(gb, 'cart.products.0')) return cb(new Error('Bag is empty'));

          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getShippingGroups(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          S.instance.stripe.customers.create({
            'source': a.o.data.token
          , 'metadata': Belt.objFlatten(_.pick(a.o.data, function(v, k){
              return k.match(/^billing/i);
            }))
          }, Belt.cs(cb, gb, 'customer_id', 1, 'id', 0));
        }
      , function(cb){
          if (!gb.customer_id) return cb(new Error('Customer information is invalid'));

          gb['doc'] = S.model({});

          gb.doc.set({
            'buyer': {
              'first_name': Belt.get(a.o, 'data.billing_first_name')
            , 'last_name': Belt.get(a.o, 'data.billing_last_name')
            , 'street': Belt.get(a.o, 'data.billing_address')
            , 'street_b': Belt.get(a.o, 'data.billing_address_2')
            , 'city': Belt.get(a.o, 'data.billing_city')
            , 'region': Belt.get(a.o, 'data.billing_first_name')
            , 'country': 'US'
            , 'postal_code': Belt.get(a.o, 'data.billing_postal_code')
            , 'phone': Belt.get(a.o, 'data.billing_phone')
            , 'email': Belt.get(a.o, 'data.billing_email')
            , 'payment_method': Belt.get(a.o, 'data.token')
            , 'payment_customer_id': gb.customer_id
            }
          , 'recipient': {
              'first_name': Belt.get(a.o, 'data.shipping_first_name')
            , 'last_name': Belt.get(a.o, 'data.shipping_last_name')
            , 'street': Belt.get(a.o, 'data.shipping_address')
            , 'street_b': Belt.get(a.o, 'data.shipping_address_2')
            , 'city': Belt.get(a.o, 'data.shipping_city')
            , 'region': Belt.get(a.o, 'data.shipping_first_name')
            , 'country': 'US'
            , 'postal_code': Belt.get(a.o, 'data.shipping_postal_code')
            , 'phone': Belt.get(a.o, 'data.shipping_phone')
            }
          , 'total_paid': 0
          , 'total_refunded': 0
          , 'total_outstanding': 0
          });

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          Request({
            'url': self.notification_url
          , 'method': 'post'
          , 'json': _.extend({}, _.omit(a.o.data, [
              'token'
            ]), {
              'cart': gb.cart.toSanitizedObject()
            , 'customer_id': gb.customer_id
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
