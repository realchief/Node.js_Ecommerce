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
;

module.exports = function(S){

  S['GetImageMetadata'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //path
      'temp_path': Path.join(S.settings.__dirname, './tmp/' + Belt.uuid() + '.json')
    });

    Async.waterfall([
      function(cb){
        CP.exec('convert "' + a.o.path + '" "' + a.o.temp_path + '"', Belt.cw(cb, 0));
      }
    , function(cb){
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
      }
    ], function(err){
      a.cb(err, gb.geometry);
    });
  };

  S.instance.express.all('/' + S.name + '/metadata.json', function(req, res){
    S.GetImageMetadata({
      'path': req.data().path
    }, function(err, json){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': json
      });
    });
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
