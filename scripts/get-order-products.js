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
  'query': {

  }
, 'skip': 0
, 'limit': 100
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'order'
, 'products': {}
, 'iterator': function(o, cb){
    _.chain(o.products)
     .filter(function(p){
       return (Belt.get(p, 'source.product.categories.0') || Belt.get(p, 'source.product.auto_category') || '').match(/foot/i);
      })
     .each(function(p){
        GB.products[Belt.get(p, 'source.product.slug')] = GB.products[Belt.get(p, 'source.product.slug')] || {
          'quantity': 0
        , 'revenue': 0
        };

        GB.products[Belt.get(p, 'source.product.slug')].quantity += p.quantity;
        GB.products[Belt.get(p, 'source.product.slug')].revenue += p.price;
        GB.products[Belt.get(p, 'source.product.slug')].name = Belt.get(p, 'source.product.label.us');
        GB.products[Belt.get(p, 'source.product.slug')].brand = Belt.get(p, 'source.product.brands.0');
      });

    cb();
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var cont;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/' + GB.model + '/list.json'
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
, function(cb){
    console.log(['url', 'name','brand', 'quantity_sold', 'revenue'].join(',') + '\n' + _.map(GB.products, function(v, k){
      return ['https://wanderset.com/product/' + k, v.name, v.brand, v.quantity, v.revenue].join(',');
    }).join('\n'));

    cb();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
