#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Util = require('util')
  , Winston = require('winston')
  , Events = require('events')
  , Spinner = require('its-thinking')
  , CP = require('child_process')
  , Request = require('request')
  , Assert = require('assert')
  , CSV = require('fast-csv')
  , Cheerio = require('cheerio')
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'environment.json'
                       , 'settings.json'
                       , 'config.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'cart': '5a442d1ff57b36091cb614ab'
, 'query': {
//    'customer_id': 'cus_C1ubarRLDKZeFR'
//  , 'payment_method': 'card_1Bdqm2BqgBRCGoCvJygabamk'
    'transaction': {
      'id': '50K088727C7085630'
    , 'amount': 87.20
    , 'type': 'charge'
    , 'description': 'charged at paypal checkout'
    , 'source': {
        'id': '6V489904MJ331953X'
      }
    , 'payment_gateway': 'paypal'
    , 'amount_refunded': 0
    , 'status': 'paid'
    }
  }
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/admin/order/cart/' + GB.cart + '/create.json'
    , 'auth': GB.auth
    , 'body': GB.query
    , 'method': 'post'
    , 'json': true
    }, function(err, res, json){
      console.log(Belt.stringify(json));

      cb();
    });
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
