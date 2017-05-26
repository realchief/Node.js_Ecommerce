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
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/s3/upload/path.json'
    , 'method': 'post'
    , 'json': {
        'path': GB.image_1
      , 'remove_path': false
      , 'image_metadata': true
      , 's3_path': 'test/' + Belt.uuid() + '.' + GB.image_1.split('.').pop()
      }
    }, function(err, res, json){
      Assert(json.data);
      console.log(json);
      GB['url'] = json.data.url;

      return cb(err);
    });
  }
, function(cb){
    Request({
      'url': O.host + '/s3/upload/url.json'
    , 'method': 'post'
    , 'json': {
        'url': GB.url
      , 's3_path': 'test/' + Belt.uuid() + '.' + GB.url.split('.').pop()
      , 'image_metadata': true
      }
    }, function(err, res, json){
      Assert(json.data);
      console.log(json);
      GB['url2'] = json.data.url;

      console.log(GB.url2);

      return cb(err);
    });
  }
, function(cb){
    Request({
      'url': O.host + '/s3/delete.json'
    , 'method': 'post'
    , 'json': {
        'url': GB.url
      }
    }, function(err, res, json){
      return cb(err);
    });
  }
, function(cb){
    Request({
      'url': O.host + '/s3/delete.json'
    , 'method': 'post'
    , 'json': {
        'url': GB.url2
      }
    }, function(err, res, json){
      return cb(err);
    });
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
