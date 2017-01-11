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

////////////////////////////////////////////////////////////////////////////////
////SCHEMA                                                                  ////
////////////////////////////////////////////////////////////////////////////////

  var M = new Mongoose.Schema({
    'name': {'type': String}
  , 'description': {'type': String}
  , 'colors': [
      {'type': String}
    ]
  , 'sizes': [
      {'type': String}
    ]
  , 'brands': [
      {
        'name': {'type': String}
      , 'id': {'type': Mongoose.Schema.Types.ObjectId}
      , 'role': {'type': String}
      , 'description': {'type': String}
      }
    ]
  , 'categories': [
      {
        'name': {'type': String}
      , 'id': {'type': Mongoose.Schema.Types.ObjectId}
      , 'sub_name': {'type': String}
      , 'sub_id': {'type': Mongoose.Schema.Types.ObjectId}
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
        'name': {type: String}
      , 'description': {type: String}
      , 'created_at': {type: Date}
      }
    ]
  });

  M.plugin(Timestamps);
  M.plugin(Join);

  M.index({
    'name': 1
  });

  M.index({
    'brands.id': 1
  });

  M.index({
    'brands.name': 1
  });

  M.index({
    'categories.id': 1
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

////////////////////////////////////////////////////////////////////////////////
////END SCHEMA                                                              ////

////////////////////////////////////////////////////////////////////////////////
////SETUP                                                                   ////
////////////////////////////////////////////////////////////////////////////////

  M['Instance'] = Instance;

  return M;
};
