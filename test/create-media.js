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
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'environment.json'
                       , 'settings.json'
                       , 'credentials.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'data': require(Path.join(O.__dirname, '/test/fixtures/media.json'))
});

Spin.start();

Async.waterfall([
  function(cb){
    Async.eachSeries(GB.data, function(e, cb2){
      if (e.local_path) e.local_path = Path.join(O.__dirname, e.local_path);

      Request({
        'url': O.host + '/media/create.json'
      , 'method': 'post'
      , 'json': e
      }, function(err, res, json){
        console.log(Belt.stringify(json));
        Assert(Belt.get(json, 'data._id'));
        return cb2(err);
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
