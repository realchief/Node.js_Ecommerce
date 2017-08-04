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
  'csv_path': '/home/ben/Downloads/export (1) (2).csv'
, 'category_fields': [
    'Cat 1'
  , 'Cat 2'
  , 'Cat 3'
  ]
, 'remove_field': 'hide'
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    GB['queue'] = Async.queue(function(task, callback){
      task(callback);
    }, 1);

    var fs = FS.createReadStream(GB.csv_path)
      , csv = CSV({
          'headers': true
        })
        .on('data', function(d){
          var cats = _.map(Belt.arrayDefalse(_.values(_.pick(d, GB.category_fields))), function(v){
            return v.replace(/^\s*|\s*$/g, '');
          }).join(' > ').toLowerCase();

          //if (cats.match(/\?/) || !cats) return;

          GB.queue.push(function(cb2){

          Request({
            'url': O.host + '/product/' + d._id + '/update.json'
          , 'method': 'post'
          , 'auth': GB.auth
          , 'json': _.extend(cats && !cats.match(/\?/) ? {
              'categories': [cats]
            } : {}, d[GB.remove_field] && d[GB.remove_field].match(/1|x|w/i) ? {
              'hide': true
            } : {})
          }, function(err, res, json){
            err = err || Belt.get(json, 'error');
            if (err){
              console.error(err);
            }

            console.log(Belt.stringify(Belt.get(json, 'data')));

            cb2();
          });

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
