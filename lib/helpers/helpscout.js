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
  , Mime = require('mime')
;

module.exports = function(S){
  S['host'] = 'https://api.helpscout.net/v1';

  S['GetCustomer'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'key': S.settings.helpscout.key
    });

    return Async.waterfall([
      function(cb){
        Request({
          'url': self.host + '/customers.json'
        , 'method': 'get'
        , 'qs': {
            'email': a.o.email
          }
        , 'auth': {
            'user': a.o.key
          , 'password': 'x'
          }
        , 'json': true
        }, function(err, res, json){
          gb['customer'] = json;
          cb(err);
        })
      }
    ], function(err){
      a.cb(err, gb.customer);
    });
  };

  S.instance.express.all('/helpscout.json', function(req, res){
    S.GetCustomer({
      'email': 'truthplanets@gmail.com'
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
