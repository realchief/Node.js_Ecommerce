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
  S['TempPath'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //extension
    });

    return Path.join(S.settings.__dirname, './tmp/' + Belt.uuid() + (a.o.extension ? '.' + a.o.extension.split('.').pop() : ''));
  };

  S['DownloadURLQueue'] = Async.queue(function(options, callback){
    setTimeout(function(){
      S.qDownloadUrl(options, callback);
    }, 500);
  }, 1);

  S['qDownloadUrl'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      //url
      'retry_until_complete': true
    });

    gb['path'] = a.o.path;

    Async.waterfall([
      function(cb){
        console.log('Downloading URL "' + a.o.url + '"');

        if (a.o.has_extension) return cb();

        var ocb = _.once(cb);

        return Request.get(a.o.url)
                      .on('error', Belt.cw(ocb, 0))
                      .on('response', function(res){
                        if (!Belt.get(res, 'headers.content-type')) return cb(new Error('no content type'));

                        gb.path += '.' + Mime.extension(res.headers['content-type']);

                        return ocb();
                      });
      }
    , function(cb){
        var fs = FS.createWriteStream(gb.path)
          , ocb = _.once(cb);

        fs.on('close', function(){
          ocb();
        });

        return Request.get(a.o.url)
                      .on('error', Belt.cw(ocb, 0))
                      .on('response', function(res){
                        gb['request_content_length'] = Belt.cast(Belt.get(res, 'headers.content-length') || 0, 'number');
                      })
                      .on('end', function(){
                        fs.close();
                      })
                      .pipe(fs);
      }
    , function(cb){
        FS.stat(gb.path, function(err, stat){
          if (err) return cb(err);

          gb['file_content_length'] = stat.size;

          if (a.o.retry_until_complete &&
          gb.file_content_length !== gb.request_content_length) return setTimeout(function(){
            console.error('Downloading file length mismatch: ' + a.o.url);
            self.qDownloadUrl(a.o, a.cb);
          }, 1000);

          cb();
        });
      }
    ], function(err){
      a.cb(err, gb.path);
    });
  };

  S['DownloadUrl'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      //url
    });

    self.DownloadURLQueue.push(a.o, a.cb);
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
