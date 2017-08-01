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
;

module.exports = function(S){

////////////////////////////////////////////////////////////////////////////////
//// METHODS
////////////////////////////////////////////////////////////////////////////////

  S['ListProducts'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'skip': 0
    , 'limit': 50
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
    , 'limit': 50
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
    delete req.session.cart;

    res.redirect('/');
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
        gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb['order'] = req.session.order;

        Belt.delete(req, 'session.cart');
        Belt.delete(req, 'session.order');

        cb();
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'order_confirmation', {
        'doc': gb.doc
      , 'order_number': gb.order
      , 'title': 'Order Confirmed | WANDERSET'
      , 'js_files': [

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
        gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'checkout', {
        'doc': Belt.get(gb.doc, 'toSanitizedObject()')
      , 'title': 'Checkout | WANDERSET'
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
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'bag', {
        'doc': gb.doc
      , 'title': 'Shopping Bag | WANDERSET'
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

        gb.doc = gb.doc.toSanitizedObject();

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

        gb.doc = gb.doc.toSanitizedObject();

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
      , 'js_files': [
          '/public/js/views/set.js'
        ]
      }));
    });
  });

  S.instance.express.all('/media/:_id', function(req, res, next){
    if (req.params._id.match(/\.json$/)) return next();

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

        var lab = Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'outfit', {
        'doc': gb.doc
      , 'title': gb.title
      }));
    });
  });

  S.instance.express.all('/product/:_id', function(req, res, next){
    if (req.params._id.match(/\.json|\.csv$/)) return next();

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

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product', {
        'doc': gb.doc
      , 'title': gb.title
      , 'js_files': [
          '/public/js/views/product_view.js'
        ]
      }));
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
        , 'media.0': {
            '$exists': true
          }
        , 'vendor': {
            '$exists': true
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
      , 'query': gb.query
      , 'title': 'New Arrivals | WANDERSET'
      , 'page_title': 'New Arrivals'
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
    , 'limit': 50
    , 'skip': 0
    });

    a.o.data.skip = Belt.cast(a.o.data.skip, 'number');
    a.o.data.limit = Belt.cast(a.o.data.limit, 'number');

    Async.waterfall([
      function(cb){
        a.o.data['q'] = {
          'hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
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
      , 'title': 'New Arrivals | WANDERSET'
      , 'page_title': 'New Arrivals'
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
      'limit': 50
    , 'skip': 0
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
        , 'media.0': {
            '$exists': true
          }
        , 'vendor': {
            '$exists': true
          }
        };

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
      , 'title': gb.query.toUpperCase() + ' | WANDERSET'
      , 'page_title': '"' + gb.query.toUpperCase()  + '" Search Results'
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
      'limit': 50
    , 'skip': 0
    });

    a.o.data.skip = Belt.cast(a.o.data.skip, 'number');
    a.o.data.limit = Belt.cast(a.o.data.limit, 'number');

    Async.waterfall([
      function(cb){
        a.o.data['sort'] = a.o.data.sort || '-created_at';
        a.o.data['q'] = {
          'categories': new RegExp(self.instance.escapeRegExp(req.params.category + ' > ' + req.params.subcategory), 'i')
        , 'hide': {
            '$ne': true
          }
        , 'media.0': {
            '$exists': true
          }
        /*, 'vendor': {
            '$exists': true
          }*/
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
      , 'title': (req.params.category + ' > ' + req.params.subcategory).toUpperCase() + ' | WANDERSET'
      , 'page_title': (req.params.category + ' > ' + req.params.subcategory).toUpperCase()
      , 'js_files': [
          '/public/js/views/product_list.js'
        ]
      }));
    });
  });

  S.instance.express.all('/brands', function(req, res){
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

      res.status(200).type('text/html').end(S.instance.renderView(req, 'brands', {
        'navbar': self.navbar
      , 'docs': S.instance.brand_sets
      , 'title': 'WANDERSET'
      , 'js_files': [

        ]
      }));
    });
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
      , 'docs': S.instance.setmember_sets
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

  S.instance.express.all('/', function(req, res){
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

      res.status(200).type('text/html').end(S.instance.renderView(req, 'homepage', {
        'doc': gb.doc
      , 'title': 'WANDERSET'
      }));
    });
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
