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
  'csv_path': Path.join(O.__dirname, './data/feeds/repelica.csv')
, 'auth': {
    'user': 'wanderset'
  , 'pass': 'wanderset1234'
  }
, 'vendors': [
    'Repelica'
  ]
, 'brands': [
    'Repelica'
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
          d.Handle = d.Handle || d['Variant SKU'];
          GB.products[d.Handle] = GB.products[d.Handle] || {};
          GB.products[d.Handle]['name'] = d.Handle;

          if (d.Title){
            GB.products[d.Handle]['label'] = {
              'us': d.Title
            };
          }

          if (d['Body (HTML)']){
            GB.products[d.Handle]['description'] = {
              'us': d['Body (HTML)']
            };
          }

          GB.products[d.Handle]['vendors'] = GB.vendors;
          GB.products[d.Handle]['brands'] = GB.brands;

          if (d.Type){
            GB.products[d.Handle]['categories'] = GB.products[d.Handle].categories || [];
            GB.products[d.Handle].categories.push(d.Type);
            GB.products[d.Handle].categories = _.uniq(GB.products[d.Handle].categories);
          }

          GB.products[d.Handle]['options'] = GB.products[d.Handle]['options'] || {};

          GB.products[d.Handle].opts = GB.products[d.Handle].opts || {};

          var opts = {}
          _.each(['Option1', 'Option2', 'Option3'], function(o){
            d[o + ' Name'] = d[o + ' Name'] || GB.products[d.Handle].opts[o + ' Name'];
            d[o + ' Value'] = d[o + ' Value'] || GB.products[d.Handle].opts[o + ' Value'];

            if (!d[o + ' Name'] || !d[o + ' Value']) return;

            d[o + ' Name'] = d[o + ' Name'].replace(/\./g, '');

            GB.products[d.Handle].opts[o + ' Name'] = d[o + ' Name'];

            opts[d[o + ' Name']] = {
              'alias': d[o + ' Name']
            , 'value': d[o + ' Value']
            };

            GB.products[d.Handle].options[d[o + ' Name']] = GB.products[d.Handle].options[d[o + ' Name']] || {
              'name': d[o + ' Name']
            , 'label': {
                'us': d[o + ' Name']
              }
            , 'values': {
                'us': []
              }
            };

            GB.products[d.Handle].options[d[o + ' Name']].values.us.push(d[o + ' Value']);
            GB.products[d.Handle].options[d[o + ' Name']].values.us = _.uniq(GB.products[d.Handle].options[d[o + ' Name']].values.us);
          });

          if (d['Variant SKU']){
            GB.products[d.Handle]['stocks'] = GB.products[d.Handle]['stocks'] || [];

            var qty = Belt.cast(d['Variant Inventory Qty'], 'number') || 0;
            if (qty < 0 || !qty) qty = 0;

            GB.products[d.Handle].stocks.push({
              'vendor': GB.vendors[0]
            , 'sku': d['Variant SKU'].replace(/^'/, '')
            , 'price': Belt.cast(d['Variant Price'], 'number') || 0
            , 'available_quantity': qty
            , 'options': opts
            });
          }

          GB.products[d.Handle]['media'] = GB.products[d.Handle].media || [];

          if (d['Product Page URL']){
            GB.products[d.Handle].media.push(d['Product Page URL']);
            GB.products[d.Handle].media = _.uniq(GB.products[d.Handle].media);
          }

          if (d['Image Src']){
            GB.products[d.Handle].media.push(d['Image Src']);
            GB.products[d.Handle].media = _.uniq(GB.products[d.Handle].media);
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
            , 'method': 'post'
            , 'auth': GB.auth
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
      , function(cb3){
          Async.eachSeries(e.media, function(s, cb4){
            Request({
              'url': O.host + '/product/' + gb.doc._id + '/media/create.json'
            , 'method': 'post'
            , 'auth': GB.auth
            , 'json': {
                'remote_url': s
              }
            }, function(err, res, json){
              err = err || Belt.get(json, 'error');
              if (err){
                console.error(err);
                return cb4();
              }

              console.log(Belt.stringify(json.data));
              setTimeout(cb4, 1000);
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
