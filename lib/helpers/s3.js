#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , Str = require('underscore.string')
  , Request = require('request')
  , AWS = require('aws-sdk')
  , FS = require('fs')
;

module.exports = function(S){

  S['s3'] = new AWS.S3(S.settings.aws);
  S.instance.log.info('Connected to S3 bucket [' + S.settings.s3.bucket + ']');

  S['uploadPath'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      //s3_path
      'bucket': S.settings.s3.bucket
    , 'remove_path': true
    , 'acl': 'public-read'
    });

    return Async.waterfall([
      function(cb){
        return self.s3.putObject({
          'Bucket': a.o.bucket
        , 'ACL': a.o.acl
        , 'Body': FS.createReadStream(a.o.path)
        , 'Key': a.o.s3_path
        , 'ContentType': a.o.content_type
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb['url'] = 'https://s3.amazonaws.com/' + a.o.bucket + '/' + a.o.s3_path;

        if (!a.o.remove_path) return cb();

        return FS.unlink(a.o.path, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, gb.url);
    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
