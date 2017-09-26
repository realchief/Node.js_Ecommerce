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
    });

    Async.waterfall([
      function(cb){
        if (!Belt.get(a.o, 'session.cart._id')) return cb();

        S.model.findOne({
          '_id': a.o.session.cart._id
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (gb.doc) return cb();

        S.model.create({

        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Cart not found'));

        cb();
      }
    ], function(err){
      return a.cb(err, gb.doc);
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
          gb.doc.getShippingGroups(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
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

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': {
            'cart': Belt.get(gb, 'doc.toSanitizedObject()')
          , 'old_quantity': gb.old_quantity
          }
        });
      });
    });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
