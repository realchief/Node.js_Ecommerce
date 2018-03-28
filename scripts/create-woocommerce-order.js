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
  , Woocommerce = require('woocommerce')
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'assets.json'
                       , 'settings.json'
                       , 'environment.json'
                       , 'config.json'
                       , 'credentials.json'
                       , 'users.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'query': Belt.stringify({
    '_id': '59aee494d3d79b6276c4ec1d'
  })
, 'skip': 0
, 'limit': 1
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'vendor'
, 'order': {
currency: "USD",
payment_method: "wanderset",
payment_method_title: "wanderset dropship",
transaction_id: "SJYQZIB",
billing_address: {
first_name: "Judy",
last_name: "Obrien",
address_1: "1000 Pittsburgh Road",
address_2: "",
city: "Valencia",
state: "PA",
country: "US",
postcode: "16059",
phone: "6173000585",
email: "orders@wanderset.com"
},
shipping_address: {
first_name: " Nathaniel  ",
last_name: "Griffin",
address_1: "1094 New York Ave",
address_2: "",
city: "Brooklyn",
state: "NY",
country: "US",
postcode: "11203",
phone: "6173000585",
email: "orders@wanderset.com"
},
note: "wanderset dropship order #SJYQZIB",
line_items: [
{
name: "Broadway Tee",
product_id: 8942,
variation_id: 8951,
quantity: 1,
total: "62"
}
]
  }
, 'iterator': function(o, cb){
    var woocommerce = new Woocommerce({
      'url': o.woocommerce.url
    , 'consumerKey': o.woocommerce.consumer_key
    , 'secret': o.woocommerce.secret
    });

    woocommerce.post('/orders', {
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
