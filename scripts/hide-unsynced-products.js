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
  , Moment = require('moment')
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

setTimeout(function(){
  process.exit(1);
}, 60 * 1000 * 29);

var GB = _.defaults(O.argv, {
  'query': Belt.stringify({
    'hide': {
      '$ne': true
    }
  , 'sync_hide': {
      '$ne': true
    }
  })
, 'skip': 0
, 'limit': 500
, 'count': 0
, 'time_ago': 12
, 'time_interval': 'hours'
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'iterator': function(o, cb){
    //if (!(Belt.get(o, 'source.record.url') || '').match(/streetammo/i)) return cb();
    if (!o.synced_at || Moment(o.synced_at).isAfter(Moment().subtract(GB.time_ago, GB.time_interval))) return cb();

    console.log('Hiding product [' + o._id + ']...' + ++GB.count);

    GB.skip--;

    Request({
      'url': O.host + '/product/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': {
        'sync_hide': true
      , 'hide_note': 'Not synced in over ' + GB.time_ago + ' ' + GB.time_interval
      }
    , 'json': true
    , 'method': 'post'
    }, function(err, res, json){
      console.log(Belt.get(json, 'data.source.record.url'));
      console.log(Belt.get(json, 'data.synced_at'));

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
