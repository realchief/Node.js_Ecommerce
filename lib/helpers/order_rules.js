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
  , FS = require('fs')
  //, PromoCodes = require('../../resources/assets/promo_codes.json')
;

module.exports = function(S){
//  S.instance['promo_codes'] = PromoCodes;

/*
  S.instance.on('ready', function(){
    _.each(S.instance.promo_codes, function(v, k){
      console.log('Creating promo code "' + k + '"')

      S.instance.db.model('promo_code').create(_.extend(v, {
        'code': k
      , 'active': true
      }), function(err){
        console.log(err);
      });
    })
  });
*/

  S['ProcessCartRules'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //cart
    });

    Async.waterfall([
      function(cb){
        gb['line_items'] = a.o.cart.line_items;

        a.o.cart.set({
          'line_items': []
        });

        if ((a.o.cart.get('recipient.country') || '').match(/^(AE|AU|NZ)$/i)){
          a.o.cart.line_items.push({
            'label': 'INTERNATIONAL SHIPPING'
          , 'type': 'shipping'
          , 'amount': 30
          });
        } else if ((a.o.cart.get('recipient.country') || '').match(/^(US|CA)$/i)){
          a.o.cart.line_items.push({
            'label': 'FREE SHIPPING'
          , 'type': 'shipping'
          , 'amount': 0
          });
        } else {
          a.o.cart.line_items.push({
            'label': 'INTERNATIONAL SHIPPING'
          , 'type': 'shipping'
          , 'amount': 20
          });
        }

        gb['promo_codes'] = _.filter(gb.line_items, function(l){
          return Belt.get(l, 'details.promo_code');
        });

        gb['promo_code'] = _.last(gb.promo_codes);

        if (!gb.promo_code) return cb();

        gb.code = Belt.get(gb, 'promo_code.details.promo_code');

        self.instance.db.model('promo_code').findOne({
          'code': gb.code
        }, function(err, doc){
          if (
               !doc
            || !doc.active
            || (doc.max_claims && doc.claims >= doc.max_claims)
          ) return cb(new Error(Belt.get(doc, 'error_label') || 'Promo code is invalid'));

          if (doc.discount_type === 'percentage'){
            gb.promo_code.amount = a.o.cart.get('total_price') * doc.discount_amount * -1;
          }

          if (doc.discount_type === 'fixed'){
            gb.promo_code.amount = a.o.cart.get('total_price') + (doc.discount_amount * -1);
          }

          gb.promo_code.amount = _.min([
            gb.promo_code.amount
          , a.o.cart.get('total_price')
          ]);

          a.o.cart.line_items.push(gb.promo_code);

          cb();
        });
      }
    , function(cb){
        if ((a.o.cart.get('buyer.country') || '').match(/^(US)$/i) && (a.o.cart.get('buyer.region') || '').match(/^(CA|MA)$/i)){
          a.o.cart.line_items.push({
            'label': 'Sales Tax - 7%'
          , 'type': 'tax'
          , 'amount': Math.round(a.o.cart.get('total_price') * 0.07 * 100) / 100
          });
        }

        cb();
      }
    ], function(err){
console.log(a.o.cart.line_items)
      a.cb(err, a.o.cart);
    });
  };

  S['AuthorizeOrder'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //order
    });

    if (Belt.get(a.o.order, 'recipient.postal_code') !== Belt.get(a.o.order, 'buyer.postal_code')
    && self.instance.LevenshteinDistance(
        Belt.get(a.o.order, 'buyer.cardholder_name')
      , Belt.get(a.o.order, 'recipient.first_name') + ' ' + Belt.get(a.o.order, 'recipient.last_name')
      ) > 5
    ){
      a.o.order.set({
        'support_status': 'possible fraud'
      , 'notes': 'Flagged as possible fraud. Check with Mark for approval before processing.'
      });
      return false;
    }

    return true;
  };

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err) S.emit('error', err);

      return S.emit('ready');
    });
  }, 0);
};
