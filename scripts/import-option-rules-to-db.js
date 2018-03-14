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
  , OS = require('os')
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

  })
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

O.host = 'http://wanderset.com:9006';

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/cache/product/options.json'
    , 'auth': GB.auth
    , 'method': 'post'
    , 'json': true
    }, function(err, res, json){
      console.log(Belt.stringify(json));
      GB['options'] = json;
      cb();
    });
  }
, function(cb){
    Async.eachLimit(_.keys(GB.options), OS.cpus().length, function(g, cb2){
      Request({
        'url': O.host + '/admin/option_rule/create.json'
      , 'auth': GB.auth
      , 'body': {
          'name': g
        , 'active': false
        , 'new_name': g
        }
      , 'method': 'post'
      , 'json': true
      }, function(err, res, json){
        console.log(Belt.stringify(json));

        cb2();
      });
    }, Belt.cw(cb, 0));
  }
, function(cb){
    Async.eachLimit(_.keys(GB.options), OS.cpus().length, function(g, cb2){
      Async.eachLimit(GB.options[g], OS.cpus().length, function(v, cb3){
        Request({
          'url': O.host + '/admin/option_rule/create.json'
        , 'auth': GB.auth
        , 'body': {
            'name': g
          , 'value': v
          , 'active': false
          , 'new_value': v
          }
        , 'method': 'post'
        , 'json': true
        }, function(err, res, json){
          console.log(Belt.stringify(json));

          cb3();
        });
      }, Belt.cw(cb2, 0));
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
