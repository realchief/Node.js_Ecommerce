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
  , Mime = require('mime')
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
, 'minify_paths': {}
, 'readdir_iterator': function(path, cb){
    if (GB.minify_paths[path]) return cb();

    FS.readdir(path, function(err, files){
      Async.eachSeries(files, function(e, cb2){
        var p = Path.join(path, '/' + e);
        FS.stat(p, function(err2, stat){
          if (stat.isDirectory()){
            return GB.readdir_iterator(p, cb2);
          } else {
            GB.minify_paths[path] = GB.minify_paths[path] || [];
            GB.minify_paths[path].push(p);
          }

          cb2();
        });
      }, function(err){
        cb();
      });
    });
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    GB['css'] = '';
    _.each([
      Path.join(O.__dirname, './public/assets/stylesheets/main.css')
    , Path.join(O.__dirname, './public/css/custom.css')
    ], function(p){
      GB.css += ('\n' + FS.readFileSync(p).toString('utf8'));
    });

    GB['minified_css'] = new CleanCSS({
      'level': 2
    }).minify(GB.css);

    FS.writeFileSync(GB.minified_css_path, GB.minified_css.styles);

    cb();
  }
, function(cb){
    GB.readdir_iterator(Path.join(O.__dirname, './public'), cb);
  }
, function(cb){
    GB.readdir_iterator(Path.join(O.__dirname, './bower_components'), cb);
  }
, function(cb){
    GB.minify_paths = _.chain(GB.minify_paths)
                       .values()
                       .flatten()
                       .uniq()
                       .value();

    return Async.eachLimit(GB.minify_paths, 10, function(e, cb2){
      console.log('Uploading "' + e + '"...');

      GB.s3.putObject({
        'Bucket': GB.s3_bucket
      , 'ACL': 'public-read'
      , 'Body': FS.createReadStream(e)
      , 'Key': e.replace(O.__dirname + '/', '')
      , 'ContentType': Mime.lookup(e)
      }, Belt.cw(cb2, 0));
    }, cb);
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
