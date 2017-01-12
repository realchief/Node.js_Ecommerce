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
    'customer_name': {'type': String}
  , 'customer_email': {'type': String}
  , 'shipping_name': {'type': String}
  , 'shipping_address': {'type': String}
  , 'shipping_locality': {'type': String}
  , 'shipping_region': {'type': String}
  , 'shipping_postal_code': {'type': String}
  , 'shipping_country': {'type': String}
  , 'transactions': [
      {
        'amount': {'type': Number}
      , 'type': {'type': String}
      , 'id': {'type': String}
      , 'created_at': {'type': Date}
      , 'note': {'type': String}
      }
    ]
  , 'shipments': [
      {
        'items': [
          {
            'id': {'type': Mongoose.Schema.Types.ObjectId}
          }
        ]
      , 'tracking': {'type': String}
      , 'carrier': {'type': String}
      , 'service': {'type': String}
      , 'amount': {'type': Number}
      , 'created_at': {'type': Date}
      , 'note': {'type': String}
      }
    ]
  , 'items': [
      {
        'product': {'type': Mongoose.Schema.Types.ObjectId}
      , 'stock': {'type': Mongoose.Schema.Types.ObjectId}
      , 'quantity': {'type': Number}
      , 'subtotal': {'type': Number}
      }
    ]
  , 'messages': [
      {
        'sender': {'type': String}
      , 'subject': {'type': String}
      , 'message': {'type': String}
      , 'created_at': {'type': Date}
      }
    ]
  , 'total_amount': {'type': Number}
  , 'outstanding_amount': {'type': Number}
  , 'status': {'type': String}
  , 'events': [
      {
        'name': {'type': String}
      , 'description': {'type': String}
      , 'created_at': {'type': Date}
      }
    ]
  });

  M.index({
    'status': 1
  });

  M.index({
    'items.product': 1
  , 'items.stock': 1
  });

  M.plugin(Timestamps);
  M.plugin(Join);

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
