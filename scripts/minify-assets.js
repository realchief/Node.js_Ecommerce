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
  , CleanCSS = require('clean-css')
  , AWS = require('aws-sdk')
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
  'minified_css_path': Path.join(O.__dirname, './public/css/styles.min.css')
, 's3': new AWS.S3(O.aws)
, 's3_bucket': 'assets.wanderset.com'
, 'minified_css_s3_path': 'styles.min.css'
});

Spin.start();

Async.waterfall([
  function(cb){
    GB['css'] = '';
    _.each([
      Path.join(O.__dirname, './public/css/main.css')
    , Path.join(O.__dirname, './public/css/custom.css')
    ], function(p){
      GB.css += ('\n' + FS.readFileSync(p).toString('utf8'));
    });

    GB['minified_css'] = new CleanCSS({
      'level': 2
    }).minify(GB.css);

    FS.writeFileSync(GB.minified_css_path, GB.minified_css.styles);

    GB.s3.putObject({
      'Bucket': GB.s3_bucket
    , 'ACL': 'public-read'
    , 'Body': GB.minified_css.styles
    , 'Key': GB.minified_css_s3_path
    , 'ContentType': 'text/css'
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
