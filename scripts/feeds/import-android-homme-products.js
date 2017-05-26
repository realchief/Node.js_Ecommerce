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
                       '__dirname': Path.resolve(module.filename + '/../../..')
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
  'csv_path': Path.join(O.__dirname, './data/feeds/android-homme-feed.csv')
, 'auth': {
    'user': 'wanderset'
  , 'pass': 'wanderset1234'
  }
, 'vendors': [
    'Android Homme'
  ]
, 'brands': [
    'Android Homme'
  ]
});

Spin.start();

Async.waterfall([
  function(cb){
    GB['products'] = {};

    var fs = FS.createReadStream(GB.csv_path)
      , csv = CSV({
          'headers': true
        })
        .on('data', function(d){
          GB.products[d['STYLE NO.']] = GB.products[d['STYLE NO.']] || {};
          GB.products[d['STYLE NO.']]['name'] = d.NAME;

          d.Handle = d['STYLE NO.'];

          if (d.NAME){
            GB.products[d.Handle]['label'] = {
              'us': d.NAME
            };
          }

          if (d.DESCRIPTION){
            GB.products[d.Handle]['description'] = {
              'us': d.DESCRIPTION + (d['STYLE PICTURE'] ? '\n\n' + d['STYLE PICTURE'] : '')
            };
          }

          GB.products[d.Handle]['vendors'] = GB.vendors;
          GB.products[d.Handle]['brands'] = GB.brands;

          //categories?

          GB.products[d.Handle]['options'] = GB.products[d.Handle]['options'] || {};

          var opts = {}

          _.each(['COLOR', 'OUTSOLE'], function(o){
            if (!d[o]) return;

            opts[o] = {
              'alias': o
            , 'value': d[o]
            };

            GB.products[d.Handle].options[o] = GB.products[d.Handle].options[o] || {
              'name': o
            , 'label': {
                'us': o
              }
            , 'values': {
                'us': [
                  d[o]
                ]
              }
            };
          });


          GB.products[d.Handle].opts = opts;

          if (d['STYLE NO.']){
            GB.products[d.Handle]['stocks'] = GB.products[d.Handle]['stocks'] || [];

            var qty = 0;
            if (qty < 0 || !qty) qty = 0;

            GB.products[d.Handle].stocks.push({
              'vendor': GB.vendors[0]
            , 'sku': d['STYLE NO.']
            , 'price': Belt.cast((d['PRICE'] || '').replace(/\$/g, ''), 'number') || 0
            , 'available_quantity': qty
            , 'options': opts
            });
          }

          GB.products[d.Handle]['media'] = GB.products[d.Handle].media || [];
        })
        .on('end', function(){
          cb();
        });

    fs.pipe(csv);
  }
, function(cb){
    var gb = {};

    Async.eachSeries(GB.products, function(e, cb2){
      delete e.opts;

      return Async.waterfall([
        function(cb3){
          Request({
            'url': O.host + '/product/create.json'
          , 'method': 'post'
          , 'auth': GB.auth
          , 'json': _.omit(e, [
              'stocks'
            , 'media'
            ])
          }, function(err, res, json){
            err = err || Belt.get(json, 'error');
            if (err){
              console.error(err);
              return cb3();
            }

            console.log(Belt.stringify(json.data));

            gb['doc'] = json.data;

            cb3();
          });
        }
      , function(cb3){
          Async.eachSeries(e.stocks, function(s, cb4){
            Request({
              'url': O.host + '/product/' + gb.doc._id + '/stock/create.json'
            , 'auth': GB.auth
            , 'method': 'post'
            , 'json': s
            }, function(err, res, json){
              err = err || Belt.get(json, 'error');
              if (err){
                console.error(err);
                return cb4();
              }

              console.log(Belt.stringify(json.data));
              cb4();
            });
          }, function(err){
            cb3(err);
          });
        }
      ], function(err){
        cb2(err);
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
