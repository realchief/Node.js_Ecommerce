#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Str = require('underscore.string')
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
  'skip': 0
, 'limit': 500
, 'query': {}
, 'results': []
, 'count': 0
, 'auth': {
    'user': 'wanderset'
  , 'pass': 'wanderset1234'
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Async.doWhilst(function(next){
      Request({
        'url': O.host + '/product/list.json'
      , 'method': 'get'
      , 'auth': GB.auth
      , 'json': {
          'query': GB.query
        , 'limit': GB.limit
        , 'skip': GB.skip
        }
      }, function(err, res, json){
        GB.results = Belt.get(json, 'data') || [];
        GB.skip += GB.limit;

        Async.eachSeries(GB.results, function(e, cb2){
          var cats = Belt.arrayDefalse(_.map(_.flatten(e.categories || []), function(c){
            return Str.trim(c.toLowerCase());
          })) || [];

          console.log(++GB.count);

          Request({
            'url': O.host + '/product/' + e._id + '/update.json'
          , 'method': 'post'
          , 'auth': GB.auth
          , 'json': {
              'categories': cats
            }
          }, function(){
            setTimeout(function(){
              cb2();
            }, 100);
          });
        }, Belt.cw(next, 0));
      });
    }, function(){ return _.any(GB.results); }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
