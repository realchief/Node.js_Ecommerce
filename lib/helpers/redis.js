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

};
