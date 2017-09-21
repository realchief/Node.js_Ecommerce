#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , Str = require('underscore.string')
  , FS = require('fs')
  , Request = require('request')
  , CRUD = require('./helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
  , Shopify = require('shopify-node-api')
;

module.exports = function(S){
  S.settings['sync_strategies_path'] = Path.join(S.settings.__dirname, './resources/assets/sync_strategies');
  S.settings['worker_regex'] = /worker/i;

  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  /**
   * @api {post} /vendor/create.json Create Vendor
   * @apiName CreateVendor
   * @apiGroup Vendor
   * @apiPermission admin
   *
   */
    S.instance.express.post('/' + S.name + '/create.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          self.model.create(a.o.data, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /vendor/:_id/read.json Read Vendor
   * @apiName ReadVendor
   * @apiGroup Vendor
   * @apiPermission public
   *
   */
    S.instance.express.get('/' + S.name + '/:_id/read.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('vendor not found'));

          cb();
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.get('/admin/' + S.name + '/:_id/read.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('vendor not found'));

          cb();
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': gb.doc ? gb.doc.toSanitizedObject({
            'is_admin':true
           }) : gb.doc
        });
      });
    });

    S.instance.express.get('/admin/' + S.name + '/:_id/order/:order/read.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('vendor not found'));

          self.instance.helpers.shopify.ReadOrder({
            'vendor': gb.doc
          , 'order': req.params.order
          }, Belt.cs(cb, gb, 'order', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': gb.order
        });
      });
    });

  /**
   * @api {put} /vendor/:_id/update.json Update Vendor
   * @apiName UpdateVendor
   * @apiGroup Vendor
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/update.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('vendor not found'));

          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          gb.doc.set(_.omit(a.o.data, [
            '_id'
          ]));

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {delete} /vendor/:_id/delete.json Delete Vendor
   * @apiName DeleteVendor
   * @apiGroup Vendor
   * @apiPermission admin
   *
   */
    S.instance.express.delete('/' + S.name + '/:_id/delete.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error(S.name + ' not found'));

          gb.doc.remove(Belt.cw(cb, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /vendor/list.json List Vendors
   * @apiName ListVendor
   * @apiGroup Vendor
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/list.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'docs.[].toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/admin/' + S.name + '/list.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': _.any(gb.docs) ? _.map(gb.docs, function(d){
            return d.toSanitizedObject({
              'is_admin': true
            });
          }) : gb.docs
        });
      });
    });

  /**
   * @api {get} /vendor/count.json Count Vendor
   * @apiName CountVendor
   * @apiGroup Vendor
   * @apiPermission admin, public
   *
   */
    S.instance.express.all('/' + S.name + '/count.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.count(a.o.data, Belt.cs(cb, gb, 'count', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'count')
        });
      });
    });

    S.instance.express.all('/' + S.name + '/:_id/shipping.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.model.findOne({
            '_id': req.params._id
          , 'shopify.access_token': {
              '$exists': true
            }
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('vendor not found'));

          gb['shopify'] = new Shopify({
            'shop': gb.doc.get('shopify.shop')
          , 'shopify_api_key': S.settings.shopify.key
          , 'access_token': gb.doc.get('shopify.access_token')
          });

          gb.shopify.get('/admin/shipping_zones.json', {

          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'data')
        });
      });
    });

  if (S.settings.environment.match(S.settings.worker_regex)) S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.model.find({
            'name': {
              '$ne': 'wanderset-dev'
            }
          , 'shopify.access_token': {
              '$exists': true
            }
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachSeries(_.shuffle(gb.docs), function(d, cb2){
            //if (d.name !== 'Surf is Dead') return cb2();

            d.syncShopifyInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 1000 * 60 * 60);
      });
    });
  });

  if (S.settings.environment.match(S.settings.worker_regex)) S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.model.find({
            'woocommerce.consumer_key': {
              '$exists': true
            }
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachSeries(_.shuffle(gb.docs), function(d, cb2){
            d.syncWoocommerceInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 1000 * 60 * 60);
      });
    });
  });

  if (S.settings.environment.match(S.settings.worker_regex)) S.instance.on('ready', function(){
    var gb = {};
    Async.waterfall([
      function(cb){
        S.model.find({
          'custom_sync.strategy': {
            '$exists': true
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        _.each(gb.docs, function(d){
          Async.forever(function(next){
            S.log.info('Syncing custom inventory "' + d.get('name') + '"');

            d.syncCustomInventory(function(){
              setTimeout(next, 1000 * 60 * 15);
            });
          });
        });
        cb();
      }
    ], function(err){

    });
  });

  S['sync_strategies'] = {};

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        var strats = FS.readdirSync(S.settings.sync_strategies_path);
        strats = _.filter(strats, function(s){
          return s.match(/\.js$/);
        });

        _.each(strats, function(s){
          var name = s.replace(/\.js$/, '');
          S.sync_strategies[name] = require(Path.join(S.settings.sync_strategies_path, '/' + s));
          S.sync_strategies[name] = new S.sync_strategies[name](S.settings, S.instance);

          S.log.info('Loaded custom sync strategy "' + name + '"');
        });

        cb();
      }
    , function(cb){
        var ocb = _.once(cb);

        Async.forever(function(next){
          S.instance['vendors'] = [];
          S.instance['vendor_ids'] = {};
          ocb();

          S.instance.helpers.cache.LoadVendors(function(err, sets){
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'vendors.length') || 0)  + ' vendors...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'shopify.access_token') ? true : false;
            }).length + ' vendors with Shopify sync...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'woocommerce.consumer_key') ? true : false;
            }).length + ' vendors with Woocommerce sync...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'custom_sync.strategy') ? true : false;
            }).length + ' vendors with custom sync strategy...');

            setTimeout(function(){
              next();
            }, 600000);

            ocb(err);
          });
        });
      }
    ], function(err){
      if (err) S.emit('error', err);

      S.emit('ready');
    });
  }, 0);
};
