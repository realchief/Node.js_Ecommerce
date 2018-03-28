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
                       , 'assets.json'
                       , 'settings.json'
                       , 'environment.json'
                       , 'config.json'
                       , 'credentials.json'
                       , 'users.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'code': {
    'label': '$700 Gift Certificate'
  //, 'error_label': "Thanks for playing Kartsloaded! Someone already won $700 in FREE WANDERSET CLOTHES. Follow us on Instagram & Twitter @shopwanderset for our next Kartsloaded drop!"
  , 'active': true
  , 'credit_balance': true
  //, 'max_claims': 1
  , 'discount_type': 'fixed'
  , 'discount_amount': 700
  }
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'times': 2
});

Spin.start();

Async.waterfall([
  function(cb){
    Async.times(GB.times, function(i, next){
      GB.code['code'] = Belt.random_string(8).toLowerCase();

      Request({
        'url': O.host + '/admin/promo_code/create.json'
      , 'auth': GB.auth
      , 'body': GB.code
      , 'method': 'post'
      , 'json': true
      }, function(err, res, json){
        console.log(Belt.get(json, 'data.code'));

        next();
      });
    }, Belt.cw(cb, 0))
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
