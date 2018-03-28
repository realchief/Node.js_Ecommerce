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
  'query': {

  }
, 'set': 'new-arrivals'
, 'skip': 0
, 'limit': 500
, 'sort': '-created_at'
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'iterator': function(o, cb){
    //console.log('Adding "' + o.slug + '"...');

    process.stdout.write(o._id + '\n');

    Request({
      'url': O.host + '/set/' + GB.set + '/product/' + o._id + '/add.json'
    , 'auth': GB.auth
    , 'method': 'post'
    , 'json': true
    }, function(err, res, json){
      cb();
    });
  }
});

//Spin.start();

O.host = 'http://wanderset.com:8852';

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
        , 'sort': GB.sort
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
    }, function(){ return false && cont; }, Belt.cw(cb, 0));
  }
], function(err){
  //Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
