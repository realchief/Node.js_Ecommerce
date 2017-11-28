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
  'code': {
    'code': 'laurensry00122'
  , 'label': '$50 Credit'
  //, 'error_label': '$100 in FREE WANDERSET CLOTHES. Follow us on Instagram & Twitter @shopwanderset for our next Kartsloaded drop!'
  , 'active': true
  , 'max_claims': 1
  , 'discount_type': 'fixed'
  , 'discount_amount': 50
  }
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/admin/promo_code/create.json'
    , 'auth': GB.auth
    , 'body': GB.code
    , 'method': 'post'
    , 'json': true
    }, function(err, res, json){
      console.log(Belt.stringify(json));

      cb();
    });
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
