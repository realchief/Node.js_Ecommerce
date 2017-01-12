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
  , 'product': {'type': Mongoose.Schema.Types.ObjectId}
  , 'color': {'type': String}
  , 'size': {'type': String}
  , 'material': {'type': String}
  , 'model': {'type': String}
  , 'media': [
      {
        'url': {'type': String}
      , 'file_type': {'type': String}
      , 'name': {'type': String}
      , 'description': {'type': String}
      }
    ]
  , 'price': {'type': Number}
  , 'quantity': {'type': Number}
  , 'reserved_quantity': {'type': Number}
  , 'sku': {'type': String}
  , 'vendor': {'type': String}
  , 'vendor_notes': {'type': String}
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
    'product': 1
  , 'color': 1
  , 'size': 1
  , 'material': 1
  , 'model': 1
  });

  M.index({
    'price': 1
  });

  M.index({
    'quantity': 1
  });

  M.index({
    'reserved_quantity': 1
  });

  M.index({
    'vendor': 1
  });

  M.index({
    'brands.id': 1
  });

  M.index({
    'brands.name': 1
  });

  M['Instance'] = Instance;

  M.method('update', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      //save populated
      function(cb){
        return self.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
      //populate
    , function(cb){
        M.Instance.io.to(gb.doc.constructor.modelName + ':' + gb.doc.get('_id').toString())
                     .emit(gb.doc.constructor.modelName + ':update', gb.doc.toSanitizedObject());

        return cb();
      }
    ], function(err){
      return a.cb(err, gb.doc);
    });
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
