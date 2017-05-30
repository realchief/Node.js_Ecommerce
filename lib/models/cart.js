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

  var ProductSchema = new Mongoose.Schema({
    'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
  , 'options': {'type': Object}
  , 'quantity': {'type': Number, 'min': 0, 'default': 1}
  });

  ProductSchema.virtual('stock').get(function(){
    return this._stock;
  }).set(function(val){
    this['_stock'] = val;
  });

  var M = new Mongoose.Schema({
    'products': [ProductSchema]
  });

  M.virtual('total_price').get(function(){
    return _.reduce(this.get('products'), function(m, p){
      if (!Belt.get(p, 'stock.price')) return m;

      return m + ((Belt.get(p, 'stock.price') * p.get('quantity')) || 0);
    }, 0);
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.method('populateProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        self.populate('products.product', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        Async.each(gb.doc.get('products'), function(p, cb2){
          p.get('product').populate('stocks', Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, gb.doc);
    });
  });

  M.method('getStocks', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        if (self.populated('products.product')) return cb();

        self.populate('products.product', Belt.cw(cb, 0));
      }
    , function(cb){
        Async.each(self.get('products'), function(p, cb2){
          M.Instance.db.model('product').getStock(_.extend({}, p, {
            'product': Belt.get(p, 'product._id') || p.product
          , 'available_quantity': p.quantity
          }), function(err, stock){
            p.set({
              'stock': stock || false
            });

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
      'products': self.populated('products.product') ? _.map(self.get('products'), function(s){
        return _.extend(s.toObject(), {
          'product': s.get('product').toSanitizedObject()
        }, s.get('stock') ? {
          'stock': s.get('stock').toSanitizedObject()
        } : {});
      }) : obj.products
    , 'total_price': self.get('total_price')
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
