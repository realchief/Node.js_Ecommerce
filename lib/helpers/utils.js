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
  , Querystring = require('querystring')
  , Natural = require('natural')
;

module.exports = function(S){

  S.instance['parseEmailAddress'] = function(val){
    return (val || '').split('<').pop().split('>').shift();
  };

  S.instance['priceString'] = function(val){
    val = Belt.cast(val, 'number');
    if (!val) return '0';
    if (Math.floor(val) === val) return Belt.cast(val, 'string');

    return val.toFixed(2);
  };

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

  S.instance['paginationUrl'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //Request
      //sort
      //skip
    });

    var url = a.o.Request.originalUrl
      , qs = Querystring.parse(url.split('?')[1] || '') || {};

    url = url.replace(/\?.*$/, '');

    if (!Belt.isNull(a.o.skip)){
      qs['skip'] = a.o.skip;
    }
    if (!Belt.isNull(a.o.sort)){
      qs['sort'] = a.o.sort;
    }

    url += '?' + Querystring.stringify(qs);

    return url;
  };

  S.instance['SanitizeHTML'] = function(html){
    html = html || '';
    html = html.replace(/<script.*>.*<\/script>/ig, '')
               .replace(/<iframe.*>.*<\/iframe>/ig, '')
    ;

    return html;
  };

  S.instance['SanitizeMongoQL'] = function(obj){
    var dobj = Belt.objFlatten(obj);

    _.each(dobj, function(v, k){
      if (v === 'true') Belt.set(obj, k, true);
      if (v === 'false') Belt.set(obj, k, false);
      if (v === 'null') Belt.set(obj, k, null);
      if (v === 'undefined') Belt.set(obj, k, undefined);
    });

    return obj;
  };

  S.instance['LevenshteinDistance'] = function(str, str2){
    str = Belt.cast(str || '', 'string');
    str2 = Belt.cast(str2 || '', 'string');

    return Natural.LevenshteinDistance(
      str.toLowerCase().replace(/\W/g, '')
    , str2.toLowerCase().replace(/\W/g, '')
    );
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
