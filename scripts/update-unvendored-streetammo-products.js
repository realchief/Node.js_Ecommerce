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
    'vendor': {
      '$exists': false
    }
  , 'vendors': 'Streetammo'
  }
, 'skip': 0
, 'limit': 1
, 'auth': {
    'user': 'wanderset'
  , 'pass': 'wanderset1234'
  }
, 'iterator': function(o, cb){
    //console.log('Updating product [' + o._id + ']...');

    var gb = {};

    Async.waterfall([
      function(cb2){
        Request({
          'url': O.host + '/product/list.json'
        , 'auth': GB.auth
        , 'qs': {
            'query': JSON.stringify({
              'name': o.name.split(' - ').pop()
            , 'brands': o.name.split(' - ').shift()
            , 'vendor': {
                '$exists': true
              }
            })
          , 'skip': 0
          , 'limit': 1
          }
        , 'method': 'get'
        , 'json': true
        }, Belt.cs(cb2, gb, 'matched_product', 2, 'data.0'));
      }
    , function(cb2){
        if (!gb.matched_product) return cb2();

        console.log('...found match: ' + o._id + ' ' + gb.matched_product._id);

        Request({
          'url': O.host + '/product/old/' + o._id + '/new/' + gb.matched_product._id + '/replace.json'
        , 'auth': GB.auth
        , 'method': 'post'
        , 'json': true
        }, Belt.cw(cb2, gb, 'res', 2, 0));
      }
    , function(cb2){
        if (!gb.matched_product) return cb2();

        console.log(gb.res)

        cb2();
      }
    ], function(err){
      cb(err);
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
          'query': JSON.stringify(GB.query)
        , 'skip': GB.skip
        , 'limit': GB.limit
        , 'sort': '-created_at'
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
