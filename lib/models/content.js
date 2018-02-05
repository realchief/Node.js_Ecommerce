var _ = require('underscore')
  , Belt = require('jsbelt')
  , Mongoose = require('mongoose')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'page': {'type': String, 'required': true}
  , 'data': {'type': Object}
  });

  M.index({
    'page': 1
  }, {
    'unique': true
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);

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
