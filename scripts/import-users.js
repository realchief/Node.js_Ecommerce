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
  'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'infile': '/home/ben/Downloads/customers.json'
, 'iterator': function(o, cb){
    /*if (!o.text.match(/New email subscriber: <mailto:/i)) return cb();

    o.email = o.text.split('New email subscriber: <mailto:')[1].split('>').shift().split('|').pop();
    o.email = o.email.toLowerCase().replace(/\s/g, '').replace(/"|“/gi, '');

    if (!o.email.match(Belt.email_regexp)) return cb();*/

    Request({
      'url': O.host + '/admin/user/create.json'
    , 'auth': GB.auth
    , 'body': {
        'email': o.email
      , 'first_name': o.first_name
      , 'last_name': o.last_name
      , 'roles.subscriber': o.subscriber
      , 'roles.customer': true
      }
    , 'json': true
    , 'method': 'post'
    }, function(err, res, json){
      console.log(Belt.stringify(json));

      cb();
    });
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = require(GB.infile).data;

    Async.eachSeries(fs, function(e, cb2){
      GB.iterator(e, Belt.cw(cb2, 0));
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  //return process.exit(err ? 1 : 0);
});
