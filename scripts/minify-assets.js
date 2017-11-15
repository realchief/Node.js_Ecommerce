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
  , UglifyJS = require('uglify-js')
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
, 'minified_js_path': Path.join(O.__dirname, './public/js/javscript.min.js')
, 's3': new AWS.S3(O.aws)
, 'cloudfront': new AWS.CloudFront(O.aws)
, 'cloudfront_distribution': 'E2U4SXPJPTJ7SP'
, 's3_bucket': 'assets.wanderset.com'
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
/*, function(cb){
    GB['js'] = '';

    _.each([
      Path.join(O.__dirname, './bower_components/jsbelt/lib/belt.js')
    , Path.join(O.__dirname, './bower_components/underscore/underscore-min.js')
    , Path.join(O.__dirname, './bower_components/underscore.string/dist/underscore.string.min.js')
    , Path.join(O.__dirname, './bower_components/async/dist/async.js')
    , Path.join(O.__dirname, './bower_components/moment/min/moment.min.js')
    , Path.join(O.__dirname, './bower_components/query-object/query-object.js')
    , Path.join(O.__dirname, './bower_components/jquery/dist/jquery.min.js')
    ], function(p){
      GB.js += ('\n' + FS.readFileSync(p).toString('utf8'));
      //GB.js[p] = FS.readFileSync(p).toString('utf8');
    });

    GB['minified_js'] = UglifyJS.minify(GB.js, {

    }).code;

console.log(GB.minified_js)
    //FS.writeFileSync(GB.minified_js_path, GB.minified_css.styles);

    //cb();
  }*/
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
, function(cb){
    GB.cloudfront.createInvalidation({
      'DistributionId': GB.cloudfront_distribution
    , 'InvalidationBatch': {
        'CallerReference': Belt.uuid()
      , 'Paths': {
          'Quantity': 1
        , 'Items': [
            '*'
          ]
        }
      }
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
