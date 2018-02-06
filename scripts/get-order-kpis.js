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
  , Moment = require('moment')
  , CSV = require('fast-csv')
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
  'host': 'http://wanderset.com:9008'
, 'from': Moment('01/01/2018', 'MM/DD/YYYY').format('MM-DD-YYYY')
, 'to': Moment('01/31/2018', 'MM/DD/YYYY').format('MM-DD-YYYY')
, 'email': 'ben@wanderset.com'
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': GB.host + '/admin/kpis/orders/from/' + GB.from + '/to/' + GB.to + '/email.json'
    , 'auth': GB.auth
    , 'qs': {
        'email': GB.email
      }
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
