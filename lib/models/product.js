var FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Util = require('util')
  , Path = require('path')
  , Optionall = require('optionall')
  , Mongoose = require('mongoose')
  , Moment = require('moment-timezone')
  , CP = require('child_process')
  , OS = require('os')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'name': {'type': String}
  , 'description': {'type': String}
  , 'colors': [
      {'type': String}
    ]
  , 'sizes': [
      {'type': String}
    ]
  , 'materials': [
      {'type': String}
    ]
  , 'models': [
      {'type': String}
    ]
  , 'brands': [
      {
        'name': {'type': String}
      , 'role': {'type': String}
      , 'description': {'type': String}
      }
    ]
  , 'categories': [
      {
        'name': {'type': String}
      , 'sub_name': {'type': String}
      }
    ]
  , 'gender': {'type': String}
  , 'limited_edition': {'type': Boolean}
  , 'collaboration': {'type': Boolean}
  , 'season': {'type': String}
  , 'media': [
      {
        'url': {'type': String}
      , 'file_type': {'type': String}
      , 'name': {'type': String}
      , 'description': {'type': String}
      }
    ]
  , 'events': [
      {
        'name': {'type': String}
      , 'description': {'type': String}
      , 'created_at': {'type': Date}
      }
    ]
  });

  M.plugin(Timestamps);
  M.plugin(Join);

  M.index({
    'name': 1
  });

  M.index({
    'brands.name': 1
  });

  M.index({
    'categories.name': 1
  });

  M.index({
    'name': 'text'
  , 'description': 'text'
  , 'brands.name': 'text'
  }, {
    'default_language': 'en'
  , 'language_override': 'language'
  , 'weights': {

    }
  });

  M['Instance'] = Instance;

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    return obj;
  });

  return M;
};
