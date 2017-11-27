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
  , CRUD = require('./helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
;

module.exports = function(S){
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  S['GetSessionCart'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //session
      'request': {
        'ip': 'missing'
      }
    });

    Async.waterfall([
      function(cb){
        if (!Belt.get(a.o, 'session.cart._id')) return cb();

        S.model.findOne({
          '_id': a.o.session.cart._id
        }, Belt.cs(cb, gb, 'doc', 1));
      }
    , function(cb){
        if (gb.doc){
          gb.doc.ip_addresses.addToSet(a.o.request.ip);

          return cb();
        }

        S.model.create({
          'ip_addresses': [
            a.o.request.ip
          ]
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Cart not found'));

        cb();
      }
    ], function(err){
      if (err) S.instance.ErrorNotification(err, 'GetSessionCart', {
        '_id': Belt.get(a.o, 'session.cart._id')
      });

      return a.cb(err, gb.doc);
    });
  };

  S['AddPromoCode'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //cart
      //request
      //code
    });

    Async.waterfall([
      function(cb){
        if (!a.o.code || !a.o.code.replace) return cb(new Error('Promo code is missing'));

        self.instance.db.model('promo_code').findOne({
          'code': a.o.code.toLowerCase().replace(/\W/g, '')
        }, Belt.cs(cb, gb, 'code', 1));
      }
    , function(cb){
        if (!gb.code) return cb(new Error('Promo code is invalid'));

        a.o.cart.line_items.push({
          'label': gb.code.get('code') + ' - ' + gb.code.get('label')
        , 'details': {
            'promo_code': gb.code.get('code')
          }
        });

        self.instance.helpers.order_rules.ProcessCartRules({
          'cart': a.o.cart
        }, function(err, doc){
          gb['doc'] = doc;
          cb(err);
        });
      }
    ], function(err){
      if (err) S.instance.ErrorNotification(err, 'AddPromoCode', {
        '_id': Belt.get(gb, 'doc._id')
      , 'session_id': Belt.get(a.o, 'request.session.cart._id')
      , 'code': a.o.code
      });

      a.cb(err, gb.doc);
    });
  };

  /**
   * @api {post} /cart/session/product/create.json Add Product to Session's Cart
   * @apiName CreateCartSessionProduct
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */
    S.instance.express.post('/' + S.name + '/session/product/create.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          var prods = _.filter(gb.doc.toSanitizedObject().products || [], function(p){
            return p.product.toString() !== a.o.data.product || !Belt.equal(p.options, a.o.data.options);
          });

          prods.push({
            'product': a.o.data.product
          , 'options': a.o.data.options
          , 'quantity': a.o.data.quantity
          , 'referring_list': Belt.get(a.o, 'session.referring_list')
          , 'referring_media': Belt.get(a.o, 'session.referring_media')
          });

          gb.doc.set({
            'products': prods
          });

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          req.session['cart'] = gb.doc.toSanitizedObject();
          cb();
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateCartSessionProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'session_id': Belt.get(a.o, 'session.cart._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /cart/session/read.json Read Session Cart
   * @apiName ReadCartSession
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */
    S.instance.express.all('/' + S.name + '/session/read.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      /*, function(cb){
          gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
        }*/
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'ReadCartSession', {
          '_id': Belt.get(gb, 'doc._id')
        , 'session_id': Belt.get(a.o, 'session.cart._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/admin/' + S.name + '/:_id/read.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('Cart not found'));

          gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      /*, function(cb){
          gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
        }*/
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'AdminReadCart', {
          '_id': Belt.get(gb, 'doc._id')
        , 'session_id': Belt.get(a.o, 'session.cart._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {put} /cart/session/update.json Update Session Cart
   * @apiName UpdateSessionCart
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */
    S.instance.express.all('/' + S.name + '/session/update.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('cart not found'));

          gb.doc.set(_.omit(a.o.data, [
            '_id'
          ]));

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      /*, function(cb){
          gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
        }*/
      ], function(err){
        if (err){
          S.instance.ErrorNotification(err, 'UpdateSessionCart', {
            '_id': Belt.get(gb, 'doc._id')
          , 'session_id': Belt.get(a.o, 'session.cart._id')
          , 'data': a.o.data
          });

          if (gb.doc) return Async.waterfall([
            function(cb){
              gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
            }
          , function(cb){
              gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
            }
          , function(cb){
              S.instance.helpers.order_rules.ProcessCartRules({
                'cart': gb.doc
              }, Belt.cs(cb, gb, 'doc', 1, 0));
            }
          ], function(err2){
            return res.status(200).json({
              'error': Belt.get(err, 'message')
            , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
            });
          });
        }

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {delete} /cart/session/product/:product/delete.json Delete Product from Session Cart
   * @apiName DeleteCartSessionProduct
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */
    S.instance.express.all('/' + S.name + '/session/product/:product/delete.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.products.pull(req.params.product);

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'DeleteCartSessionProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'session_id': Belt.get(a.o, 'session.cart._id')
        , 'data': a.o.data
        });

        //return res.redirect('/bag');

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {post} /cart/session/product/:product/quantity/:quantity/update.json Update Product Quantity from Session Cart
   * @apiName UpdateCartSessionProductQuantity
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */
    S.instance.express.all('/' + S.name + '/session/product/:product/quantity/:quantity/update.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb['qty'] = Belt.cast(req.params.quantity, 'number');
          gb['product'] = _.find(gb.doc.products || [], function(p){
            return p._id.toString() === req.params.product;
          });

          if (!gb.product) return cb(new Error('Product is not in bag'));

          gb['old_quantity'] = gb.product.quantity;

          if (!gb.qty) return cb();

          return S.instance.db.model('product').getStock({
            'product': gb.product.product
          , 'available_quantity': gb.qty
          , 'options': gb.product.options || {}
          }, Belt.cs(cb, gb, 'stock', 1));
        }
      , function(cb){
          if (gb.qty && !gb.stock) return cb(new Error('That product is not currently available in the quantity requested'));

          if (!gb.qty){
            gb.doc.products.pull(req.params.product);
          } else {
            gb.product.set({
              'quantity': gb.qty
            });
          }

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'UpdateCartSessionProductQuantity', {
          '_id': Belt.get(gb, 'doc._id')
        , 'session_id': Belt.get(a.o, 'session.cart._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': {
            'cart': Belt.get(gb, 'doc.toSanitizedObject()')
          , 'old_quantity': gb.old_quantity
          }
        });
      });
    });

  /**
   * @api {put} /cart/session/promo_code/:code/create.json Add Promo Code to Session Cart
   * @apiName PromoCodeCreateSessionCart
   * @apiGroup Cart
   * @apiPermission admin, current user
   *
   */
    S.instance.express.all('/' + S.name + '/session/promo_code/:code/create.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.GetSessionCart(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('cart not found'));

          S.AddPromoCode({
            'code': req.params.code
          , 'cart': gb.doc
          , 'request': req
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.doc
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      /*, function(cb){
          gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
        }*/
      ], function(err){
        if (err){
          S.instance.ErrorNotification(err, 'CreateCartSessionPromoCode', {
            '_id': Belt.get(gb, 'doc._id')
          , 'session_id': Belt.get(a.o, 'session.cart._id')
          , 'data': a.o.data
          });

          if (gb.doc) return Async.waterfall([
            function(cb){
              gb.doc.populateProducts(Belt.cs(cb, gb, 'doc', 1, 0));
            }
          , function(cb){
              gb.doc.getStocks(Belt.cs(cb, gb, 'doc', 1, 0));
            }
          , function(cb){
              S.instance.helpers.order_rules.ProcessCartRules({
                'cart': gb.doc
              }, Belt.cs(cb, gb, 'doc', 1, 0));
            }
          ], function(err2){
            return res.status(200).json({
              'error': Belt.get(err, 'message')
            , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
            });
          });
        }

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /admin/cart/list.json List Carts
   * @apiName ListCart
   * @apiGroup Cart
   * @apiPermission admin
   *
   */
    S.instance.express.all('/admin/' + S.name + '/list.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'request': req
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
        if (err) S.instance.ErrorNotification(err, 'ListCart', {
          'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'docs.[].toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /admin/cart/count.json Count Order
   * @apiName CountCart
   * @apiGroup Cart
   * @apiPermission admin, public
   *
   */
    S.instance.express.all('/admin/' + S.name + '/count.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'request': req
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
        if (err) S.instance.ErrorNotification(err, 'CountCart', {
          'count': gb.count
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'count')
        });
      });
    });


  /**
   * @api {delete} /admin/cart/:_id/delete.json Delete Cart
   * @apiName DeleteCart
   * @apiGroup Cart
   * @apiPermission admin
   *
   */
    S.instance.express.all('/admin/' + S.name + '/:_id/delete.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             , 'request': req
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
        if (err) S.instance.ErrorNotification(err, 'DeleteCart', {
          '_id': Belt.get(gb, 'doc._id')
        , 'cart_id': Belt.get(a.o, 'request.session.cart._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
