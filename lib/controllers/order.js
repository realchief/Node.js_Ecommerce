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

  S['notification_url'] = S.settings.notifications.order;

  /**
   * @api {post} /order/create.json Create Order
   * @apiName CreateOrder
   * @apiGroup Order
   * @apiPermission admin, current user
   *
   */
    S.instance.express.post('/' + S.name + '/create.json', function(req, res){
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
          if (!Belt.get(a.o, 'data.token')) return cb(new Error('Payment method is missing'));

          S.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          if (!Belt.get(gb, 'cart.products.0')) return cb(new Error('Bag is empty'));

          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getShippingGroups(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          S.instance.stripe.customers.create({
            'source': a.o.data.token
          , 'metadata': Belt.objFlatten(_.pick(a.o.data, function(v, k){
              return k.match(/^billing/i);
            }))
          }, Belt.cs(cb, gb, 'customer', 1, 0));
        }
      , function(cb){
          if (!Belt.get(gb, 'customer.id')
            || !Belt.get(gb, 'customer.sources.data.0.id')){
            return cb(new Error('Customer information is invalid'));
          }

          gb['doc'] = S.model({});

          gb.doc.set({
            'buyer': {
              'first_name': Belt.get(a.o, 'data.billing_first_name')
            , 'last_name': Belt.get(a.o, 'data.billing_last_name')
            , 'street': Belt.get(a.o, 'data.billing_address')
            , 'street_b': Belt.get(a.o, 'data.billing_address_2')
            , 'city': Belt.get(a.o, 'data.billing_city')
            , 'region': Belt.get(a.o, 'data.billing_region')
            , 'country': 'US'
            , 'postal_code': Belt.get(a.o, 'data.billing_postal_code')
            , 'phone': Belt.get(a.o, 'data.billing_phone')
            , 'email': Belt.get(a.o, 'data.billing_email')
            , 'subscriber': Belt.get(a.o, 'data.email_subscribe') === 'true' ? true : false
            , 'payment_method': Belt.get(gb, 'customer.sources.data.0.id')
            , 'payment_customer_id': gb.customer.id
            }
          , 'recipient': {
              'first_name': Belt.get(a.o, 'data.shipping_first_name')
            , 'last_name': Belt.get(a.o, 'data.shipping_last_name')
            , 'street': Belt.get(a.o, 'data.shipping_address')
            , 'street_b': Belt.get(a.o, 'data.shipping_address_2')
            , 'city': Belt.get(a.o, 'data.shipping_city')
            , 'region': Belt.get(a.o, 'data.shipping_region')
            , 'country': 'US'
            , 'postal_code': Belt.get(a.o, 'data.shipping_postal_code')
            , 'phone': Belt.get(a.o, 'data.shipping_phone')
            }
          , 'total_paid': 0
          , 'total_refunded': 0
          , 'total_outstanding': 0
          , 'products': []
          , 'shipments': []
          , 'transactions': []
          });

          var ocb = _.once(cb);

          gb['cart_obj'] = gb.cart.toSanitizedObject();

          _.each(gb.cart_obj.products, function(p){
            gb.doc.products.push({
              'product': p.product._id
            , 'stock': p.stock._id
            , 'options': p.options
            , 'unit_price': p.stock.price
            , 'quantity': p.quantity
            , 'price': p.stock.price * p.quantity
            , 'source': {
                'product': _.omit(p.product, [
                  'base_configuration'
                , 'configurations'
                , 'option_configurations'
                ])
              , 'stock': p.stock
              }
            , 'referring_list': p.referring_list
            , 'referring_media': p.referring_media
            });
          });

          gb['total_price'] = 0;
          gb.total_price += gb.cart.get('total_price');
          /*_.each(gb.cart.get('shipping_groups'), function(v, k){
            if (!Belt.get(a.o, 'data.shipping_groups.' + k)){
              return ocb(new Error('Shipping method is missing'));
            }

            var o = _.find(v.shipping_options, function(s){
              return s.option._id.toString() !== v;
            });

            if (!o) return ocb(new Error('Shipping method is invalid'));

            gb.doc.line_items.push({
              'label': 'shipping - ' + o.option.label
            , 'description': o.option.description
            , 'type': 'shipping'
            , 'amount': o.price
            });

            gb.doc.shipments.push({
              'order': k
            , 'shipping_option': o.option._id
            , 'source': {
                'shipping_option': o
              }
            , 'items': o.products || Belt.arrayDefalse(_.map(o.products, function(p){
                return _.find(gb.doc.get('products'), function(p2){
                  return p2.product.toString() === p.toString();
                });
              }))
            });
          });*/

          gb.doc.line_items.push({
            'label': 'shipping - free'
          , 'description': 'free shipping'
          , 'type': 'shipping'
          , 'amount': 0
          });

          if (gb.doc.get('recipient.region') === 'MA' || gb.doc.get('recipient.region') === 'CA'){
            gb.doc.line_items.push({
              'label': 'sales tax - 7%'
            , 'description': '7% sales tax'
            , 'type': 'tax'
            , 'amount': gb.doc.get('total_price') * 0.07
            });
          }

          S.instance.stripe.charges.create({
            'amount': Math.ceil(gb.doc.get('total_price') * 100)
          , 'currency': 'usd'
          , 'source': gb.doc.get('buyer.payment_method')
          , 'description': 'Wanderset Order #' + gb.doc.get('_id').toString()
          , 'customer': gb.doc.get('buyer.payment_customer_id')
          , 'statement_descriptor': ('WANDERSET' + gb.doc.get('_id').toString()).split('').slice(0, 22).join('')
          }, Belt.cs(cb, gb, 'transaction', 1, 0));
        }
      , function(cb){
          if (!Belt.get(gb.transaction, 'id')) return cb(new Error('Unable to process payment'));

          gb.doc.transactions.push({
            'id': gb.transaction.id
          , 'amount': gb.transaction.amount / 100
          , 'created_at': new Date()
          , 'type': 'charge'
          , 'description': 'charged at checkout'
          });

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          req.session['order'] = gb.doc.get('_id').toString();

          //delete req.session.cart;

          Request({
            'url': self.notification_url
          , 'method': 'post'
          , 'json': {
              'order': gb.doc.toShortenedObject()
            , 'transaction': gb.transaction
            }
          }, Belt.cw(cb));
        }
      , function(cb){
          var html = S.instance.renderView(req, 'order_confirmation_email', {
            'doc': Belt.get(gb.doc, 'toSanitizedObject()')
          });

          S.instance.mailer.sendMail({
            'from': S.settings.email.order
          , 'to': gb.doc.get('buyer.email')
          , 'cc': S.settings.email.order
          , 'subject': 'WANDERSET Order ' + gb.doc.get('slug')
          , 'text': html
          , 'html': html
          }, Belt.cw(cb, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        });
      });
    });


  /**
   * @api {get} /order/:_id/read.json Read Order
   * @apiName ReadOrder
   * @apiGroup Order
   * @apiPermission public
   *
   */
    S.instance.express.get('/' + S.name + '/:_id/read.json', function(req, res){
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
          return self.model.findOne({
            'slug': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      , function(cb){
          if (gb.doc) return cb();

          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('order not found'));

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
   * @api {put} /order/:_id/update.json Update Order
   * @apiName UpdateOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/update.json', function(req, res){
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
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('order not found'));

          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          gb.doc.set(_.omit(a.o.data, [
            '_id'
          ]));

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
   * @api {delete} /order/:_id/delete.json Delete Order
   * @apiName DeleteOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.delete('/' + S.name + '/:_id/delete.json', function(req, res){
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
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error(S.name + ' not found'));

          gb.doc.remove(Belt.cw(cb, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /order/list.json List Orders
   * @apiName ListOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/list.json', function(req, res){
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
          self.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'docs.[].toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /order/count.json Count Order
   * @apiName CountOrder
   * @apiGroup Order
   * @apiPermission admin, public
   *
   */
    S.instance.express.all('/' + S.name + '/count.json', function(req, res){
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
          self.count(a.o.data, Belt.cs(cb, gb, 'count', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'count')
        });
      });
    });

  /**
   * @api {get} /order/:_id/confirmation/send.json Send Order Confirmation
   * @apiName SendConfirmationOrder
   * @apiGroup Order
   * @apiPermission public
   *
   */
    S.instance.express.get('/' + S.name + '/:_id/confirmation/send.json', function(req, res){
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
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('order not found'));

          var html = S.instance.renderView(req, 'order_confirmation_email', {
            'doc': Belt.get(gb.doc, 'toSanitizedObject()')
          });

          S.instance.mailer.sendMail({
            'from': S.settings.email.order
          , 'to': req.data().email || gb.doc.get('buyer.email')
          , 'cc': S.settings.email.order
          , 'subject': 'WANDERSET Order ' + gb.doc.get('slug')
          , 'text': html
          , 'html': html
          }, Belt.cs(cb, gb, 'email', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': gb.email
        });
      });
    });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
