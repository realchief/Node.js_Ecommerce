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

    });

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

        S.instance.controllers.product.list({
          'query': gb.query
        , 'limit': a.o.data.limit
        , 'populate': 'stocks'
        , 'sort': a.o.data.sort
        }, Belt.cs(cb, gb, 'docs', 1, '[].toSanitizedObject()', 0));
      }
    ], function(err){
      a.cb(err, gb.docs);
    });
  };

  S['ListMedia'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

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

        S.instance.controllers.media.list({
          'query': gb.query
        , 'limit': a.o.data.limit
        , 'populate': 'products.product'
        , 'sort': a.o.data.sort
        }, Belt.cs(cb, gb, 'docs', 1, '[].toSanitizedObject()', 0));
      }
    ], function(err){
      return a.cb(err, gb.docs);
    });
  };

///////////////////////////////////////////////////////////////////////////////////////////////////
// ROUTES
///////////////////////////////////////////////////////////////////////////////////////////////////

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
        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'checkout', {
        'doc': gb.doc
      , 'title': 'Checkout | WANDERSET'
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
          ]
        , 'hide': {
            '$ne': true
          }
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populate('media', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populateMediaProducts(Belt.cs(cb, gb, 'doc', 1, 0));
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

      res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
        'doc': gb.doc
      , 'title': gb.title
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
          ]
        , 'brand': true
        , 'hide': {
            '$ne': true
          }
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Brand not found'));

        gb.doc.populate('media', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Brand not found'));

        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populateMediaProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

        var lab = Belt.get(gb, 'doc.label.us') || Belt.get(gb, 'doc.name') || 'WANDERSET';
        lab = self.instance.sanitizeLabel(lab);

        gb['title'] = lab;

        cb();
      }
    ], function(err){
      if (err) return res.redirect('/');

      res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
        'doc': gb.doc
      , 'title': gb.title
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

    Async.waterfall([
      function(cb){
        a.o.data['sort'] = 'created_at';

        S.ListMedia(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'docs', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'media_list', {
        'docs': gb.docs || []
      , 'title': 'Lifestyle | WANDERSET'
      , 'js_files': [

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

    Async.waterfall([
      function(cb){
        a.o.data['sort'] = '-created_at';

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'docs', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.docs || []
      , 'title': 'New Arrivals | WANDERSET'
      , 'page_title': 'New Arrivals'
      , 'js_files': [

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

    Async.waterfall([
      function(cb){
        if (!a.o.data.q) return cb(new Error('Search query is required'));

        gb['query'] = a.o.data.q;

        a.o.data['q'] = {
          '$text': {
            '$search': gb.query
          }
        };

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'docs', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.docs || []
      , 'title': gb.query.toUpperCase() + ' | WANDERSET'
      , 'page_title': '"' + gb.query.toUpperCase()  + '" Search Results'
      , 'js_files': [

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

    Async.waterfall([
      function(cb){
        a.o.data['sort'] = '-created_at';
        a.o.data['q'] = {
          'categories': new RegExp(self.instance.escapeRegExp(req.params.category + ' > ' + req.params.subcategory), 'i')
        };

        S.ListProducts(_.extend({}, a.o, {

        }), Belt.cs(cb, gb, 'docs', 1, 0));
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product_list', {
        'docs': gb.docs || []
      , 'title': (req.params.category + ' > ' + req.params.subcategory).toUpperCase() + ' | WANDERSET'
      , 'page_title': (req.params.category + ' > ' + req.params.subcategory).toUpperCase()
      , 'js_files': [

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
        S.instance.db.model('set').findOne({
          'homepage': true
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populate('media', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.populateMediaProducts(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc.toSanitizedObject();

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
