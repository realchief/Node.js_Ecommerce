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
  , Mime = require('mime')
;

module.exports = function(S){

  S['s3'] = new AWS.S3(S.settings.aws);
  S.instance.log.info('Connected to S3 bucket [' + S.settings.s3.bucket + ']');

  S['UploadPath'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      //s3_path
      //image_metadata
      //image_shrink
      'content_type': a.o.mime || Mime.lookup(a.o.s3_path)
    , 'bucket': S.settings.s3.bucket
    , 'remove_path': false
    , 'acl': 'public-read'
    });

    return Async.waterfall([
      function(cb){
        if (!a.o.image_shrink) return cb();

        return self.instance.helpers.images.ShrinkImage({
          'path': a.o.path
        , 'remove_path': a.o.remove_path
        }, Belt.cs(cb, a.o, 'path', 1, 0));
      }
    , function(cb){
        if (!a.o.image_metadata) return cb();

        return self.instance.helpers.images.GetImageMetadata({
          'path': a.o.path
        }, Belt.cs(cb, gb, 'metadata', 1));
      }
    , function(cb){
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

        console.log('Uploading path "' + a.o.path + '" to "' + gb.url + '"');

        if (!a.o.remove_path) return cb();

        return FS.unlink(a.o.path, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, {
        'url': gb.url
      , 'metadata': gb.metadata
      });
    });
  };

  S['UploadURL'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //url
      'path': self.instance.helpers.files.TempPath()
    });

    return Async.waterfall([
      function(cb){
        self.instance.helpers.files.DownloadUrl({
          'url': a.o.url
        , 'path': a.o.path
        }, Belt.cs(cb, a.o, 'path', 1, 0));
      }
    , function(cb){
        return self.UploadPath(a.o, Belt.cs(cb, gb, 'upload', 1, 0));
      }
    ], function(err){
      return a.cb(err, gb.upload);
    });
  };

  S['DeleteURL'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'bucket': S.settings.s3.bucket
      //url
    });

    Async.waterfall([
      function(cb){
        console.log('Deleting "' + a.o.url + '"');

        self.s3.deleteObject({
          'Bucket': a.o.bucket
        , 'Key': a.o.url.replace('https://s3.amazonaws.com/' + a.o.bucket + '/', '')
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err);
    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
