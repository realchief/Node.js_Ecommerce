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
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

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
  , 'last_sync': {'type': String}
  , 'synced_at': {'type': Date}
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

  M.method('syncInventory', function(options, callback){
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

        Instance.helpers.hub.IterateProducts({
          'shop': self.get('shopify.shop')
        , 'access_token': self.get('shopify.access_token')
        , 'progress_cb': function(p, cb2){
            //gb.products.push(p);
            //return cb2();

            Instance.helpers.hub.UpdateShopifyProduct({
              'product': p
            , 'vendor': self
            , 'last_sync': gb.last_sync
            , 'synced_at': gb.synced_at
            }, function(err, prod){
              if (err) Instance.emit('error', new Error('Product synching - '
              + self.get('_id').toString() + ' - ' + p.id + ' - ' + err.message));

              gb.products.push(prod.get('_id'));

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
          e.remove(Belt.cw(cb2));
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
        Async.eachSeries(gb.remove_stocks || [], function(e, cb2){
          e.set({
            'products': gb.products
          });

          e.save(Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.products);
    });
  });

  return M;
};
