#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , FS = require('fs')
  , Str = require('underscore.string')
  , Querystring = require('querystring')
  , Shopify = require('shopify-node-api')
;

module.exports = function(S){
  S['CreateOrder'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //vendor
      //order
    });

    var shopify = new Shopify({
      'shop': a.o.vendor.shopify.shop
    , 'shopify_api_key': self.settings.shopify.key
    , 'access_token': a.o.vendor.shopify.access_token
    });

    Async.waterfall([
      function(cb){
        shopify.post('/admin/orders.json', {
          'order': _.extend(a.o.order, {
            'inventory_behavior': 'decrement_obeying_policy'
          , 'send_receipt': true
          , 'send_fulfillment_receipt': true
          })
        }, Belt.cs(cb, gb, 'order', 1, 0));
      }
    , function(cb){
        Async.eachSeries(Belt.get(gb, 'order.order.line_items') || [], function(l, cb2){
          shopify.put('/admin/variants/' + l.variant_id + '.json', {
            'variant': {
              'id': l.variant_id
            , 'inventory_quantity_adjustment': (-1 * l.quantity)
            }
          }, Belt.cw(cb2));
        }, function(err){
          cb();
        });
      }
    ], function(err){
      a.cb(err, gb.order);
    });
  };

  S['ReadOrder'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //vendor
      //order
    });

    var shopify = new Shopify({
      'shop': a.o.vendor.shopify.shop
    , 'shopify_api_key': self.settings.shopify.key
    , 'access_token': a.o.vendor.shopify.access_token
    });

    shopify.get('/admin/orders/' + a.o.order + '.json', function(err, data){
      a.cb(err, data);
    });
  };

  S['ReadShipping'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //vendor
      //order
    });

    var shopify = new Shopify({
      'shop': a.o.vendor.shopify.shop
    , 'shopify_api_key': self.settings.shopify.key
    , 'access_token': a.o.vendor.shopify.access_token
    });

    shopify.get('/admin/shipping_zones.json', function(err, data){
      a.cb(err, data);
    });
  };

  S['ReadEndpoint'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //vendor
      //url
      'method': 'get'
    });

    var shopify = new Shopify({
      'shop': a.o.vendor.shopify.shop
    , 'shopify_api_key': self.settings.shopify.key
    , 'access_token': a.o.vendor.shopify.access_token
    });

    shopify[a.o.method](a.o.url, a.o.body ? a.o.body : function(err, data){
      a.cb(err, data);
    }, a.o.body ? undefined : function(err, data){
      a.cb(err, data);
    });
  };

  S['UpdateProduct'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //product
      //vendor
      //last_sync
      //synced_at
    });

    var SanitizeHTML = S.instance.SanitizeHTML;

    Async.waterfall([
      function(cb){
        if (!_.any(a.o.product.images)) return cb(new Error('Product does not have images'));
        if (a.o.vendor.get('name') === 'Dead Studios' && Belt.call(a.o.product, 'tags.match', /women|woman|female|girl/i)) return cb(new Error('Product is for women'));
        if (Belt.call(a.o.product, 'handle.match', /\_hers/i)) return cb(new Error('Product is for women'));

        gb['sku'] = Belt.cast(a.o.product.id, 'string');

        S.instance.log.warn('Syncing "' + gb.sku + '"');

        self.instance.db.model('product').findOne({
          'sku': gb.sku
        , 'vendor': a.o.vendor.get('_id')
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) gb['new_product'] = true;

        gb.doc = gb.doc || S.instance.db.model('product')({});

        _.each(a.o.product.options, function(o){
          if (!o.name) return;
          o.name = o.name.replace(/\./g, '');
        });

        gb.doc.set({
          'sku': gb.sku
        , 'name': gb.doc.get('name') || a.o.product.handle || a.o.product.title
        , 'label': {
            'us': gb.doc.get('label.us') || Str.stripTags(a.o.product.title)
          }
        , 'description': {
            'us': SanitizeHTML(gb.doc.get('description.us')) || gb.doc.get('description.us') || SanitizeHTML(a.o.product.body_html) || a.o.product.body_html
          }
        , 'vendor': a.o.vendor.get('_id')
        , 'brands': false && Belt.get(gb.doc, 'brands.0') ? gb.doc.brands : [
            a.o.product.vendor || a.o.vendor.get('name')
          ]
        , 'last_sync': a.o.last_sync
        , 'synced_at': a.o.synced_at
        , 'source': {
            'platform': 'shopify'
          , 'record': Belt.parse(SanitizeHTML(Belt.stringify(a.o.product)))
          }
        /*
        , 'media': _.map(a.o.product.images, function(i){

            return {
              'remote_url': i.src
            };
          })
        */
        , 'options': _.object(
            _.pluck(a.o.product.options, 'name')
          , _.map(a.o.product.options, function(o){
              return {
                'name': o.name
              , 'label': {
                  'us': o.name
                }
              , 'values': {
                  'us': o.values
                }
              }
            })
          )
        });

        if (!a.o.product.published_at){
          gb.doc.set({
            'sync_hide': true
          , 'hide_note': 'sync - published_at not set'
          });

        } else {
          gb.doc.set({
            'sync_hide': false
          });
        }

        if (a.o.vendor.get('name') === 'Night : Shift') gb.doc.set({
          'sync_hide': false
        });

        if (a.o.vendor.get('name') === 'Tango Hotel') gb.doc.set({
          'sync_hide': false
        });

        gb.doc.media = _.filter(gb.doc.media, function(m){
          return _.some(a.o.product.images, function(i){
            return i.src === m.remote_url;
          });
        }) || [];

        _.each(a.o.product.images, function(i){
          if (_.some(gb.doc.media, function(m){
            return i.src === m.remote_url;
          })) return;

          gb.doc.media.push({
            'remote_url': i.src
          , 'skip_processing': true
          });
        });

        gb.doc.media = _.sortBy(gb.doc.media, function(m){
          return _.indexOf(_.pluck(a.o.product.images, 'src'), m.remote_url);
        });

        _.each(gb.doc.media, function(m){
          m['skip_processing'] = true;
        });

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        gb['stocks'] = [];

        gb['options'] = {};
        _.each(a.o.product.options, function(o){
          gb.options['option' + o.position] = o;
        });

        Async.eachSeries(a.o.product.variants || [], function(v, cb2){
          var gb2 = {};

          Async.waterfall([
            function(cb3){
              self.instance.db.model('stock').findOne({
                'sku': Belt.cast(v.id, 'string')
              , 'vendor': a.o.vendor.get('_id')
              , 'product': gb.doc.get('_id')
              }, Belt.cs(cb3, gb2, 'stock', 1, 0));
            }
          , function(cb3){
              gb2.stock = gb2.stock || S.instance.db.model('stock')({});

              var opts = {};
              _.each(gb.options, function(o, k){
                if (!v[k]) return;
                opts[o.name] = {
                  'alias': o.name
                , 'value': v[k]
                , 'alias_value': v[k]
                };
              });

              gb2.stock.set({
                'product': gb.doc.get('_id')
              , 'vendor': a.o.vendor.get('_id')
              , 'sku': Belt.cast(v.id, 'string')
              , 'source': {
                  'platform': 'shopify'
                , 'record': Belt.parse(SanitizeHTML(Belt.stringify(v)))
                }
              , 'last_sync': a.o.last_sync
              , 'synced_at': a.o.synced_at
              , 'options': opts
              , 'price': Math.ceil(Belt.cast(v.price, 'number'))
              , 'compare_at_price': null
              , 'list_price': Math.ceil(Belt.cast(v.price, 'number'))
              , 'available_quantity': v.inventory_quantity >= 0 ? v.inventory_quantity : 0
              });

              if (v.compare_at_price){
                v.compare_at_price = Math.ceil(Belt.cast(v.compare_at_price, 'number'));
                if (v.compare_at_price > v.price) gb2.stock.set({
                  'compare_at_price': v.compare_at_price
                });
              }

              gb2.stock.save(Belt.cs(cb3, gb2, 'stock', 1, 0));
            }
          , function(cb3){
              gb.stocks.push(gb2.stock.get('_id'));

              cb3();
            }
          ], Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb.doc.set({
          'stocks': gb.stocks
        });

        gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getConfigurations();

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        gb['brand'] = Belt.get(gb, 'doc.brands.0');

        if (!gb.brand) return cb();

        self.instance.db.model('set').findOne({
          'brand': true
        , 'name': new RegExp('^' + self.instance.escapeRegExp(gb.brand) + '$', 'i')
        , 'vendor': {
            '$ne': gb.doc.vendor
          }
        }, Belt.cs(cb, gb, 'brand_set', 1, 0));
      }
    , function(cb){
        if (!gb.brand_set) return cb();

        if (_.some(gb.brand_set.products, function(p){
          return p.toString() === gb.doc.get('_id').toString();
        })) return cb();

        gb.brand_set.products.unshift(gb.doc.get('_id'));

        gb.brand_set.save(Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  };

  S['IterateProducts'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //access_token
      //shop
      'progress_cb': Belt.np
    });

    Async.waterfall([
      function(cb){
        gb['shopify'] = new Shopify({
          'shop': a.o.shop
        , 'shopify_api_key': self.settings.shopify.key
        , 'access_token': a.o.access_token
        });

        gb['page'] = 1;

        Async.doWhilst(function(next){
          gb.shopify.get('/admin/products.json', {
            'page': gb.page++
          }, function(err, data){
            gb['products'] = Belt.get(data, 'products') || [];

            Async.eachSeries(gb.products, function(p, cb2){
              a.o.progress_cb(p, cb2);
            }, Belt.cw(next, 0));
          });
        }, function(){ return _.any(gb.products); }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  };

  S.instance.express.all('/hub/shopify/:shop/authorize.json', function(req, res){
    req.session['shopify_nonce'] = Belt.uuid();

    var api = new Shopify({
      'shop': req.params.shop
    , 'shopify_api_key': S.settings.shopify.key
    , 'shopify_shared_secret': S.settings.shopify.secret
    , 'shopify_scope': 'read_products,write_products,read_orders,write_orders,read_shipping,read_price_rules'
    , 'redirect_uri': (S.settings.shopify.host || S.settings.host) + '/hub/shopify/authorize/redirect.json'
    , 'nonce': req.session.shopify_nonce
    });

    res.redirect(api.buildAuthURL());
  });

  S.instance.express.all('/hub/shopify/authorize/redirect.json', function(req, res){
    var shop = req.query.shop.replace(/\.myshopify\.com/, '')
      , api = new Shopify({
          'shop': req.query.shop
        , 'shopify_api_key': S.settings.shopify.key
        , 'shopify_shared_secret': S.settings.shopify.secret
        , 'shopify_scope': 'read_products,write_products,read_orders,write_orders,read_shipping,read_price_rules'
        , 'redirect_uri': (S.settings.shopify.host || S.settings.host) + '/hub/shopify/authorize/redirect.json'
        , 'nonce': req.session.shopify_nonce
        });

    api.exchange_temporary_token(req.query, function(err, data){
      if (err) return res.status(400)
                         .type('html')
                         .end('<h2>An error occurred connecting to Shopify. Please contact Wanderset.</h2>');

      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('vendor').findOne({
            'shopify.shop': shop
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc = gb.doc || S.instance.db.model('vendor')({});

          gb.doc.set({
            'name': gb.doc.get('name') || shop
          , 'shopify.shop': shop
          , 'shopify.access_token': data.access_token
          });

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err){
          console.log(err);
          S.emit('error', err);
        } else {
          delete req.session.shopify_nonce;
        }

        res.status(200).type('text/html').end(S.instance.renderView(req, 'shopify_confirmation', {
          'message': err ? 'An error occurred connecting to Shopify. Please contact Wanderset.'
                         : 'Thank you for authorizing Wanderset through Shopify! We will be in touch shortly when your products are ready.'
        }));
      });
    });
  });

  S.instance.express.all('/shopify', function(req, res){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err){
        return res.status(400).end(err.message);
      }

      try {
        res.status(200).type('text/html').end(S.instance.renderView(req, 'shopify', {

        }));
      } catch(e){
        res.redirect('/');
      }
    });
  });

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err) S.emit('error', err);

      return S.emit('ready');
    });
  }, 0);

};
