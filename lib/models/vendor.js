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
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Request = require('request')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var ShippingOptionSchema = new Mongoose.Schema({
    'label': {'type': String}
  , 'description': {'type': String}
  , 'flat_price': {'type': Number}
  , 'unit_price': {'type': Number}
  , 'free': {'type': Boolean}
  , 'speed': {'type': String}
  , 'carrier': {'type': String}
  , 'min_price': {'type': Number}
  , 'max_price': {'type': Number}
  , 'min_weight': {'type': Number}
  , 'max_weight': {'type': Number}
  , 'min_items': {'type': Number}
  , 'max_items': {'type': Number}
  , 'allowed_countries': [
      {'type': String}
    ]
  , 'disallowed_countries': [
      {'type': String}
    ]
  });

  ShippingOptionSchema.method('priceOrder', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //weight
    });

    if (this.get('free')) return 0;
    if (!Belt.isNull(this.get('flat_price'))) return this.get('flat_price');
    if (!Belt.isNull(this.get('unit_price'))) return this.get('unit_price') * a.o.weight;

    M.Instance.emit('error', 'Shipping not priced - ' + this.get('_id').toString());

    return 0;
  });

  var M = new Mongoose.Schema({
    'name': {'type': String, 'required': true}
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'editorial_notes': Instance.helpers.locality.LocalitySchemaObject()
  , 'shipping_returns': Instance.helpers.locality.LocalitySchemaObject()
  , 'sizing_guide': Instance.helpers.locality.LocalitySchemaObject()
  , 'setmembers': [
      {'type': Mongoose.Schema.Types.ObjectId, 'required': true, 'ref': 'setmember'}
    ]
  , 'shopify': {
      'access_token': {'type': String}
    , 'shop': {'type': String}
    }
  , 'woocommerce': {
      'url': {'type': String}
    , 'consumer_key': {'type': String}
    , 'secret': {'type': String}
    }
  , 'custom_sync': {
      'strategy': {'type': String}
    , 'details': {'type': Object}
    }
  , 'last_sync': {'type': String}
  , 'synced_at': {'type': Date}
  , 'shipping_options': [ShippingOptionSchema]
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'name': 1
  }, {
    'unique': 1
  });

  M['Instance'] = Instance;

  M.method('getShippingOptions', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'weight': 0
    , 'price': 0
    , 'items': 0
    , 'country': 'US'
    });

    var so = _.filter(this.get('shipping_options') || [], function(o){
      if (!Belt.isNull(o.min_price) && a.o.price < o.min_price) return false;
      if (!Belt.isNull(o.max_price) && a.o.price >= o.max_price) return false;

      if (!Belt.isNull(o.min_items) && a.o.items < o.min_items) return false;
      if (!Belt.isNull(o.max_items) && a.o.items >= o.max_items) return false;

      if (!Belt.isNull(o.min_weight) && a.o.weight < o.min_weight) return false;
      if (!Belt.isNull(o.max_weight) && a.o.weight >= o.max_weight) return false;

      if (_.any(o.allowed_countries) && !_.some(o.allowed_countries, function(c){
        return c === a.o.country;
      })) return false;

      if (_.any(o.disallowed_countries) && _.some(o.disallowed_countries, function(c){
        return c === a.o.country;
      })) return false;

      return true;
    });

    return so;
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    if (!a.o.is_admin){
      Belt.delete(obj, 'shopify.access_token');
      Belt.delete(obj, 'woocommerce.consumer_key');
      Belt.delete(obj, 'woocommerce.secret');
      Belt.delete(obj, 'custom_sync.details');
    }

    return obj;
  });

  M.method('syncShopifyInventory', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        gb['products'] = [];
        gb['last_sync'] = Belt.uuid();
        gb['synced_at'] = new Date();

        Instance.helpers.shopify.IterateProducts({
          'shop': self.get('shopify.shop')
        , 'access_token': self.get('shopify.access_token')
        , 'progress_cb': function(p, cb2){

            Instance.helpers.shopify.UpdateProduct({
              'product': p
            , 'vendor': self
            , 'last_sync': gb.last_sync
            , 'synced_at': gb.synced_at
            }, function(err, prod){

              /*if (err){
                Instance.emit('error', new Error('Product syncing - '
                + self.get('_id').toString() + ' - ' + p.id + ' - ' + err.message));
              }*/

              if (Belt.get(prod, 'get("_id")')){
                gb.products.push(prod.get('_id'));
              }

              cb2();
            });

          }
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('product').find({
          'vendor': self.get('_id')
        , 'last_sync': {
            '$ne': gb.last_sync
          }
        }, Belt.cs(cb, gb, 'remove_products', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.remove_products || [], function(e, cb2){
          e.set({
            'sync_hide': true
          , 'hide_note': 'sync - removed unsynced product'
          });

          e.save(Belt.cw(cb2));

          //e.remove(Belt.cw(cb2));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('stock').find({
          'vendor': self.get('_id')
        , 'last_sync': {
            '$ne': gb.last_sync
          }
        }, Belt.cs(cb, gb, 'remove_stocks', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.remove_stocks || [], function(e, cb2){
          e.remove(Belt.cw(cb2));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('set').find({
          'vendor': self.get('_id')
        }, Belt.cs(cb, gb, 'sets', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.sets || [], function(e, cb2){
          var prods = _.filter(e.get('products') || [], function(p){
            return _.some(gb.products, function(p2){
              return p2.toString() === p.toString();
            });
          }) || [];

          _.each(gb.products, function(p){
            if (_.some(prods, function(p2){
              return p2.toString() === p.toString();
            })) return;

            prods.unshift(p);
          });

          e.set({
            'products': prods
          });

          e.save(Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      //if (err) M.instance.emit('error', new Error('Error syncing shopify - ' + self.get('_id').toString() + ' - ' + err.message));

      a.cb(err, gb.products);
    });
  });

  M.method('syncWoocommerceInventory', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        gb['products'] = [];
        gb['last_sync'] = Belt.uuid();
        gb['synced_at'] = new Date();

        Instance.helpers.woocommerce.IterateProducts({
          'url': self.get('woocommerce.url')
        , 'consumer_key': self.get('woocommerce.consumer_key')
        , 'secret': self.get('woocommerce.secret')
        , 'progress_cb': function(p, cb2){

            /*
            if (!_.some(p.variations, function(v){
              return v.in_stock && v.stock_quantity > 0;
            })) return cb2();
            */

            Instance.helpers.woocommerce.UpdateProduct({
              'product': p
            , 'vendor': self
            , 'last_sync': gb.last_sync
            , 'synced_at': gb.synced_at
            }, function(err, prod){

              /*if (err){
                Instance.emit('error', new Error('Product syncing - '
                + self.get('_id').toString() + ' - ' + p.id + ' - ' + err.message));
              }*/

              if (Belt.get(prod, 'get("_id")')){
                gb.products.push(prod.get('_id'));
              }

              cb2();
            });

          }
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('product').find({
          'vendor': self.get('_id')
        , 'last_sync': {
            '$ne': gb.last_sync
          }
        }, Belt.cs(cb, gb, 'remove_products', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.remove_products || [], function(e, cb2){
          e.set({
            'sync_hide': true
          , 'hide_note': 'sync - removed unsynced product'
          });

          e.save(Belt.cw(cb2));

          //e.remove(Belt.cw(cb2));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('stock').find({
          'vendor': self.get('_id')
        , 'last_sync': {
            '$ne': gb.last_sync
          }
        }, Belt.cs(cb, gb, 'remove_stocks', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.remove_stocks || [], function(e, cb2){
          e.remove(Belt.cw(cb2));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('set').find({
          'vendor': self.get('_id')
        }, Belt.cs(cb, gb, 'sets', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.sets || [], function(e, cb2){
          var prods = _.filter(e.get('products') || [], function(p){
            return _.some(gb.products, function(p2){
              return p2.toString() === p.toString();
            });
          }) || [];

          _.each(gb.products, function(p){
            if (_.some(prods, function(p2){
              return p2.toString() === p.toString();
            })) return;

            prods.unshift(p);
          });

          e.set({
            'products': prods
          });

          e.save(Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      //if (err) M.instance.emit('error', new Error('Error syncing shopify - ' + self.get('_id').toString() + ' - ' + err.message));

      a.cb(err, gb.products);
    });
  });

  M.method('syncCustomInventory', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'strategy': M.Instance.controllers.vendor.sync_strategies[self.get('custom_sync.strategy')]
    });

    return Async.waterfall([
      function(cb){
        if (!a.o.strategy) return cb(new Error('sync strategy not found'));

        gb['last_sync'] = Belt.uuid();
        gb['synced_at'] = new Date();

        a.o.strategy.SyncVendor({
          'vendor': self
        , 'last_sync': gb.last_sync
        , 'synced_at': gb.synced_at
        , 'progress_cb': function(p, cb2){

            a.o.strategy.UpdateProduct({
              'product': p
            , 'vendor': self
            , 'last_sync': gb.last_sync
            , 'synced_at': gb.synced_at
            }, function(err, prod){

              if (err){
        /*        Instance.emit('error', new Error('Product syncing - '
                + self.get('_id').toString() + ' - ' + p.id + ' - ' + err.message));*/
              }

              cb2();
            });

          }
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      //if (err) M.Instance.emit('error', new Error('Error syncing custom - ' + self.get('_id').toString() + ' - ' + err.message));

      a.cb(err, gb);
    });
  });

  if (Belt.get(Instance.settings, 'notifications.platform_vendors_slack')){
    M.pre('save', function(next){
      if (!this.isNew) return next();

      Request({
        'url': Instance.settings.notifications.platform_vendors_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': 'New vendor: '
                + this.get('name')
                + ' <https://wanderset.com/admin/vendor/' + this.get('_id').toString() + '/read>'
        , 'username': 'VENDOR-BOT'
        , 'icon_emoji': ':shopping_bags:'
        }
      }, Belt.noop);

      next();
    });
  }

  return M;
};
