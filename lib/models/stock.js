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
  , Crypto = require('crypto')
  , Mime = require('mime')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Str = require('underscore.string')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var M = new Mongoose.Schema({
    'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor', 'required': true}
  , 'options': {'type': Object, 'default': {}}
  , 'option_aliases': {'type': Object, 'default': {}}
  , 'price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  , 'quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  , 'reserve_quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  , 'vendor_data': {'type': Object, 'default': {}}
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'product': 1
  , 'vendor': 1
  , 'options': 1
  }, {
    'unique': true
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
