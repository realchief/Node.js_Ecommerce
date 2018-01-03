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
  , CSV = require('fast-csv')
  , Natural = require('natural')
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
  'product_queries': {
    /*'streetammo': {
      'vendor': '59711c3c845c040892606b1c'
    }*/
    'active': {
      //'vendor': '5a46c1f0cf845a091aa5fc02'
    }
  }
, 'skip': 0
, 'limit': 100
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'product_lists': {

  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Async.eachSeries(_.keys(GB.product_queries), function(q, cb2){

      GB['product_lists'][q] = [];

      var cont;

      GB.skip = 0;
      GB.limit = 100;

      Async.doWhilst(function(next){
        Request({
          'url': O.host + '/product/list.json'
        , 'auth': GB.auth
        , 'qs': {
            'query': GB.product_queries[q]
          , 'skip': GB.skip
          , 'limit': GB.limit
          }
        , 'method': 'get'
        , 'json': true
        }, function(err, res, json){
          cont = _.any(Belt.get(json, 'data')) ? true : false;
          GB.skip += GB.limit;

          _.each(Belt.get(json, 'data') || [], function(d){
            d = _.pick(d, [
              'name'
            , 'label'
            , 'brands'
            , 'slug'
            , 'source'
            ]);

            GB.product_lists[q].push(d);

            console.log(d);
          });

          console.log(GB.product_lists[q].length);

          next();
        })
      }, function(){ return cont; }, Belt.cw(cb2, 0));

    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
