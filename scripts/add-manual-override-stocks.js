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

var ArrayCombinations = function(arr){
  if (arr.length === 0){
    return [];
  } else if (arr.length === 1){
    return arr[0];
  } else {
    var result = []
      , allCasesOfRest = ArrayCombinations(arr.slice(1));
    for (var c in allCasesOfRest) {
      for (var i = 0; i < arr[0].length; i++) {
        result.push(Belt.toArray(arr[0][i]).concat(Belt.toArray(allCasesOfRest[c])));
      }
    }

    return result;
  }
};

var GB = _.defaults(O.argv, {
  'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'product_csv_path': '/home/ben/Downloads/add-products.csv'
, 'iterator': function(o, cb){
    var size_opt_label;

    var opt_vals = _.chain(o.options)
                    .omit(function(v, k){
                      if (k.match(/size/i)){
                        size_opt_label = k;
                        return true;
                      }
                    })
                    .map(function(v, k){
                      return _.map(v.values.us, function(v2, k2){
                        return _.object([
                          k
                        ], [
                          v2
                        ]);
                      });
                    })
                    .value();

    if (!size_opt_label) return cb();

    var sizes = _.map([
      "US: 6 - UK: 5.5 - EU: 38.5",
      "US: 6.5 - UK: 6 - EU: 39",
      "US: 7 - UK: 6 - EU: 40",
      "US: 7.5 - UK: 6.5 - EU: 40.5",
      "US: 8 - UK: 7 - EU: 41",
      "US: 8.5 - UK: 7.5 - EU: 42",
      "US: 9 - UK: 8 - EU: 42.5",
      "US: 9.5 - UK: 8.5 - EU: 43",
      "US: 10 - UK: 9 - EU: 44",
      "US: 10.5 - UK: 9.5 - EU: 44.5",
      "US: 11 - UK: 10 - EU: 45",
      "US: 11.5 - UK: 10.5 - EU: 45.5",
      "US: 12 - UK: 11 - EU: 46"
    ], function(v){
      return _.object([
        size_opt_label
      ], [
        v
      ]);
    });

    var configs = ArrayCombinations([sizes].concat(opt_vals));

    configs = _.chain(configs)
               .map(function(v, k){
                  var obj = {};
                  _.each(v, function(v2){
                    return _.extend(obj, v2);
                  });

                  return obj;
                })
                .filter(function(v, k){
                  return !_.some(o.stocks, function(s){
                    return _.every(v)
                  });
                })
                .value();

    console.log(configs);

    cb();

/*
    Request({
      'url': O.host + '/product/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': update
    , 'json': true
    , 'method': 'post'
    }, function(err, res, json){
      cb();
    });*/
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(GB.product_csv_path);

    GB['products'] = [];

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          GB.products.push(d);
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    Async.eachSeries(GB.products, function(p, next){
      Request({
        'url': O.host + '/product/list.json'
      , 'auth': GB.auth
      , 'qs': {
          'query': {
            'label.us': p.name
          , 'brands': p.brand
          }
        }
      , 'method': 'get'
      , 'json': true
      }, function(err, res, json){
        Async.eachLimit(Belt.get(json, 'data') || [], 6, function(d, cb2){
          GB.iterator(d, cb2);
        }, Belt.cw(next, 0));
      });
    }, Belt.cw(cb));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
