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
  'csv_path': Path.join(O.__dirname, './test/feeds/pair-of-thieves-feed.csv')
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
          GB.products[d.id] = GB.products[d.id] || {};
          GB.products[d.id]['name'] = d.title;
          GB.products[d.id]['label'] = {
            'us': d.title
          };
          GB.products[d.id]['description'] = {
            'us': d.description
          };
          GB.products[d.id]['vendors'] = [
            d.brand
          ];
          GB.products[d.id]['brands'] = [
            d.brand
          ];
          GB.products[d.id]['categories'] = [
            d.product_type
          ];

          GB.products[d.id]['stocks'] = [
            {
              'vendor': d.brand
            , 'sku': d.mpn || d.id
            , 'price': d.price ? Belt.cast(d.price.replace(/ USD/, ''), 'number') : null
            }
          ];

          if (d.image_link){
            GB.products[d.id]['media'] = [
              {
                'remote_url': d.image_link
              }
            ];
          }
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
          , 'json': _.omit(e, [
              'stocks'
            , 'media'
            ])
          }, function(err, res, json){
            err = err || Belt.get(json, 'error');
            if (err) return cb3(new Error(err));

            console.log(Belt.stringify(json.data));

            gb['doc'] = json.data;

            cb3();
          });
        }
      , function(cb3){
          Async.eachSeries(e.stocks, function(s, cb4){
            Request({
              'url': O.host + '/product/' + gb.doc._id + '/stock/create.json'
            , 'method': 'post'
            , 'json': s
            }, function(err, res, json){
              err = err || Belt.get(json, 'error');
              if (err) return cb4(); // return cb4(new Error(err));

              console.log(Belt.stringify(json.data));
              cb4();
            });
          }, function(err){
            cb3(err);
          });
        }
      , function(cb3){
          Async.eachSeries(e.media, function(s, cb4){
            Request({
              'url': O.host + '/product/' + gb.doc._id + '/media/create.json'
            , 'method': 'post'
            , 'json': s
            }, function(err, res, json){
              err = err || Belt.get(json, 'error');
              if (err) return cb4(new Error(err));

              console.log(Belt.stringify(json.data));
              setTimeout(cb4, 500);
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
