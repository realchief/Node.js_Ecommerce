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
    'slug': 'surf-is-dead'
  }
, 'skip': 0
, 'limit': 100
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'set'
, 'iterator': function(o, cb){
    console.log('Updating ' + GB.model + ' [' + o._id + ']...');

    Request({
      'url': O.host + '/' + GB.model + '/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': {
        'products': [
'59c3465bf93e435cf28d8513',
  '59c3465bf93e435cf28d84f5',
  '59c3465ef93e435cf28d85ef',
  '59c3465df93e435cf28d859b',
  '59c3465af93e435cf28d84de',
  '59c3465ef93e435cf28d85d8',
  '59c3465cf93e435cf28d8531',
  '59c3465af93e435cf28d84d0',
  '59c3464ff93e435cf28d84a9',
  '59c3465bf93e435cf28d84e5',
  '59c3465df93e435cf28d85ba',
  '59c34638f93e435cf28d8482',
  '59c3465cf93e435cf28d8523',
  '59c3465df93e435cf28d85b2',
  '59c3465ef93e435cf28d85f8',
  '59c3465df93e435cf28d85be',
  '59c3465cf93e435cf28d853f',
  '59c34653f93e435cf28d84b1',
  '59c3465df93e435cf28d85a2',
  '59c3465df93e435cf28d857d',
  '59c3465cf93e435cf28d856d',
  '59c3465bf93e435cf28d8503',
  '59c3465cf93e435cf28d8552',
  '59c3464ef93e435cf28d84a5',
  '59c34658f93e435cf28d84c1',
  '59c3465ef93e435cf28d85df',
  '59c3464cf93e435cf28d848e',
  '59c34656f93e435cf28d84ba',
  '59c3465bf93e435cf28d84fc',
  '59c3465df93e435cf28d85aa',
  '59c3465cf93e435cf28d8538',
  '59c3465af93e435cf28d84d7',
  '59c3465bf93e435cf28d850b',
  '59c3465df93e435cf28d85c9',
  '59c3464df93e435cf28d84a0',
  '59c3465cf93e435cf28d852a',
  '59c3465ef93e435cf28d85d0',
  '59c3463af93e435cf28d8488',
  '59c3465cf93e435cf28d851b',
  '59c3465ef93e435cf28d8600'
]
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
