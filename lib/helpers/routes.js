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
  , Request = require('request')
  , Auth = require('basic-auth')
;

module.exports = function(S){

  S['view_cache'] = {};

  S.instance.on('ready', function(){
    Async.forever(function(next){
      S.view_cache['homepage'] = S.instance.renderView({
        'session': {}
      , 'data': {}
      }, 'homepage', {
        'doc': {}
      , 'title': 'WANDERSET'
      });

      setTimeout(next, !S.instance.CacheLoaded() ? 1 * 1000 : 10 * 60 * 1000);
    });

    Async.forever(function(next){
      S.view_cache['brands'] = S.instance.renderView({
        'session': {}
      , 'data': {}
      }, 'brands', {
        'navbar': S.navbar
      , 'docs': S.instance.brand_logo_sets
      , 'title': 'WANDERSET'
      });

      setTimeout(next, !S.instance.CacheLoaded() ? 1 * 1000 : 10 * 60 * 1000);
    });
  });

////////////////////////////////////////////////////////////////////////////////
//// METHODS
////////////////////////////////////////////////////////////////////////////////

  S['ListProducts'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'skip': 0
    , 'limit': 24
    });

    if (!Belt.isNull(a.o.skip)) a.o.skip = Belt.cast(a.o.skip, 'number');
    if (!Belt.isNull(a.o.limit)) a.o.limit = Belt.cast(a.o.limit, 'number');

    Async.waterfall([
      function(cb){
        if (_.isString(a.o.data.q)){
          try {
            gb['query'] = Belt.parse(a.o.data.q) || {};
          } catch(e) {
            gb['query'] = {};
          }
        } else {
          gb['query'] = a.o.data.q || {};
        }

        S.instance.controllers.product.count({
          'query': gb.query
        , 'limit': a.o.data.limit
        , 'skip': a.o.data.skip
        }, Belt.cs(cb, gb, 'count', 1, 0));
      }
    , function(cb){
        S.instance.controllers.product.list({
          'query': gb.query
        , 'limit': a.o.data.limit
        , 'populate': 'stocks'
        , 'sort': a.o.data.sort
        , 'skip': a.o.data.skip
        , 'projection': a.o.data.projection
        }, Belt.cs(cb, gb, 'docs', 1, '[].toSanitizedObject()', 0));
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  S['ListMedia'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'skip': 0
    , 'limit': 24
    , 'sort': '-created_at'
    });

    if (!Belt.isNull(a.o.skip)) a.o.skip = Belt.cast(a.o.skip, 'number');
    if (!Belt.isNull(a.o.limit)) a.o.limit = Belt.cast(a.o.limit, 'number');

    Async.waterfall([
      function(cb){
        if (_.isString(a.o.data.q)){
          try {
            gb['query'] = Belt.parse(a.o.data.q) || {};
          } catch(e) {
            gb['query'] = {};
          }
        } else {
          gb['query'] = a.o.data.q || {};
        }

/*        _.extend(gb.query, {
          'products.0': {
            '$exists': true
          }
        });*/

        S.instance.controllers.media.count({
          'query': gb.query
        , 'limit': a.o.data.limit
        , 'skip': a.o.data.skip
        }, Belt.cs(cb, gb, 'count', 1, 0));
      }
    , function(cb){
        S.instance.controllers.media.list({
          'query': gb.query
        , 'limit': a.o.data.limit
        , 'populate': 'products.product'
        , 'sort': a.o.data.sort
        , 'skip': a.o.data.skip
        }, Belt.cs(cb, gb, 'docs', 1, '[].toSanitizedObject()', 0));
      }
    ], function(err){
      return a.cb(err, gb);
    });
  };

  if (S.settings.environment !== 'production'){
    S.instance.express.all('*', function(req, res, next){
      S.instance.AdminLogin(req, res, next);
    });
  }

  S.instance.express.all('/googlecc178aee8a56a8a5.html', function(req, res){
    res.status(200).type('html').send('google-site-verification: googlecc178aee8a56a8a5.html');
  });

  S.instance.express.all(/\/products\/|\/set\/|\/brand\/|\/lifestyle/, function(req, res, next){
    if (req.originalUrl.match(/\.json/i)) return next();

    req.session['referring_list'] = req.originalUrl;

    next();
  });

  S.instance.express.all(/\/media/, function(req, res, next){
    if (req.originalUrl.match(/\.json/i)) return next();

    req.session['referring_media'] = req.originalUrl;

    next();
  });

  S.instance.express.all('/list/products.json', function(req, res){
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
        self.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    ], function(err){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': gb.data
      });
    });
  });

  S.instance.express.all('/list/media.json', function(req, res){
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
        self.ListMedia(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    , function(cb){
        _.each(gb.data.docs, function(d){
          d.products = _.filter(d.products, function(p){
            return !Belt.get(p, 'hide') && !Belt.get(p, 'sync_hide') && Belt.get(p, 'product.low_price') > 0;
          });
        });

        gb.data.docs = _.filter(gb.data.docs, function(d){
          return _.any(d.products);
        });

        cb();
      }
    ], function(err){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': gb.data
      });
    });
  });

