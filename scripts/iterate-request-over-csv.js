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
  , CSV = require('fast-csv')
  , Natural = require('natural')
  , Str = require('underscore.string')
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
  'csv_infile': '/home/ben/Downloads/nike-apologies.csv'
, 'email': {

  }
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(GB.csv_infile);

    GB['records'] = [];

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          GB.records.push(d);
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    Async.eachSeries(GB.records, function(e, cb2){
      Request({
        'url': O.host + '/admin/order/' + e.order + '/update.json'
      , 'auth': GB.auth
      , 'body': _.extend({}, {
          'support_status': 'issue refund - Nike OOS issue - ask Eddie - do not email customer'
        })
      , 'method': 'post'
      , 'json': true
      }, function(err, res, json){
        console.log(json);
        cb2();
        //cb2(Belt.get(json, 'error') || !Belt.get(json, 'data') ? new Error(Belt.get(json, 'error') || 'Error') : undefined);
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
