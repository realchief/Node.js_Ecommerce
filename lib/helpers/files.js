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
    S.qDownloadUrl(options, callback);
  }, 1);

  S['qDownloadUrl'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      //url
    });

    Async.waterfall([
      function(cb){
        console.log('Downloading URL "' + a.o.url + '"');

        if (a.o.has_extension) return cb();

        var ocb = _.once(cb);

        return Request.get(a.o.url)
                      .on('error', Belt.cw(ocb, 0))
                      .on('response', function(res){
                        if (!Belt.get(res, 'headers.content-type')) return cb(new Error('no content type'));

                        a.o.path += '.' + Mime.extension(res.headers['content-type']);

                        return ocb();
                      });
      }
    , function(cb){
        var fs = FS.createWriteStream(a.o.path)
          , ocb = _.once(cb);

        return Request.get(a.o.url)
                      .on('error', Belt.cw(ocb, 0))
                      .on('end', function(){
                        fs.close();
                        return ocb();
                      })
                      .pipe(fs);
      }
    ], function(err){
      a.cb(err, a.o.path);
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
