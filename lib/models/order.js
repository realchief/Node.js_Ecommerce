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
  , Str = require('underscore.string')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var M = new Mongoose.Schema({
    'products': [
      {
        'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
      , 'stock': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
      , 'options': {'type': Object}
      , 'unit_price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'status': {'type': String}
      }
    ]
  , 'line_items': [
      {
        'label': {'type': String, 'required': true}
      , 'description': {'type': String, 'required': true}
      , 'type': {'type': String, 'required': true}
      , 'amount': {'type': Number, 'required': true, 'default': 0}
      }
    ]
  , 'buyer': {
      'user': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'user'}
    , 'contact': {'type': String}
    , 'street': {'type': String, 'required': true}
    , 'street_b': {'type': String}
    , 'locality': {'type': String, 'required': true}
    , 'region': {'type': String, 'required': true}
    , 'country': {'type': String, 'required': true}
    , 'postal_code': {'type': String}
    , 'phone': {'type': String}
    , 'payment_method': {'type': String}
    }
  , 'recipient': {
      'user': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'user'}
    , 'contact': {'type': String}
    , 'street': {'type': String, 'required': true}
    , 'street_b': {'type': String}
    , 'locality': {'type': String, 'required': true}
    , 'region': {'type': String, 'required': true}
    , 'country': {'type': String, 'required': true}
    , 'postal_code': {'type': String}
    , 'phone': {'type': String}
    }
  , 'transactions': [
      {
        'token': {'type': String, 'required': true}
      , 'amount': {'type': Number, 'required': true}
      , 'created_at': {'type': Date, 'required': true}
      , 'type': {'type': String, 'required': true}
      , 'description': {'type': String}
      }
    ]
  , 'shipments': [
      {
        'id': {'type': String}
      , 'created_at': {'type': Date, 'required': true}
      , 'carrier': {'type': String}
      , 'description': {'type': String}
      , 'status': {'type': String}
      , 'items': [
          {'type': Mongoose.Schema.Types.ObjectId}
        ]
      }
    ]
  , 'messages': [
      {
        'sender': {'type': String}
      , 'created_at': {'type': Date, 'required': true}
      , 'subject': {'type': String}
      , 'body': {'type': String}
      , 'status': {'type': String}
      }
    ]
  , 'total_paid': {'type': Number, 'required': true, 'min': 0}
  , 'total_outstanding': {'type': Number, 'required': true, 'min': 0}
  , 'total_refunded': {'type': Number, 'required': true, 'min': 0}
  , 'status': {'type': String}
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

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
