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
  //path
});

Spin.start();

Async.waterfall([
  function(cb){
    var gb = {};

    GB['media'] = _.map(FS.readdirSync(GB.path), function(p){
      return Path.join(GB.path, '/' + p);
    });

    Async.eachSeries(GB.media, function(e, cb2){
      return Async.waterfall([
        function(cb3){
          Request({
            'url': O.host + '/media/create.json'
          , 'method': 'post'
          , 'json': true
          , 'formData': {
              'file': FS.createReadStream(e)
            , 'json': JSON.stringify({
                'label': {
                  'us': e.split('/').pop().replace(/\.[^\.]+$/, '')
                }
              , 'description': {
                  'us': 'Streetammo'
                }
              })
            }
          }, function(err, res, json){
            err = err || Belt.get(json, 'error');
            if (err){
              console.error(err);
              return cb3();
            }

            console.log(Belt.stringify(json.data));

            gb['doc'] = json.data;

            cb3();
          });
        }
      ], function(err){
        cb2(err);
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
