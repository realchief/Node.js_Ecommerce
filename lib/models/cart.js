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
  , 'referring_list': {'type': String}
  , 'referring_media': {'type': String}
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
    return this.getProductsPrice({
      'products': this.get('products')
    });
  });

  M.virtual('shipping_groups').get(function(){
    return this._shipping_groups;
  }).set(function(val){
    this['_shipping_groups'] = val;
    return this;
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
          var pr = p.get('product');
          if (!pr) return cb2();

          pr.populate('stocks', Belt.cw(cb2, 0));
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
        if (_.every(self.get('products'), function(p){
          return p.stock;
        })) return cb();

        self.products = _.reject(self.get('products'), function(p){
          return !Belt.get(p, 'product._id');
        });

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
    , function(cb){
        self.products = _.reject(self.get('products'), function(p){
          return !Belt.get(p, 'stock');
        });

        cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  M.method('getProductsPrice', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //products
    });

    return _.reduce(a.o.products, function(m, p){
      if (!Belt.get(p, 'stock.price')) return m;

      return m + ((Belt.get(p, 'stock.price') * p.get('quantity')) || 0);
    }, 0);
  });

  M.method('getProductsWeight', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //products
    });

    return _.reduce(a.o.products, function(m, p){
      if (!Belt.get(p, 'stock.weight')) return m;

      return m + ((Belt.get(p, 'stock.weight') * p.get('quantity')) || 0);
    }, 0);
  });

  M.method('getProductsQuantity', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //products
    });

    return _.reduce(a.o.products, function(m, p){
      return m + (p.get('quantity') || 0);
    }, 0);
  });

  M.method('getShippingGroups', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'country': 'US'
    });

    Async.waterfall([
      function(cb){
        self.getStocks(Belt.cw(cb, 0));
      }
    , function(cb){
        gb['shipping_groups'] = _.groupBy(self.get('products'), function(p){
          return Belt.get(p, 'product.vendor.toString()');
        });

        cb();
      }
    , function(cb){
        gb.shipping_groups = _.mapObject(gb.shipping_groups, function(s, k){
          var weight = self.getProductsWeight({
                'products': s
              })
            , price = self.getProductsPrice({
              'products': s
              })
            , qty = self.getProductsQuantity({
                'products': s
              });

          var o = {
            'products': _.map(s, function(s2){
              return s2._id.toString();
            })
          , 'shipping_options': M.Instance.vendor_ids[k] && M.Instance.vendor_ids[k].getShippingOptions ? M.Instance.vendor_ids[k].getShippingOptions({
              'price': price
            , 'weight': weight
            , 'items': qty
            , 'country': a.o.country
            }) : undefined
          };

          o.shipping_options = _.map(o.shipping_options, function(o2){
            return {
              'option': o2
            , 'price': o2.priceOrder({
                'weight': weight
              })
            };
          });

          o['selected_shipping_option'] = Belt.copy(_.min(o.shipping_options, function(o2){
            return o2.price;
          }));

          return o;
        });

        self.set({
          'shipping_groups': gb.shipping_groups
        });

        cb();
      }
    ], function(err){
      a.cb(err, self);
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
    , 'shipping_groups': self.get('shipping_groups')
    , 'total_price': self.get('total_price')
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
