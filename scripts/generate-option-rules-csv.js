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
  , OS = require('os')
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
  'query': Belt.stringify({

  })
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'outfile': '/home/ben/downloads/wanderset-options.csv'
});

O.host = 'http://wanderset.com:9006';

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/cache/product/options.json'
    , 'auth': GB.auth
    , 'method': 'post'
    , 'json': true
    }, function(err, res, json){
      console.log(Belt.stringify(json));
      GB['options'] = json;
      cb();
    });
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.outfile);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.options, function(v, k){
      cs.write({
        'option_name': k
      , 'value': ''
      });

      _.each(v, function(v2, k2){
        cs.write({
          'option_name': ''
        , 'value': v2
        });
      });
    });

    cs.end();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
