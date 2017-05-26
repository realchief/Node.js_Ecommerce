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
  'image_1': Path.join(O.__dirname, '/test/fixtures/image-1.jpg')
, 'image_2': Path.join(O.__dirname, '/test/fixtures/image-2.png')
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/images/metadata.json'
    , 'method': 'post'
    , 'json': {
        'path': GB.image_1
      }
    }, function(err, res, json){
      Assert(Belt.get(json, 'data.width') === 295);
      Assert(Belt.get(json, 'data.height') === 146);

      return cb(err);
    });
  }
, function(cb){
    Request({
      'url': O.host + '/images/metadata.json'
    , 'method': 'post'
    , 'json': {
        'path': GB.image_2
      }
    }, function(err, res, json){
      Assert(Belt.get(json, 'data.width') === 2523);
      Assert(Belt.get(json, 'data.height') === 2016);

      return cb(err);
    });
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
