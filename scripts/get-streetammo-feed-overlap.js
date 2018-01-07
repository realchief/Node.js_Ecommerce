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
    'vendor': '59711c3c845c040892606b1c'
  }
, 'skip': 0
, 'limit': 100
, 'matched_count': 0
, 'listed_count': 0
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'iterator': function(o, cb){
    GB.listed_count++;

    var style = o.source.record.url.split('/').pop().split('-').shift();
    console.log(GB.feed[style]);

    if (GB.feed.style) GB.matched_count++;

    cb();
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/admin/streetammo/feed.json'
    , 'auth': GB.auth
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB['feed'] = Belt.get(json, 'data');
      cb();
    });
  }
, function(cb){
    var cont;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/product/list.json'
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

        Async.eachSeries(Belt.get(json, 'data') || [], function(d, cb2){
          GB.iterator(d, cb2);
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, function(cb){
    console.log('Listed products: ' + GB.listed_count);
    console.log('Feed products: ' + GB.feed.length);
    console.log('Matched products: ' + GB.matched_count);
    console.log('Listed products coverage: ' + ((GB.matched_count / GB.listed_count) * 100).toFixed(2) + '%');
    console.log('Feed products coverage: ' + ((GB.matched_count / GB.feed.length) * 100).toFixed(2) + '%');

    cb();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
