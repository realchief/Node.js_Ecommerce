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
  'csv_path': '/home/ben/Downloads/wanderset-product-categories.csv'
, 'category_fields': [
    'Master Category'
  , 'Subcategory'
  , 'Subcategory 2'
  , 'Subcategory 3'
  ]
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(GB.csv_path)
      , csv = CSV({
          'headers': true
        })
        .on('data', function(d){
          var cats = Belt.arrayDefalse(_.values(_.pick(d, GB.category_fields))).join(' > ').toLowerCase();

          Request({
            'url': O.host + '/product/' + d._id + '/update.json'
          , 'method': 'post'
          , 'json': {
              'categories': [cats]
            }
          }, function(err, res, json){
            err = err || Belt.get(json, 'error');
            if (err){
              console.error(err);
            }

            console.log(Belt.stringify(json.data));
          });
        })
        .on('end', function(){
          cb();
        });

    fs.pipe(csv);
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  //return process.exit(err ? 1 : 0);
});