///////////////////////////////////////////////////////////////////////////////////////////////////
// ROUTES
///////////////////////////////////////////////////////////////////////////////////////////////////

  S.instance.express.all('/logout', function(req, res){
    req.session.regenerate(function(){;
      res.redirect('/');
    });
  });

  S.instance.express.all('/checkout/complete', function(req, res){
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
        if (!req.session.order) return cb(new Error('Order not found'));

        self.instance.db.model('order').findOne({
          '_id': req.session.order
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!Belt.get(gb, 'doc')) return cb(new Error('Order not found'));

        Belt.delete(req, 'session.order');

        gb.doc = gb.doc.toSanitizedObject();

        cb();
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'order_confirmation', {
        'doc': gb.doc
      , 'title': 'Order Confirmed | WANDERSET'
      , 'prod_id': _.pluck(gb.doc.products, 'sku')
      , 'page_type': 'purchase'
      , 'total_value': gb.doc.total_price
      , 'js_files': [
          '/public/js/views/order_confirmation.js'
        ]
      }));
    });
  });

  S.instance.express.all('/checkout', function(req, res){
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
        self.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!Belt.get(gb, 'doc.products.0')) return cb(new Error('Bag is empty'));

        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        self.instance.helpers.order_rules.ProcessCartRules({
          'cart': gb.doc
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    /*, function(cb){
        gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
      }*/
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'checkout', {
        'doc': Belt.get(gb.doc, 'toSanitizedObject()')
      , 'title': 'Checkout | WANDERSET'
      , 'prod_id': _.pluck(gb.doc.products, 'sku')
      , 'page_type': 'cart'
      , 'total_value': gb.doc.total_price
      , 'js_files': [
          '/public/js/views/checkout.js'
        ]
      }));
    });
  });

  S.instance.express.all('/bag', function(req, res){
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
        self.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!Belt.get(gb, 'doc.products.0')) return cb(new Error('Bag is empty'));

        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        self.instance.helpers.order_rules.ProcessCartRules({
          'cart': gb.doc
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'bag', {
        'doc': gb.doc
      , 'title': 'Shopping Bag | WANDERSET'
      , 'prod_id': _.pluck(gb.doc.products, 'sku')
      , 'page_type': 'cart'
      , 'total_value': gb.doc.total_price
      , 'js_files': [
          '/public/js/views/bag.js'
        ]
      }));
    });
  });

  S.instance.express.all('/set/:set', function(req, res, next){
    if (req.params.set.match(/\.json$/)) return next();

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
        S.instance.db.model('set').findOne({
          '$or': [
            {
              'name': req.params.set
            }
          , {
              'label.us': req.params.set
            }
          , {
              'slug': req.params.set
            }
          ]
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (gb.doc) return cb()

        S.instance.db.model('set').findOne({
          '_id': req.params.set
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.filterProducts(Belt.cw(cb));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.filterMedia(Belt.cw(cb));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

        gb.doc.products = gb.doc.filtered_products || gb.doc.products;
        gb.doc.media = gb.doc.filtered_media || gb.doc.media;

        var lab = Belt.get(gb, 'doc.listing_label.us') || Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
        'doc': gb.doc
      , 'title': gb.title
      , 'prod_id': Belt.get(gb.doc.products.slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/set.js'
        ]
      }));
    });
  });

  S.instance.express.all('/brand/:brand/:category/:subcategory', function(req, res, next){
    if (req.params.brand.match(/\.json$/)) return next();

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
        S.instance.db.model('set').findOne({
          '$or': [
            {
              'name': req.params.brand
            }
          , {
              'label.us': req.params.brand
            }
          , {
              'slug': req.params.brand
            }
          ]
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (gb.doc) return cb()

        S.instance.db.model('set').findOne({
          '_id': req.params.brand
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Brand not found'));

        gb.doc.filterProducts(Belt.cw(cb));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.filterMedia(Belt.cw(cb));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

        gb.doc.products = gb.doc.filtered_products || gb.doc.products;
        gb.doc.media = gb.doc.filtered_media || gb.doc.media;

        var lab = Belt.get(gb, 'doc.listing_label.us') || Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
        'doc': gb.doc
      , 'title': gb.title
      , 'sort': req.data().sort //|| '-created_at'
      , 'category': req.params.category + ' > ' + req.params.subcategory
      , 'prod_id': Belt.get(gb.doc.products.slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/set.js'
        ]
      }));
    });
  });

  S.instance.express.all('/brand/:brand/:category', function(req, res, next){
    if (req.params.brand.match(/\.json$/)) return next();

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
        S.instance.db.model('set').findOne({
          '$or': [
            {
              'name': req.params.brand
            }
          , {
              'label.us': req.params.brand
            }
          , {
              'slug': req.params.brand
            }
          ]
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (gb.doc) return cb()

        S.instance.db.model('set').findOne({
          '_id': req.params.brand
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Brand not found'));

        gb.doc.filterProducts(Belt.cw(cb));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.filterMedia(Belt.cw(cb));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

        gb.doc.products = gb.doc.filtered_products || gb.doc.products;
        gb.doc.media = gb.doc.filtered_media || gb.doc.media;

        var lab = Belt.get(gb, 'doc.listing_label.us') || Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
        'doc': gb.doc
      , 'title': gb.title
      , 'sort': req.data().sort //|| '-created_at'
      , 'category': req.params.category
      , 'prod_id': Belt.get(gb.doc.products.slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/set.js'
        ]
      }));
    });
  });

  S.instance.express.all('/brand/:brand', function(req, res, next){
    if (req.params.brand.match(/\.json$/)) return next();

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
        S.instance.db.model('set').findOne({
          '$or': [
            {
              'name': req.params.brand
            }
          , {
              'label.us': req.params.brand
            }
          , {
              'slug': req.params.brand
            }
          ]
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (gb.doc) return cb()

        S.instance.db.model('set').findOne({
          '_id': req.params.brand
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Brand not found'));

        gb.doc.filterProducts(Belt.cw(cb));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.filterMedia(Belt.cw(cb));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

        gb.doc.products = gb.doc.filtered_products || gb.doc.products;
        gb.doc.media = gb.doc.filtered_media || gb.doc.media;

        var lab = Belt.get(gb, 'doc.listing_label.us') || Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
        'doc': gb.doc
      , 'title': gb.title
      , 'sort': req.data().sort //|| '-created_at'
      , 'prod_id': Belt.get(gb.doc.products.slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/set.js'
        ]
      }));
    });
  });

  S.instance.express.all('/media/:_id', function(req, res, next){
    if (req.params._id.match(/\.(csv|json)$/)) return next();

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
        S.instance.db.model('media').findOne({
          'slug': req.params._id
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (gb.doc) return cb();

        S.instance.db.model('media').findOne({
          '_id': req.params._id
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('media not found'));

        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (Belt.get(gb.doc, 'metadata.width')) return cb();

        gb.doc.getMetadata(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

        gb.doc.products = _.filter(gb.doc.products, function(p){
          return Belt.get(p, 'product.low_price');
        });

        var lab = Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        if (Belt.get(gb, 'doc.products.length') === 1) gb['configuration'] = _.find(gb.doc.configurations, function(c){
          return c.available_quantity > 0;
        });

        cb();
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'outfit', _.extend({
        'doc': gb.doc
      , 'configuration': gb.configuration || {}
      , 'configuration_options': gb.configuration_options || {}
      , 'title': gb.title
      }, gb.configuration ? {
        'prod_id': gb.configuration.sku
      , 'page_type': 'product'
      , 'total_value': gb.configuration.sku
      } : {}, Belt.get(gb, 'doc.products.length') > 1 ? {
        'prod_id': Belt.get(gb.doc.products.slice(0, 3), '[].product._id.toString()')
      , 'page_type': 'searchresults'
      } : {})));
    });
  });

  _.times(6, function(i){
    var rte = '/product/:_id' + _.times(i, function(i2){
      return '/:key_' + i2 + '/:value_' + i2;
    }).join('');

    S.instance.express.all(rte, function(req, res, next){
      if (req.originalUrl.match(/\.json|\.csv/i)) return next();

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
          S.instance.db.model('product').findOne({
            'slug': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (gb.doc) return cb();

          S.instance.db.model('product').findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc = gb.doc.toSanitizedObject();

          var lab = Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
          lab = self.instance.sanitizeLabel(lab);

          gb['options'] = {};
          _.times(6, function(i){
            if (req.params['key_' + i]) gb.options[req.params['key_' + i]] = req.params['value_' + i];
          });
          _.extend(gb.options, req.query || {});

          gb['configuration'] =_.find(gb.doc.configurations, function(v, k){
            return v.available_quantity > 0
                && (!_.size(gb.options) || _.every(gb.options, function(v2, k2){
                     return v2 === Belt.get(v.options[k2], 'value');
                   }));
          }) || {};

          gb['configuration_options'] = Belt.get(gb, 'options') || {};

          gb['title'] = lab + (_.size(gb.configuration_options) ? ' | ' + _.map(gb.configuration_options, function(v, k){
            return k + ': ' + v;
          }).join(' | ') : '')

          cb();
        }
      ], function(err){
        if (err){
          return res.status(400).end(err.message);
        }

        if (gb.doc.hide || gb.doc.sync_hide){
          if (!S.instance.AdminLogin(req, res)) return;
        }

        res.status(200).type('text/html').end(S.instance.renderView(req, 'product', {
          'doc': gb.doc
        , 'title': gb.title
        , 'configuration_options': gb.configuration_options
        , 'configuration': gb.configuration
        , 'prod_id': Belt.get(gb.configuration, 'sku')
        , 'page_type': 'product'
        , 'total_value': Belt.get(gb.configuration, 'price')
        , 'js_files': [
            '/public/js/views/product_view.js'
          ]
        }));
      });
    });
  });

  S.instance.express.all('/lifestyle', function(req, res, next){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data = _.defaults(a.o.data, {
      'sort': '-created_at'
    , 'limit': 15
    , 'skip': 0
    });

    a.o.data['q'] = _.extend({}, {
      'products.0': {
        '$exists': true
      }
    , 'hide': {
        '$ne': true
      }
    , 'sync_hide': {
        '$ne': true
      }
    });

    Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'media_list', {
        'skip': Belt.get(a.o, 'data.skip')
      , 'limit': Belt.get(a.o, 'data.limit')
      , 'sort': Belt.get(a.o, 'data.sort')
      , 'query': a.o.data.q
      , 'title': 'Lifestyle | WANDERSET'
      , 'js_files': [
          '/public/js/views/media_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/products', function(req, res, next){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data = _.defaults(a.o.data, {
      'sort': '-created_at'
    , 'limit': 15
    });

    Async.waterfall([
      function(cb){
        gb['query'] = a.o.data.q;

        a.o.data.q = _.extend(a.o.data.q || {}, {
          'hide': {
            '$ne': true
          }
        , 'sync_hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
          }
        , 'vendor': {
            '$exists': true
          }
        , 'low_price': {
            '$gt': 0
          }
        });

        if (Belt.call(a.o.data, 'sort.match', /low_price/)){
          _.extend(a.o.data.q || {}, {
            'low_price': {
              '$exists': true
            }
          });
        }

        if (Belt.call(a.o.data, 'sort.match', /high_price/)){
          _.extend(a.o.data.q || {}, {
            'high_price': {
              '$exists': true
            }
          });
        }

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.data.docs || []
      , 'count': gb.data.count
      , 'skip': Belt.get(a.o, 'data.skip')
      , 'limit': Belt.get(a.o, 'data.limit')
      , 'sort': Belt.get(a.o, 'data.sort')
      , 'query': Belt.get(gb, 'data.query')
      , 'title': 'New Arrivals | WANDERSET'
      , 'page_title': 'New Arrivals'
      , 'prod_id': Belt.get((gb.data.docs || []).slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/product_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/products/new', function(req, res, next){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data = _.defaults(a.o.data, {
      'sort': '-created_at'
    , 'skip': 0
    , 'limit': 48
    });

    a.o.data.skip = Belt.cast(a.o.data.skip, 'number');
    a.o.data.limit = Belt.cast(a.o.data.limit, 'number');

    Async.waterfall([
      function(cb){
        a.o.data['q'] = {
          'hide': {
            '$ne': true
          }
        , 'sync_hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
          }
        , 'vendor': {
            '$exists': true
          }
        , 'low_price': {
            '$gt': 0
          }
        };

        if (Belt.call(a.o.data, 'sort.match', /low_price/)){
          _.extend(a.o.data.q || {}, {
            'low_price': {
              '$exists': true
            }
          });
        }

        if (Belt.call(a.o.data, 'sort.match', /high_price/)){
          _.extend(a.o.data.q || {}, {
            'high_price': {
              '$exists': true
            }
          });
        }

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.data.docs || []
      , 'count': gb.data.count
      , 'skip': Belt.get(a.o, 'data.skip')
      , 'limit': Belt.get(a.o, 'data.limit')
      , 'sort': Belt.get(a.o, 'data.sort')
      , 'query': Belt.get(gb, 'data.query')
      , 'title': 'New Arrivals | WANDERSET'
      , 'page_title': 'New Arrivals'
      , 'prod_id': Belt.get((gb.data.docs || []).slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/product_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/products/search', function(req, res, next){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data = _.defaults(a.o.data, {
      'skip': 0
    , 'limit': 48
    , 'sort': {
        'score': {
          '$meta': 'textScore'
        }
      }
    });

    a.o.data.skip = Belt.cast(a.o.data.skip, 'number');
    a.o.data.limit = Belt.cast(a.o.data.limit, 'number');

    Async.waterfall([
      function(cb){
        if (!a.o.data.q) return cb(new Error('Search query is required'));

        gb['query'] = a.o.data.q;

        a.o.data['sort'] = a.o.data.sort

        a.o.data['q'] = {
          '$text': {
            '$search': gb.query
          }
        , 'hide': {
            '$ne': true
          }
        , 'sync_hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
          }
        , 'vendor': {
            '$exists': true
          }
        , 'low_price': {
            '$gt': 0
          }
        };

        if (a.o.data.category) _.extend(a.o.data.q, {
         '$or': [
            {
              'categories': {
                '$regex': self.instance.escapeRegExp(a.o.data.category)
              , '$options': 'i'
              }
            }
          , {
              'auto_category': {
                '$regex': self.instance.escapeRegExp(a.o.data.category)
              , '$options': 'i'
              }
            }
          ]
        });

        a.o.data['projection'] = {
          'score': {
            '$meta': 'textScore'
          }
        };

        if (Belt.call(a.o.data, 'sort.match', /low_price/)){
          _.extend(a.o.data.q || {}, {
            'low_price': {
              '$exists': true
            }
          });
        }

        if (Belt.call(a.o.data, 'sort.match', /high_price/)){
          _.extend(a.o.data.q || {}, {
            'high_price': {
              '$exists': true
            }
          });
        }

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.data.docs || []
      , 'count': gb.data.count
      , 'skip': Belt.get(a.o, 'data.skip')
      , 'limit': Belt.get(a.o, 'data.limit')
      , 'sort': Belt.get(a.o, 'data.sort')
      , 'search_query': gb.query
      , 'query': Belt.get(gb, 'data.query')
      , 'title': gb.query.toUpperCase() + ' | WANDERSET'
      , 'page_title': '"' + gb.query.toUpperCase()  + '" Search Results'
      , 'prod_id': Belt.get((gb.data.docs || []).slice(0, 3), '[]._id.toString()')
      , 'page_type': 'searchresults'
      , 'js_files': [
          '/public/js/views/product_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/products/category/:category', function(req, res, next){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data = _.defaults(a.o.data, {
      'limit': 48
    , 'skip': 0
    });

    a.o.data.skip = Belt.cast(a.o.data.skip, 'number');
    a.o.data.limit = Belt.cast(a.o.data.limit, 'number');

    Async.waterfall([
      function(cb){
        a.o.data['sort'] = a.o.data.sort || '-created_at';
        a.o.data['q'] = {
          '$or': [
            {
              'categories': {
                '$regex': self.instance.escapeRegExp(req.params.category)
              , '$options': 'i'
              }
            }
          , {
              'auto_category': {
                '$regex': self.instance.escapeRegExp(req.params.category)
              , '$options': 'i'
              }
            }
          ]
        , 'hide': {
            '$ne': true
          }
        , 'sync_hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
          }
        , 'low_price': {
            '$gt': 0
          }
        , 'vendor': {
            '$exists': true
          }
        };

        if (Belt.call(a.o.data, 'sort.match', /low_price/)){
          _.extend(a.o.data.q || {}, {
            'low_price': {
              '$exists': true
            }
          });
        }

        if (Belt.call(a.o.data, 'sort.match', /high_price/)){
          _.extend(a.o.data.q || {}, {
            'high_price': {
              '$exists': true
            }
          });
        }

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.data.docs || []
      , 'count': gb.data.count
      , 'skip': Belt.get(a.o, 'data.skip')
      , 'limit': Belt.get(a.o, 'data.limit')
      , 'sort': Belt.get(a.o, 'data.sort')
      , 'query': Belt.get(gb, 'data.query')
      , 'title': (req.params.category).toUpperCase() + ' | WANDERSET'
      , 'page_title': (req.params.category).toUpperCase()
      , 'prod_id': Belt.get((gb.data.docs || []).slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/product_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/products/:category/:subcategory', function(req, res, next){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data = _.defaults(a.o.data, {
      'limit': 48
    , 'skip': 0
    });

    a.o.data.skip = Belt.cast(a.o.data.skip, 'number');
    a.o.data.limit = Belt.cast(a.o.data.limit, 'number');

    req.params.category = req.params.category + ' > ' + req.params.subcategory;

    Async.waterfall([
      function(cb){
        a.o.data['sort'] = a.o.data.sort || '-created_at';
        a.o.data['q'] = {
          '$or': [
            {
              'categories': {
                '$regex': self.instance.escapeRegExp(req.params.category)
              , '$options': 'i'
              }
            }
          , {
              'auto_category': {
                '$regex': self.instance.escapeRegExp(req.params.category)
              , '$options': 'i'
              }
            }
          ]
        , 'hide': {
            '$ne': true
          }
        , 'sync_hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
          }
        , 'low_price': {
            '$gt': 0
          }
        , 'vendor': {
            '$exists': true
          }
        };

        if (Belt.call(a.o.data, 'sort.match', /low_price/)){
          _.extend(a.o.data.q || {}, {
            'low_price': {
              '$exists': true
            }
          });
        }

        if (Belt.call(a.o.data, 'sort.match', /high_price/)){
          _.extend(a.o.data.q || {}, {
            'high_price': {
              '$exists': true
            }
          });
        }

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'data', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.data.docs || []
      , 'count': gb.data.count
      , 'skip': Belt.get(a.o, 'data.skip')
      , 'limit': Belt.get(a.o, 'data.limit')
      , 'sort': Belt.get(a.o, 'data.sort')
      , 'query': Belt.get(gb, 'data.query')
      , 'title': (req.params.category).toUpperCase() + ' | WANDERSET'
      , 'page_title': (req.params.category).toUpperCase()
      , 'prod_id': Belt.get((gb.data.docs || []).slice(0, 3), '[]._id.toString()')
      , 'page_type': 'category'
      , 'js_files': [
          '/public/js/views/product_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/brands', function(req, res){
    var html = S.instance.renderView(req, 'brands', {
      'docs': S.instance.brand_logo_sets
    , 'title': 'WANDERSET'
    });
    res.status(200).type('text/html').end(html);

    //res.status(200).type('text/html').end(S.view_cache.brands);
  });

  S.instance.express.all('/sets', function(req, res){
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
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'sets', {
        'navbar': self.navbar
      , 'docs': S.instance.setmember_logo_sets
      , 'title': 'WANDERSET'
      , 'js_files': [

        ]
      }));
    });
  });

  S.instance.express.all('/page/:view', function(req, res){
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
        res.status(200).type('text/html').end(S.instance.renderView(req, req.params.view, {

        }));
      } catch(e){
        res.redirect('/');
      }
    });
  });

  S.instance.express.all('/robots.txt', function(req, res){
    return res.type('text/plain').end('User-agent: *\nDisallow:');
  });

  S.instance.express.all('/sitemap.xml', function(req, res){
    return res.sendFile(Path.join(S.settings.__dirname, '/tmp/sitemap.xml'));
  });

  S.instance.express.all('/', function(req, res){
    var html = S.instance.renderView(req, 'homepage', {
      'doc': {}
    , 'title': 'WANDERSET'
    });
    res.status(200).type('text/html').end(html);

    //res.status(200).type('text/html').end(S.view_cache.homepage);
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
