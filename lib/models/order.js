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
        'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product'}
      , 'stock': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'stock'}
      , 'options': {'type': Object}
      , 'unit_price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'status': {'type': String}
      , 'source': {
          'product': {'type': Object}
        , 'stock': {'type': Object}
        }
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
    , 'first_name': {'type': String, 'required': true}
    , 'last_name': {'type': String, 'required': true}
    , 'street': {'type': String, 'required': true}
    , 'street_b': {'type': String}
    , 'city': {'type': String, 'required': true}
    , 'region': {'type': String, 'required': true}
    , 'country': {'type': String, 'required': true}
    , 'postal_code': {'type': String, 'required': true}
    , 'phone': {'type': String, 'required': true}
    , 'email': {'type': String, 'required': true}
    , 'payment_method': {'type': String, 'required': true}
    , 'payment_customer_id': {'type': String, 'required': true}
    }
  , 'recipient': {
      'user': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'user'}
    , 'first_name': {'type': String, 'required': true}
    , 'last_name': {'type': String, 'required': true}
    , 'street': {'type': String, 'required': true}
    , 'street_b': {'type': String}
    , 'city': {'type': String, 'required': true}
    , 'region': {'type': String, 'required': true}
    , 'country': {'type': String, 'required': true}
    , 'postal_code': {'type': String, 'required': true}
    , 'phone': {'type': String, 'required': true}
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
      , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
      , 'shipping_option': {'type': Mongoose.Schema.Types.ObjectId}
      , 'source': {
          'shipping_option': {'type': Object}
        }
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
