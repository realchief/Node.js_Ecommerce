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
  , PromoCodes = require('../../resources/assets/promo_codes.json')
;

module.exports = function(S){
  S.instance['promo_codes'] = PromoCodes;

  S['ProcessCartRules'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //cart
    });

    Async.waterfall([
      function(cb){
        gb['promo_codes'] = _.filter(a.o.cart.get('line_items'), function(l){
          return Belt.get(l, 'details.promo_code');
        });

        gb.promo_codes = _.reject(gb.promo_codes, function(l){
          return !self.instance.promo_codes[Belt.get(l, 'details.promo_code')];
        });

        gb['promo_code'] = _.last(gb.promo_codes);

        if (gb.promo_code){

        }

        a.o.cart.set({
          'line_items': []
        });

        a.o.cart.line_items.push({
          'label': 'FREE SHIPPING'
        , 'type':
        , 'amount': 0
        });

        //if (a.o.cart.get)


      }
    , function(cb){

      }
    ], function(err){
      a.cb(err, gb.cart);
    });
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
