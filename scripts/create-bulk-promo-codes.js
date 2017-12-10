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
  'csv_infile': '/home/ben/downloads/refunds.csv'
, 'csv_outfile': '/home/ben/Downloads/nike-apologies.csv'
, 'promo_code': {
    //code
    'label': '$50 Gift Card'
  , 'discount_type': 'fixed'
  , 'discount_amount': 50
  , 'credit_balance': true
  , 'active': true
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
          GB.records.push({
            'email': d.buyer_email
          , 'order': d.order_id
          , 'first_name': d.buyer_first_name
          , 'code': (d.buyer_first_name + d.buyer_last_name + Belt.random_int(1000, 9999)).replace(/\W/g, '').toLowerCase()
          });
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    Async.eachSeries(GB.records, function(e, cb2){
      Request({
        'url': O.host + '/admin/promo_code/create.json'
      , 'auth': GB.auth
      , 'body': _.extend({}, GB.promo_code, {
          'code': e.code
        })
      , 'method': 'post'
      , 'json': true
      }, function(err, res, json){
        console.log(json);
        cb2(Belt.get(json, 'error') || !Belt.get(json, 'data') ? new Error(Belt.get(json, 'error') || 'Error') : undefined);
      });
    }, Belt.cw(cb, 0));
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.csv_outfile);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.records, function(v, k){
      cs.write(v);
    });

    cs.end();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
