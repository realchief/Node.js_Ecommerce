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
  , Redis = require('redis')
  , Request = require('request')
;

module.exports = function(S){
  var ocb = _.once(function(){
    return S.emit('ready');
  });

  S.instance['redis'] = Redis.createClient(S.settings.redis);

  S.instance.redis.on('ready', function(){
    S.log.info('CONNECTED TO REDIS: ' + Belt.stringify(S.settings.redis));
    ocb();
  });

  S.instance.redis.on('error', function(err){
    S.emit('error', err);
  });

  S['CacheUrl'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //url
      //key
      'host': self.settings.host
    , 'method': 'get'
    , 'qs': {}
      //body
    , 'auth': {
        'user': _.keys(S.settings.admin_users)[0]
      , 'pass': _.values(S.settings.admin_users)[0]
      }
    });

    Async.waterfall([
      function(cb){
        if (!a.o.url) return cb(new Error('url is required'));
        if (!a.o.key) return cb(new Error('key is required'));

        Request(_.extend({}, {
          'url': (a.o.host || '') + a.o.url
        , 'method': a.o.method
        , 'auth': a.o.auth
        , 'json': true
        , 'qs': a.o.qs
        , 'timeout': 14400000
        }, a.o.body ? {
          'body': a.o.body
        } : {}), Belt.cs(cb, gb, 'res', 2, 0));
      }
    , function(cb){
        self.instance.redis.set(a.o.key, JSON.stringify(gb.res || undefined), Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.res);
    });
  };

  S.instance.express.all('/admin/redis/cache/create.json', function(req, res){
    S.CacheUrl(req.data(), function(err, json){
      S.instance.JSONRes(res, err, json);
    });
  });

  S.instance.express.all('/admin/redis/read.json', function(req, res){
    var gb = {};

    Async.waterfall([
      function(cb){
        if (!a.o.key) return cb(new Error('key is required'));

        S.instance.redis.get(a.o.key, Belt.cs(cb, gb, 'data', 1, 0));
      }
    , function(cb){
        try {
          gb.data = Belt.parse(gb.data);
        } catch(e) {

        }

        cb();
      }
    ], function(err){
      S.instance.JSONRes(res, err, gb.data);
    });
  });
};
