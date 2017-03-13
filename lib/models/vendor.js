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
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'shipping_description': Instance.helpers.locality.LocalitySchemaObject()
  , 'returns_description': Instance.helpers.locality.LocalitySchemaObject()
  , 'setmembers': [
      {'type': Mongoose.Schema.Types.ObjectId, 'required': true, 'ref': 'setmember'}
    ]
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'name': 1
  }, {
    'unique': 1
  });

  M['Instance'] = Instance;

  M.pre('validate', function(next){
    if (this.get('label') && this.isModified('label') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('label')
    })) return next(new Error('Label localities are invalid'));

    if (this.get('description') && this.isModified('description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('description')
    })) return next(new Error('Description localities are invalid'));

    if (this.get('shipping_description') && this.isModified('shipping_description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('shipping_description')
    })) return next(new Error('Shipping_description localities are invalid'));

    if (this.get('returns_description') && this.isModified('returns_description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('returns_description')
    })) return next(new Error('Returns_description localities are invalid'));

    return next();
  });

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
