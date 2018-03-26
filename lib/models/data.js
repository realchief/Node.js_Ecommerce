var FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Str = require('underscore.string')
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
    'label': {'type': String}
  , 'details': {'type': Object, 'default': {}}
  , 'data': {'type': Mongoose.Schema.Types.Mixed}
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  //M.plugin(Notify);

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

  M.method('toCSVObject', function(options, callback){
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
