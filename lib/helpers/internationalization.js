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
  , Languages = require('../../resources/assets/languages.json')
  , Countries = require('../../resources/assets/countries.json')
  , FS = require('fs')
;

module.exports = function(S){

  S['languages'] = Languages;
  S['countries'] = Countries;

  S['LocalitySchemaObject'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'spec': {'type': String}
    });

    return _.mapObject(self.languages, function(v, k){
      return a.o.spec;
    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
