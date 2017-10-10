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
  , Bcrypt = require('bcrypt')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {
    'salt_rounds': 10
  , 'secret_expiry_ms': 60 * 15 * 1000
  };

  var M = new Mongoose.Schema({
    'name': {'type': String}
  , 'email': {'type': String, 'match': Belt.email_regexp}
  , 'locality': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'locality'}
  , 'address': [
      {
        'first_name': {'type': String}
      , 'last_name': {'type': String}
      , 'street': {'type': String}
      , 'street_b': {'type': String}
      , 'city': {'type': String}
      , 'region': {'type': String}
      , 'country': {'type': String}
      , 'postal_code': {'type': String}
      , 'phone': {'type': String}
      }
    ]
  , 'roles': {
      'customer': {'type': Boolean, 'default': false}
    , 'setmember': {'type': Boolean, 'default': false}
    , 'admin': {'type': Boolean, 'default': false}
    , 'subscriber': {'type': Boolean, 'default': false}
    }
  , 'payment_account_id': {'type': String}
  , 'password_hash': {'type': String}
  , 'secret': {
      'hash': {'type': String}
    , 'expires': {'type': Date}
    }
  });

  M.virtual('payment_account').get(function(){
    return this._payment_account;
  }).set(function(val){
    this['_payment_account'] = val;
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'email': 1
  }, {
    'unique': true
  });

  M.method('setPassword', function(password, callback){
    callback = callback || Belt.np;
    var self = this;

    Bcrypt.hash(password, GB.salt_rounds, function(err, hash){
      if (err) return callback(err);

      self.set({
        'password_hash': hash
      });

      return callback(err);
    });
  });

  M.method('checkPassword', function(password, callback){
    callback = callback || Belt.np;
    var self = this;

    Bcrypt.compare(password, self.get('password_hash'), function(err, res){
      if (!err && !res) err = new Error('Password does not match');
      callback(err, res);
    });
  });

  M.method('setSecret', function(callback){
    callback = callback || Belt.np;
    var self = this;

    var gb = {};

    return Async.waterfall([
      function(cb){
        return Crypto.randomBytes(256, Belt.cs(cb, gb, 'secret', 1, 'toString("base64")', 0));
      }
    , function(cb){
        return Bcrypt.hash(gb.secret, GB.salt_rounds, Belt.cs(cb, gb, 'hash', 1, 0));
      }
    , function(cb){
        gb['expires'] = Moment().add(GB.secret_expiry_ms, 'milliseconds').toDate();
        return cb();
      }
    ], function(err){
      if (err) return callback(err);

      self.set({
        'secret': {
          'hash': gb.hash
        , 'expires': gb.expires
        }
      });

      return callback(err, {
        'secret': gb.secret
      , 'expires': gb.expires
      });
    });
  });

  M.method('checkSecret', function(secret, callback){
    callback = callback || Belt.np;
    var self = this;

    if (!self.get('secret.expires')
      || Moment(self.get('secret.expires')).isBefore(new Date())){
      return callback(new Error('Secret has expired'));
    }

    Bcrypt.compare(secret, self.get('secret.hash'), function(err, res){
      if (!err && !res) err = new Error('Secret does not match');
      callback(err, res);
    });
  });

  M.method('createPaymentAccount', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        return M.Instance.stripe.customers.create({
          'description': self.get('_id').toString()
        }, Belt.cs(cb, gb, 'payment_account_id', 1, 'id', 0));
      }
    , function(cb){
        self.set({
          'payment_account_id': gb.payment_account_id
        });

        return cb();
      }
    ], function(err){
      return a.cb(err);
    });
  });

  M.method('getPaymentAccount', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        if (self.get('payment_account_id')) return cb();

        return self.createPaymentAccount(Belt.cw(cb, 0));
      }
    , function(cb){
        M.Instance.stripe.customers.retrieve(self.get('payment_account_id')
        , Belt.cs(cb, gb, 'payment_account', 1, 0));
      }
    , function(cb){
        self.set({
          'payment_account': gb.payment_account
        });

        return cb();
      }
    ], function(err){
      return a.cb(err, gb.payment_account);
    });
  });

  M.method('createPaymentMethod', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //payment_token
    });

    return Async.waterfall([
      function(cb){
        if (self.get('payment_account_id')) return cb();

        return self.createPaymentAccount(Belt.cw(cb, 0));
      }
    , function(cb){
        M.Instance.stripe.customers.createSource(
          self.get('payment_account_id')
        , {
            'source': a.o.payment_token
          }
        , Belt.cw(cb, 0));
      }
    , function(cb){
        return self.getPaymentAccount(Belt.cs(cb, gb, 'payment_account', 1, 0));
      }
    ], function(err){
      return a.cb(err, gb.payment_account);
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

    _.omit(obj, [
      'password_hash'
    , 'secret'
    ]);

    return obj;
  });

  return M;
};
