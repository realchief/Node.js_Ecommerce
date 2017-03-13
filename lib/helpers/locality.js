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

    return _.mapObject(self.localities_obj, function(v, k){
      return a.o.spec;
    });
  };

  S['ValidateLocalitySchemaObject'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'test': function(v){
        return _.isString(v);
      }
      //object
    });

    if (!_.every(a.o.object, function(v, k){
      return self.localities_obj[k];
    }) || !_.every(a.o.object, function(v, k){
      return a.o.test(v);
    })) return false;

    return true;
  };

/*
  S.instance.express.all('/locality/object.json', function(req, res){
    res.status(200).json(S.LocalitySchemaObject());
  });
*/

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        return S.instance.mongodb_collections.localities.find({})
                .toArray(Belt.cs(cb, S.instance, 'localities', 1, 0));
      }
    , function(cb){
        S['localities_obj'] = _.object(_.pluck(S.instance.localities, 'name')
                            , _.pluck(S.instance.localities, 'name'));

        return cb();
      }
    ], function(err){
      if (err) S.emit('error', err);

      return S.emit('ready');
    });
  }, 0);
};
