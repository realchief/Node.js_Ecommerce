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
    'slug': 'android-homme'
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

var prods = [
"599362f13c5f2671fd14ccc8","599362b93c5f2671fd14cc8a","5993631d3c5f2671fd14ccef","5980d83835bae45207d407b2","599362da3c5f2671fd14ccac","5993629c3c5f2671fd14cc6d","5980d85435bae45207d407ce","5980d82235bae45207d40792","5980d80a35bae45207d40763","5980d81835bae45207d40778","5980d86235bae45207d407e6","597ed7ad6df70c555fba59b2","5967823c82134324278d9450","5967823b82134324278d943b","59677ee582134324278d7e31","59677eea82134324278d7e4c","596782a082134324278d95ea","596782a382134324278d9603","596782a682134324278d9617","596782a982134324278d9629","596782af82134324278d963f","596782b382134324278d9652"
];

var oprods = _.filter(o.products, function(p){
  return !_.some(prods, function(p2){
    return p2 === p;
  });
});

prods = prods.concat(oprods);

    Request({
      'url': O.host + '/' + GB.model + '/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': {
        'products': prods
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
