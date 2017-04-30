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
  'html_path': Path.join(O.__dirname, './test/feeds/bombclothing-feed.html')
, 'vendors': [
    'Bomb Clothing'
  ]
, 'brands': [
    'Bomb Clothing'
  ]
});

Spin.start();

Async.waterfall([
  function(cb){
    GB['products'] = {};

    var products = []
      , html = FS.readFileSync(GB.html_path).toString('utf8')
      , br = '<br/>'
      , art = '</article>'
      , b = 0
      , a = 0
      , o = 0
      , p;

    html = html.split(/, Images\W*/).pop().slice(4);

    do {
      o = b;
      b = html.indexOf(br, b) + br.length;
      a = html.indexOf(art, a) + art.length;

      if (b === br.length - 1) break;
      //if (b < a) continue;

      p = html.slice(o, b);
      products.push(p);
    } while (b >= (br.length - 1))

    _.each(products, function(p){

      p = p.split('<');
      var fl = p.shift().split(/,\s+/)
        , name = fl[2]
        , opts = {}
        , color
        , size = fl[3].replace(/\s*\(|\)\s*/g, '')
        , qty = Belt.cast(fl[0].replace(/\s/g, ''), 'number')
        , price = Belt.cast(fl[1].replace(/\s/g, ''), 'number') / 1000;

      name = name.split(/\s*\(/);
      if (name.length > 1){
        color = name.pop().replace(')', '');
      }
      name = name[0];

      p = '<' + p.join('<');
      var $ = Cheerio.load(p);

      GB.products[name] = GB.products[name] || {};
      GB.products[name]['name'] = name;
      GB.products[name]['label'] = {
        'us': name
      };
      GB.products[name]['description'] = {
        'us': $('div.description-content').html()
      };
      GB.products[name]['options'] = GB.products[name].options || {};

      if (color){
        opts['color'] = {
          'alias': 'color'
        , 'value': color
        };

        GB.products[name].options.color = GB.products[name].options.color || {
          'label': {
            'us': 'color'
          }
        , 'values': {
            'us': []
          }
        };

        GB.products[name].options.color.values.us.push(color);
        GB.products[name].options.color.values.us = _.uniq(GB.products[name].options.color.values.us);
      }

      if (size){
        opts['size'] = {
          'alias': 'size'
        , 'value': size
        };

        GB.products[name].options.size = GB.products[name].options.size || {
          'label': {
            'us': 'size'
          }
        , 'values': {
            'us': []
          }
        };

        GB.products[name].options.size.values.us.push(size);
        GB.products[name].options.size.values.us = _.uniq(GB.products[name].options.size.values.us);
      }

      GB.products[name].vendors = GB.vendors;
      GB.products[name].brands = GB.brands;

      GB.products[name].stocks = GB.products[name].stocks || [];

      GB.products[name].stocks.push({
        'vendor': GB.vendors[0]
      , 'sku': fl[2]
      , 'options': opts
      , 'available_quantity': qty
      , 'price': price
      });

      $('img[src*="/products/"]').each(function(i, e){
        GB.products[name].media = GB.products[name].media || [];
        GB.products[name].media.push({
          'remote_url': $(e).attr('src')
        , 'options': opts
        });
      });
    });

    cb();
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
              if (err) return cb4(new Error(err));

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
