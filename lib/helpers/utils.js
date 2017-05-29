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
;

module.exports = function(S){

  S.instance['toPercentage'] = function(val){
    val = Belt.cast(val, 'number') || 0;
    return (val * 100).toFixed(2);
  };

  S.instance['escapeRegExp'] = function(val){
    return (val || '').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  };

  S.instance['sanitizeLabel'] = function(val){
    return Str.trim(val.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' '));
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
