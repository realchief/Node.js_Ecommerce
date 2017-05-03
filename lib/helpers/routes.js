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

  S['navbar'] = [
    {
      'title': 'NEW'
    }
  , {
      'title': 'THE SET'
    }
  , {
      'title': 'BRANDS'
    }
  , {
      'title': 'CATEGORIES'
    }
  , {
      'title': 'LIFESTYLE'
    }
  ];

////////////////////////////////////////////////////////////////////////////////
//// METHODS
////////////////////////////////////////////////////////////////////////////////

  S.instance.express.all('/checkout', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'checkout', {

    }));
  });

  S.instance.express.all('/bag', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'bag', {
      'navbar': S.navbar
    }));
  });

  S.instance.express.all('/set', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
      'navbar': S.navbar
    }));
  });

  S.instance.express.all('/outfit', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'outfit', {
      'navbar': S.navbar
    }));
  });

  S.instance.express.all('/product/:_id', function(req, res, next){
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
        S.instance.db.model('product').findOne({
          '_id': req.params._id
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('product not found'));

        gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb['options'] = Belt.get(gb.doc, 'stocks.0.options') || {};
        gb['price'] = Belt.get(gb.doc, 'stocks.0.price') || 0;

        cb();
      }
    ], function(err){
      if (err) return res.status(400).end(err.message);

      res.status(200).type('text/html').end(S.instance.renderView(req, 'product', {
        'navbar': self.navbar
      , 'doc': gb.doc
      , 'options': gb.options
      , 'price': gb.price
      }));
    });
  });

  S.instance.express.all('/', function(req, res){
    return res.redirect('/admin');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
