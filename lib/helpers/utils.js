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

  S.instance['arrayCombinations'] = function(arr){
    if (arr.length === 0){
      return [];
    } else if (arr.length === 1){
      return arr[0];
    } else {
      var result = []
        , allCasesOfRest = S.instance.arrayCombinations(arr.slice(1));
      for (var c in allCasesOfRest) {
        for (var i = 0; i < arr[0].length; i++) {
          result.push(Belt.toArray(arr[0][i]).concat(Belt.toArray(allCasesOfRest[c])));
        }
      }

      return result;
    }
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
