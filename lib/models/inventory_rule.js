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
  , Request = require('request')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'term': {'type': String}
  , 'term_fields': [
      {'type': String}
    ]
  , 'active': {'type': Boolean, 'default': true}
  , 'product_category': {'type': String}
  , 'product_brand': {'type': String}
  , 'product_hide': {'type': Boolean, 'default': false}
  , 'product_show': {'type': Boolean, 'default': false}
  , 'whitelist': {'type': Boolean, 'default': false}
  , 'brand': {'type': String}
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'details': {'type': Object}
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'term': 1
  , 'term_fields': 1
  , 'brand': 1
  , 'vendor': 1
  }, {
    'unique': 1
  });

  M['Instance'] = Instance;

  M.pre('save', function(next){
    if (!_.any(this.get('term_fields'))) this.set({
      'term_fields': [
        'brands'
      , 'label.us'
      , 'source.record.product_type'
      , 'source.record.tags'
      , 'source.record.categories'
      ]
    });

    next();
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    if (!a.o.is_admin){

    }

    return obj;
  });

  return M;
};
