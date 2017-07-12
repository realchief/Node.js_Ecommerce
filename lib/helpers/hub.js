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
  , Querystring = require('querystring')
  , Shopify = require('shopify-node-api')
;

module.exports = function(S){
  S['UpdateShopifyProduct'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //product
      //vendor
      //last_sync
      //synced_at
    });

    Async.waterfall([
      function(cb){
        self.instance.db.model('product').findOne({
          'sku': Belt.cast(a.o.product.id, 'string')
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc || S.instance.db.model('product')({});

        gb.doc.set({
          'sku': Belt.cast(a.o.product.id, 'string')
        , 'name': a.o.product.handle || a.o.product.title
        , 'label': {
            'us': a.o.product.title
          }
        , 'description': {
            'us': a.o.product.body_html
          }
        , 'vendor': a.o.vendor.get('_id')
        , 'brands': [
            a.o.vendor.get('name')
          ]
        , 'last_sync': a.o.last_sync
        , 'synced_at': a.o.synced_at
        , 'source': {
            'platform': 'shopify'
          , 'record': a.o.product
          }
        , 'media': _.map(a.o.product.images, function(i){
            return {
              'remote_url': i.src
            };
          })
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
                , 'record': v
                }
              , 'last_sync': a.o.last_sync
              , 'synced_at': a.o.synced_at
              , 'options': opts
              , 'price': Belt.cast(v.price, 'number')
              , 'list_price': Belt.cast(v.price, 'number')
              , 'available_quantity': v.inventory_quantity >= 0 ? v.inventory_quantity : 0
              });

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

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    ], function(err){
      a.cb(err);
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
    , 'shopify_scope': 'read_products,read_orders,write_orders,read_shipping,read_price_rules'
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
        , 'shopify_scope': 'read_products,write_orders'
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
    return S.emit('ready');
  }, 0);

};
