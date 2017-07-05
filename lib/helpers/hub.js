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
    , 'shopify_scope': 'read_products,write_orders'
    , 'redirect_uri': S.settings.host + '/hub/shopify/authorize/redirect.json'
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
