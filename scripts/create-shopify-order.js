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
  , Shopify = require('shopify-node-api')
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
  'query': Belt.stringify({
    '_id': '5963c7fa39f45549679993c3'
  })
, 'skip': 0
, 'limit': 1
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'vendor'
, 'order': {
    'billing_address': {
      'first_name': 'Victor D.'
    , 'last_name': 'Lombard'
    , 'address1': '16 Henry Street'
    , 'city': 'Cranston'
    , 'province': 'RI'
    , 'country': 'US'
    , 'zip': '02905'
    , 'phone': '6464884989'
    }
  , 'buyer_accepts_marketing': false
  , 'financial_status': 'authorized'
  , 'tags': 'wanderset'
  , 'email': 'orders@wanderset.com'
  , 'line_items': [
      {
        'product_id': 7057737409
      , 'quantity': 1
      , 'price': '169.99'
      , 'variant_id': 24751268545
      }
    ]
  , 'note': 'wanderset dropship order #H1NAENGQ'
  , 'phone': '6173000585'
  , 'shipping_address': {
      'first_name': 'Victor D.'
    , 'last_name': 'Lombard'
    , 'address1': '16 Henry Street'
    , 'city': 'Cranston'
    , 'province': 'RI'
    , 'country': 'US'
    , 'zip': '02905'
    , 'phone': '6464884989'
    }
  , 'total_price': '169.99'
  }
, 'iterator': function(o, cb){
    var shopify = new Shopify({
      'shop': o.shopify.shop
    , 'shopify_api_key': O.shopify.key
    , 'access_token': o.shopify.access_token
    });

    shopify.post('/admin/orders.json', {
      'order': GB.order
    }, function(err, data){
      console.log(Belt.stringify(arguments));

      cb();
    });
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var cont;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/admin/' + GB.model + '/list.json'
      , 'auth': GB.auth
      , 'qs': {
          'query': GB.query
        , 'skip': GB.skip
        , 'limit': GB.limit
        }
      , 'method': 'get'
      , 'json': true
      }, function(err, res, json){
        cont = _.any(Belt.get(json, 'data')) ? true : false;
        GB.skip += GB.limit;
        console.log(GB.skip);

        Async.eachLimit(Belt.get(json, 'data') || [], 6, function(d, cb2){
          GB.iterator(d, cb2);
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
