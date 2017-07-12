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
  , FS = require('fs')
  , CP = require('child_process')
  , Mime = require('mime')
;

module.exports = function(S){

  S['GetImageMetadata'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
    });

    Async.waterfall([
      function(cb){
        CP.exec('identify  -format "%[w]x%[h]" "' + a.o.path + '"', function(err, stdout){
          if (!stdout) return cb(new Error('unable to get image metadata'));

          stdout = stdout.split('x');

          gb['geometry'] = {
            'width': Belt.cast(Belt.get(stdout, '0'), 'number')
          , 'height': Belt.cast(Belt.get(stdout, '1'), 'number')
          };

          if (!gb.geometry.width || !gb.geometry.height) return cb(new Error('unable to get image metadata'));

          cb();
        });
      }
    ], function(err){
      a.cb(err, gb.geometry);
    });
  };

  S['GetURLImageMetadata'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //url
    });

    Async.waterfall([
      function(cb){
        self.instance.helpers.files.DownloadUrl({
          'url': a.o.url
        }, Belt.cs(cb, a.o, 'path', 1, 0));
      }
    , function(cb){
        self.GetImageMetadata(a.o, Belt.cs(cb, gb, 'geometry', 1, 0));
      }
    ], function(err){
      a.cb(err, gb.geometry);
    });
  };

  S['ShrinkImage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      //url
      //dest_path
      'remove_path': false
    , 'width': 890
    , 'quality': 40
    , 'dest_path': self.instance.helpers.files.TempPath({
        'extension': a.o.path
      })
    });

    Async.waterfall([
      function(cb){
        if (!a.o.url) return cb();

        self.instance.helpers.files.DownloadUrl({
          'url': a.o.url
        }, Belt.cs(cb, a.o, 'path', 1, 0));
      }
    , function(cb){
        CP.exec('convert -strip -quality ' + a.o.quality
        + (a.o.width ? ' -resize ' + a.o.width + 'x' : '')
        + ' "' + a.o.path + '" "' + a.o.dest_path + '"'
        , Belt.cw(cb, 0));
      }
    , function(cb){
        if (!a.o.remove_path) return cb();

        FS.unlink(a.o.path, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, a.o.dest_path);
    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
