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
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'sku': {'type': String, 'required': true}
  , 'source': {
      'platform': {'type': String}
    , 'record': {'type': Mongoose.Schema.Types.Mixed}
    }
  , 'last_sync': {'type': String}
  , 'synced_at': {'type': Date}
  , 'manual_override': {'type': Boolean}
  , 'options': {'type': Object, 'default': {}}
  , 'price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  , 'list_price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  , 'available_quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  , 'reserve_quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'sku': 1
  });

  M.virtual('weight').get(function(){
    var w = Belt.get(this, 'source.record.weight');
    w = Belt.isNull(w) ? false : w;
    return w;
  });

  M.pre('validate', function(next){
    if (this.get('sku') || !this.get('product')) return next();

    var sku = Crypto.createHash('md5');
    sku.update(this.product.toString() + '::' + (_.map(this.options, function(v, k){
      return k + ':' + v.value;
    }).join(';') || ''));
    sku = sku.digest('hex');

    this.set({
      'sku': sku
    });

    next();
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
      'weight': self.get('weight')
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  M.post('remove', function(doc){
    Async.waterfall([
      function(cb){
        Instance.db.model('product').find({
          'stocks': doc._id
        }, function(err, docs){
          Async.eachSeries(docs, function(d, cb2){
            d.stocks.pull(doc._id);

            d.set({
              'skip_media_processing': true
            });

            d.save(Belt.cw(cb2));
          }, Belt.cw(cb, 0));
        });
      }
    ], function(err){
      if (err) Instance.emit('error', err);
    });
  });

  return M;
};
