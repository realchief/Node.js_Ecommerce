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
    'code': {'type': String, 'required': true}
  , 'label': {'type': String}
  , 'error_label': {'type': String, 'default': 'Promo code is invalid'}
  , 'active': {'type': Boolean, 'default': false}
  , 'discount_type': {'type': String}
  , 'discount_amount': {'type': Number}
  , 'max_claims': {'type': Number}
  , 'claims': {'type': Number}
  , 'details': {'type': Object}
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'code': 1
  }, {
    'unique': 1
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

    if (!a.o.is_admin){

    }

    return obj;
  });

  M.pre('save', function(next){
    var code = this.get('promo_code');
    if (code) this.set({
      'code': code.toLowerCase()
    });

    next();
  });

  M.pre('save', function(next){
    var error_label = this.get('error_label');
    if (!error_label) this.set({
      'error_label': 'Promo code is invalid'
    });

    next();
  });

  return M;
};
