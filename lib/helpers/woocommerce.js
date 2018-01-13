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
  , Woocommerce = require('woocommerce')
  , Natural = require('natural')
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

    var woocommerce = new Woocommerce({
      'url': a.o.vendor.woocommerce.url
    , 'consumerKey': a.o.vendor.woocommerce.consumer_key
    , 'secret': a.o.vendor.woocommerce.secret
    });

    woocommerce.post('/orders', {
      'order': a.o.order
    }, function(err, data){
      a.cb(err, data);
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

    var woocommerce = new Woocommerce({
      'url': a.o.vendor.woocommerce.url
    , 'consumerKey': a.o.vendor.woocommerce.consumer_key
    , 'secret': a.o.vendor.woocommerce.secret
    });

    woocommerce.get('/orders/' + a.o.order, function(err, data){
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

        gb['sku'] = Belt.cast(a.o.product.id, 'string');

        S.instance.log.warn('Syncing "' + gb.sku + '"');

        self.instance.db.model('product').findOne({
          'sku': gb.sku
        , 'vendor': a.o.vendor.get('_id')
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc || S.instance.db.model('product')({});

        _.each(a.o.product.attributes, function(o){
          if (!o.name) return;
          o.name = o.name.replace(/\./g, '');
        });

        gb.doc.set({
          'sku': gb.sku
        , 'name': gb.doc.get('name') || a.o.product.title
        , 'label': {
            'us': gb.doc.get('label.us') || Str.stripTags(a.o.product.title)
          }
        , 'description': {
            'us': SanitizeHTML(gb.doc.get('description.us')) || gb.doc.get('description.us') || SanitizeHTML(a.o.product.short_description) || SanitizeHTML(a.o.product.description) || a.o.product.short_description || a.o.product.description
          }
        , 'vendor': a.o.vendor.get('_id')
        , 'brands': false && Belt.get(gb.doc, 'brands.0') ? gb.doc.brands : [
            a.o.vendor.get('name')
          ]
        , 'last_sync': a.o.last_sync
        , 'synced_at': a.o.synced_at
        , 'source': {
            'platform': 'woocommerce'
          , 'record': Belt.parse(SanitizeHTML(Belt.stringify(a.o.product)))
          }
        , 'options': _.object(
            _.pluck(a.o.product.attributes, 'name')
          , _.map(a.o.product.attributes, function(o){
              return {
                'name': o.name
              , 'label': {
                  'us': o.name
                }
              , 'values': {
                  'us': o.options
                }
              }
            })
          )
        });

        if (a.o.product.status !== 'publish'){
          gb.doc.set({
            'sync_hide': true
          , 'hide_note': 'sync - status not set to publish'
          });
        } else {
          gb.doc.set({
            'sync_hide': false
          });
        }

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

        if (!_.any(a.o.product.variations)){
          a.o.product.variations = [
            Belt.copy(a.o.product)
          ];
        }

        Async.eachSeries(a.o.product.variations || [], function(v, cb2){
          var gb2 = {};

          Async.waterfall([
            function(cb3){
              self.instance.db.model('stock').findOne({
                'sku': Belt.cast(v.id, 'string')
              , 'product': gb.doc.get('_id')
              }, Belt.cs(cb3, gb2, 'stock', 1, 0));
            }
          , function(cb3){
              gb2.stock = gb2.stock || S.instance.db.model('stock')({});

              var opts = {};
              _.each(v.attributes, function(o, k){
                var attr = _.min(a.o.product.attributes, function(a){
                  return Natural.LevenshteinDistance(
                    a.name.toLowerCase().replace(/\W/g, '')
                  , o.name.toLowerCase().replace(/\W/g, '')
                  );
                });

                if (!attr || !o.option) return;

                opts[attr.name] = {
                  'alias': attr.name
                , 'value': _.min(attr.options, function(o2){
                    return Natural.LevenshteinDistance(
                      o.option.toLowerCase().replace(/\W/g, '')
                    , o2.toLowerCase().replace(/\W/g, '')
                    );
                  })
                , 'alias_value': o.option
                };
              });

              if (v.in_stock && !v.managing_stock){
                v.stock_quantity =  v.stock_quantity > 0 ? v.stock_quantity : 5;
              }

              gb2.stock.set({
                'product': gb.doc.get('_id')
              , 'vendor': a.o.vendor.get('_id')
              , 'sku': Belt.cast(v.id, 'string')
              , 'source': {
                  'platform': 'woocommerce'
                , 'record': Belt.parse(SanitizeHTML(Belt.stringify(v)))
                }
              , 'last_sync': a.o.last_sync
              , 'synced_at': a.o.synced_at
              , 'options': opts
              , 'price': Math.ceil(Belt.cast(v.regular_price || v.sale_price || v.price, 'number'))
              , 'list_price': Math.ceil(Belt.cast(v.regular_price || v.sale_price || v.price, 'number'))
              , 'compare_at_price': Math.ceil(Belt.cast(v.regular_price || v.price, 'number'))
              , 'available_quantity': v.in_stock && v.stock_quantity > 0 ? v.stock_quantity : 0
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

        gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getConfigurations();

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
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
      //url
      //consumer_key
      //secret
      'progress_cb': Belt.np
    });

    Async.waterfall([
      function(cb){
        gb['api'] = new Woocommerce({
          'url': a.o.url
        , 'consumerKey': a.o.consumer_key
        , 'secret': a.o.secret
        });

        gb['page'] = 1;

        Async.doWhilst(function(next){
          gb.api.get('/products', {
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

  S.instance.express.all('/woocommerce/authorize.json', function(req, res){
    var gb = {
      'data': req.data()
    };

    Async.waterfall([
      function(cb){
        var missing = _.find([
          'name'
        , 'url'
        , 'key'
        , 'secret'
        ], function(v){
          return !gb.data[v];
        });

        if (missing) return cb(new Error(missing + ' is required'));

        gb.doc = S.instance.db.model('vendor')({});

        gb.doc.set({
          'name': gb.data.name
        , 'woocommerce.url': gb.data.url
        , 'woocommerce.consumer_key': gb.data.key
        , 'woocommerce.secret': gb.data.secret
        });

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    ], function(err){
      if (err){
        console.log(err);
        S.emit('error', err);
      }

      res.status(200).json({
        'error': Belt.get(err, 'error')
      })
    });
  });

  S.instance.express.all('/woocommerce', function(req, res){
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
        res.status(200).type('text/html').end(S.instance.renderView(req, 'woocommerce', {

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
