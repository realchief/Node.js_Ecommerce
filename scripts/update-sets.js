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
  'query': {
    'slug': 'pair-of-thieves'
  }
, 'skip': 0
, 'limit': 100
, 'auth': {
    'user': 'wanderset'
  , 'pass': '13carrots!$'
  }
, 'model': 'set'
, 'iterator': function(o, cb){
    console.log('Updating ' + GB.model + ' [' + o._id + ']...');

    Request({
      'url': O.host + '/' + GB.model + '/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': {
        'products': GB.products
      }
    , 'json': true
    , 'method': 'post'
    }, Belt.cw(cb));
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/product/list.json'
    , 'auth': GB.auth
    , 'qs': {
        'query': Belt.stringify({
          'vendor': '597e21c580620114c6721ad9'
        })
      , 'skip': 0
      , 'limit': 5000
      }
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB.products = _.pluck(Belt.get(json, 'data'), '_id');

      cb();
    });
  }
, function(cb){
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
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
