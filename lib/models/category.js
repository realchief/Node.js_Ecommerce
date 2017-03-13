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
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'name': {'type': String, 'required': true}
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'parent_category': {'type': Mongoose.Schema.Types.ObjectId, 'required': true, 'ref': 'category'}
  });

  M.virtual('subcategories').get(function(){
    return this._subcategories;
  }).set(function(val){
    this['_subcategories'] = val;
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'name': 1
  });

  M.index({
    'parent_category._id': 1
  });

  M.index({
    'parent_category.name': 1
  });

  M['Instance'] = Instance;

  M['populateSubcategories'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return self.constructor.find({
      'parent_category._id': self.get('_id')
    }, function(err, docs){
      if (err) return a.cb();

      self.set({
        'subcategories': docs
      });

      return a.cb(err, docs);
    });
  };

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
