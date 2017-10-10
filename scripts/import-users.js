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
                       , 'config.json'
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
, 'infile': '/home/ben/Downloads/wset-2post-emails.csv'
, 'iterator': function(o, cb){
    o.email = o.email.toLowerCase().replace(/\s/g, '').replace(/"|“/gi, '');

    if (!o.email.match(Belt.email_regexp)) return;

    Request({
      'url': O.host + '/admin/user/create.json'
    , 'auth': GB.auth
    , 'body': {
        'email': o.email
      , 'roles.subscriber': true
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
    var fs = FS.createReadStream(GB.infile);

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          GB.iterator(d, Belt.np);
        })
       .on('end', Belt.cw(cb));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  //return process.exit(err ? 1 : 0);
});
