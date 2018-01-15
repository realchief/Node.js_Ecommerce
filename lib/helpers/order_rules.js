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
        a.o.cart.populateProducts(Belt.cs(cb, a.o, 'cart', 1, 0));
      }
    , function(cb){
        a.o.cart.getStocks(Belt.cs(cb, a.o, 'cart', 1, 0));
      }
    , function(cb){
        gb['rule_error'] = true;

        gb['line_items'] = a.o.cart.line_items;

        a.o.cart.set({
          'line_items': []
        });

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
            gb.promo_code.amount = _.min([
              doc.discount_amount
            , a.o.cart.get('total_price')
            ]) * -1;
          }

          a.o.cart.line_items.push(gb.promo_code);

          cb();
        });
      }
    , function(cb){
        if (a.o.cart.get('recipient.country') && !(a.o.cart.get('recipient.country') || '').match(/^(US)$/i)){
          var pot_id = _.chain(S.instance.vendor_names)
                        .keys()
                        .find(function(k){
                          return k.match(/pairofthieves$/i);
                        })
                        .value();

          pot_id = S.instance.vendor_names[pot_id];

          if (pot_id && _.some(a.o.cart.products, function(p){
            return Belt.get(p, 'product.vendor.toString()') === pot_id;
          })) return cb(new Error('Pair of Thieves items cannot be shipped outside the US. Please change your shipping country or remove them from your cart, and try again.'));
        }

        if ((a.o.cart.get('recipient.country') || '').match(/^(AE|AU|NZ|JP|KR|SG)$/i)){
          a.o.cart.line_items.push({
            'label': 'INTERNATIONAL SHIPPING'
          , 'type': 'shipping'
          , 'amount': 30
          });
        } else if (!a.o.cart.get('recipient.country') || (a.o.cart.get('recipient.country') || '').match(/^(US|CA)$/i)){
          if (gb.promo_code){
            a.o.cart.line_items.push({
              'label': 'FREE SHIPPING'
            , 'type': 'shipping'
            , 'amount': 0
            });
          } else {
            a.o.cart.line_items.push({
              'label': 'SHIPPING'
            , 'type': 'shipping'
            , 'amount': 3.99
            });
          }
        } else {
          a.o.cart.line_items.push({
            'label': 'INTERNATIONAL SHIPPING'
          , 'type': 'shipping'
          , 'amount': 20
          });
        }

        cb();
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
      a.cb(err, a.o.cart, gb.rule_error);
    });
  };

  S['AuthorizeOrder'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //order
    });

    gb['support_status'] = a.o.order.get('support_status');
    gb['notes'] = a.o.order.get('notes');

    if (Belt.get(a.o.order, 'buyer.payment_method') === 'paypal'
    && Belt.get(a.o.order, 'transactions.0.source.transactions.0.related_resources.0.sale.payment_mode') !== 'INSTANT_TRANSFER'
    ){
      gb.support_status = (gb.support_status ? gb.support_status + '\n' : '') + 'payment not received';
      gb.notes = (gb.notes ? gb.notes + '\n' : '') + 'Paypal payment needs to clear before order is processed. Check Paypal payment status before placing vendor orders.';

      gb['unauthorized'] = true;
    }

    if (a.o.order.get('total_price') > 100
    && Belt.get(a.o.order, 'recipient.postal_code') !== Belt.get(a.o.order, 'buyer.postal_code')
    /*&& self.instance.LevenshteinDistance(
        Belt.get(a.o.order, 'buyer.cardholder_name')
      , Belt.get(a.o.order, 'recipient.first_name') + ' ' + Belt.get(a.o.order, 'recipient.last_name')
      ) > 5*/
    ){
      gb.support_status = (gb.support_status ? gb.support_status + '\n' : '') + 'possible fraud';
      gb.notes = (gb.notes ? gb.notes + '\n' : '') + 'Flagged as possible fraud. Check before processing.';

      gb['unauthorized'] = true;
    } else if (self.instance.LevenshteinDistance(
      Belt.get(a.o.order, 'recipient.city')
    , 'brooklyn'
    ) < 3){
      gb.support_status = (gb.support_status ? gb.support_status + '\n' : '') + 'possible fraud';
      gb.notes = (gb.notes ? gb.notes + '\n' : '') + 'Flagged as possible fraud. Check before processing.';

      gb['unauthorized'] = true;
    }

    if (_.some(a.o.order.products, function(p){
      var vendor_name = Belt.get(S.instance.vendor_ids[Belt.get(p, 'source.product.vendor.toString()')], 'name');
      return (vendor_name || '').match(/active ride shop/i) ? true : false;
    })){
      gb.support_status = (gb.support_status ? gb.support_status + '\n' : '') + 'Active Ride Shop Order';
      gb.notes = (gb.notes ? gb.notes + '\n' : '') + 'This is an order Ben needs to process. Please notify him.';

      gb['unauthorized'] = true;
    }

    if (gb.support_status) a.o.order.set({
      'support_status': gb.support_status
    });

    if (gb.notes) a.o.order.set({
      'notes': gb.notes
    });

    return gb.unauthorized ? false : true;
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
