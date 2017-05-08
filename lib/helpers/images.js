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
      //'temp_path': Path.join(S.settings.__dirname, './tmp/' + Belt.uuid() + '.json')
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
        //CP.exec('convert "' + a.o.path + '" "' + a.o.temp_path + '"', Belt.cw(cb, 0));
      }
    /*, function(cb){
        FS.readFile(a.o.temp_path, Belt.cs(cb, gb, 'json', 1, 'toString("utf8")', 0));
      }
    , function(cb){
        try {
          gb.json = Belt.parse(gb.json);

          gb['geometry'] = {
            'width': Belt.cast(Belt.get(gb.json, 'image.geometry.width'), 'number')
          , 'height': Belt.cast(Belt.get(gb.json, 'image.geometry.height'), 'number')
          };
        } catch(e){

        }

        FS.unlink(a.o.temp_path, Belt.cw(cb));
      }*/
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
     'path': Path.join(S.settings.__dirname, './tmp/' + Belt.uuid())
    });

    Async.waterfall([
      function(cb){
        return Request.get(a.o.url)
                      .on('error', Belt.cw(cb, 0))
                      .on('response', function(res){
                        if (!Belt.get(res, 'headers.content-type')) return cb(new Error('no content type'));

                        a.o.path += '.' + Mime.extension(res.headers['content-type']);

                        return cb();
                      });
      }
    , function(cb){
        var fs = FS.createWriteStream(a.o.path);

        return Request.get(a.o.url)
                      .on('error', Belt.cw(cb, 0))
                      .on('end', function(){
                        fs.close();
                        return cb();
                      })
                      .pipe(fs);
      }
    , function(cb){
        self.GetImageMetadata(a.o, Belt.cs(cb, gb, 'geometry', 1, 0));
      }
    ], function(err){
      a.cb(err, gb.geometry);
    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
