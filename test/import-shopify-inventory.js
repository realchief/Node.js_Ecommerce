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
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'environment.json'
                       , 'settings.json'
                       , 'credentials.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'csv_path': Path.join(O.__dirname, '/test/fixtures/shopify-inventory.csv')
, 'vendor': '58c4b9e9747f7f2a1d324e25'
});

Spin.start();

Async.waterfall([
  function(cb){
    GB['products'] = {};
    GB['categories'] = {};

    var fs = FS.createReadStream(GB.csv_path)
      , csv = CSV({
          'headers': true
        })
        .on('data', function(d){
          GB['products'][d.Handle] = GB['products'][d.Handle] || {};
          GB['products'][d.Handle]['name'] = d.Handle;

          if (d.Title){
            GB['products'][d.Handle]['label'] = {
              'us': d.Title
            };
          }

          if (d['Body (HTML)']){
            GB['products'][d.Handle]['description'] = {
              'us': d['Body (HTML)']
            };
          }

          GB['products'][d.Handle]['media'] = GB['products'][d.Handle].media || [];

          if (d['Image Src']){
            GB['products'][d.Handle].media.push(_.extend({
              'local_url': d['Image Src']
            }, d['Image Alt Text'] ? {
              'label': {
                'us': d['Image Alt Text']
              }
            } : {}));
          }
        })
        .on('end', function(){
          cb();
        });

    fs.pipe(csv);
  }
, function(cb){
    Async.eachSeries(GB.products, function(e, cb2){
      e['populate'] = 'vendor';

      Request({
        'url': O.host + '/product/create.json'
      , 'method': 'post'
      , 'json': e
      }, function(err, res, json){
        console.log(Belt.stringify(json));
        Assert(Belt.get(json, 'data._id'));
        return cb2(err);
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
