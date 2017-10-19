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
  , CSV = require('fast-csv')
  , Request = require('request')
;

module.exports = function(S){
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  S['notification_url'] = S.settings.notifications.order;

  S['sendOrderConfirmation'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //doc
      //request
    });

    if (Belt.get(S.settings, 'notifications.new_order_slack')){
      Request({
        'url': S.settings.notifications.new_order_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': 'New order '
                + a.o.doc.get('slug') + ': '
                + ' $' + S.instance.priceString(a.o.doc.get('total_price')) + ' - '
                + a.o.doc.get('buyer.first_name') + ' ' + a.o.doc.get('buyer.last_name')
                + ' <https://wanderset.com/admin/order/' + a.o.doc.get('_id').toString() + '/read>'
        , 'username': 'ORDER-BOT'
        , 'icon_emoji': ':moneybag:'
        }
      }, Belt.np);
    }

    var html = S.instance.renderView(a.o.request, 'order_confirmation_email', {
      'doc': Belt.get(a.o.doc, 'toSanitizedObject()')
    });

    S.instance.mailer.sendMail({
      'from': S.settings.email.order
    , 'to': S.settings.environment.match(/production/i) ? a.o.doc.get('buyer.email') : S.settings.email.order
    , 'cc': S.settings.email.order
    , 'subject': 'WANDERSET Order ' + a.o.doc.get('slug')
    , 'text': html
    , 'html': html
    }, Belt.cw(a.cb, 0));
  };

  S['sendOrderFailure'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //doc
      //request
      //error
      //cart
    });

    if (Belt.get(S.settings, 'notifications.new_order_slack')){
      Request({
        'url': S.settings.notifications.new_order_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': 'Order failure: '
                + a.o.doc.get('slug') + ': '
                + ' $' + S.instance.priceString(a.o.doc.get('total_price')) + ' - '
                + a.o.doc.get('buyer.first_name') + ' ' + a.o.doc.get('buyer.last_name')
                + ' - ' + a.o.error + ' - ' + S.settings.host + '/admin/cart/' + Belt.get(a.o, 'cart._id.toString()') + '/read.json'
        , 'username': 'ORDER-BOT'
        , 'icon_emoji': ':-1:'
        }
      }, Belt.np);
    }

    var html = S.instance.renderView(a.o.request, 'order_failure_email', {
      'doc': Belt.get(a.o.doc, 'toSanitizedObject()')
    });

    S.instance.mailer.sendMail({
      'from': S.settings.email.order
    , 'to': S.settings.environment.match(/production/i) ? a.o.doc.get('buyer.email') : S.settings.email.order
    , 'cc': S.settings.email.order
    , 'subject': 'Complete Your WANDERSET Order'
    , 'text': html
    , 'html': html
    }, Belt.cw(a.cb, 0));
  };

  S['sendOrderShippingNotification'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //doc
      //request
      //shipment
    });

    if (Belt.get(S.settings, 'notifications.order_shipment_slack')){
      Request({
        'url': S.settings.notifications.order_shipment_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': 'New order shipment for Order #'
                + a.o.doc.get('slug') + ' from ' + Belt.get(S.instance.vendor_ids[Belt.get(a.o, 'shipment.vendor.toString()')], 'name')
                + ' <https://wanderset.com/admin/order/' + a.o.doc.get('_id').toString() + '/read>'
        , 'username': 'ORDER-BOT'
        , 'icon_emoji': ':package:'
        }
      }, Belt.noop);
    }

    var html = S.instance.renderView(a.o.request, 'order_shipping_email', {
      'doc': Belt.get(a.o.doc, 'toSanitizedObject()')
    , 'message': 'Items in your order have shipped' + (a.o.shipment.tracking_url ? ' <a href="' + a.o.shipment.tracking_url + '">Click here to track your shipment</a>' : '')
    , 'status_update': 'Items in your order have shipped'
    , 'tracking_link': a.o.shipment.tracking_url ? '<a style="color:white;text-decoration:none;" href="' + a.o.shipment.tracking_url + '">Track your shipment</a>' : ''
    , 'products': _.map(a.o.shipment.products, function(p){
        return _.find(a.o.doc.get('products'), function(p2){
          return p.toString() === p2._id.toString();
        });
      })
    });

    S.instance.mailer.sendMail({
      'from': S.settings.email.order
    , 'to': S.settings.environment.match(/production/i) ? a.o.doc.get('buyer.email') : S.settings.email.order
    , 'cc': S.settings.email.order
    , 'subject': 'Shipped! WANDERSET Order ' + a.o.doc.get('slug')
    , 'text': html
    , 'html': html
    }, Belt.cw(a.cb, 0));
  };

  S['sendAllShippingNotifications'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //doc
      //request
    });

    Async.eachSeries(a.o.doc.shipments || [], function(s, cb2){
      if (s.sent_shipped_email) return cb2();

      s['sent_shipped_email'] = true;

      self.sendOrderShippingNotification({
        'doc': a.o.doc
      , 'request': a.o.request
      , 'shipment': s
      }, Belt.cw(cb2));
    }, Belt.cw(a.cb));
  };

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
          gb.step = 1;

          if (!Belt.get(a.o, 'data.token')) return cb(new Error('Payment method is missing'));

          S.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 2;

          if (a.o.data.products) gb.cart.set({
            'products': a.o.data.products
          });

          if (a.o.data.line_items) gb.cart.set({
            'line_items': a.o.data.line_items
          });

          if (!Belt.get(gb, 'cart.products.0')) return cb(new Error('Bag is empty'));

          gb.cart.set({
            'buyer': a.o.data.buyer
          , 'recipient': a.o.data.recipient
          });

          gb.cart.save(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 3;

          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 4;

          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 5;

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 6;

          gb.cart.save(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 7;

          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 8;

          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 9;

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 11;

          gb['cart_obj'] = gb.cart.toSanitizedObject();

          gb['doc'] = S.model({});

          gb.doc.set({
            'buyer': _.extend({}, gb.cart_obj.buyer || {}, {
              'country': Belt.get(gb, 'cart_obj.buyer.country') || 'US'
            , 'ip_address': req.ip
            })
          , 'recipient':  _.extend({}, gb.cart_obj.recipient || {}, {
              'country': Belt.get(gb, 'cart_obj.recipient.country') || 'US'
            })
          , 'total_paid': 0
          , 'total_refunded': 0
          , 'total_outstanding': 0
          , 'products': []
          , 'shipments': []
          , 'transactions': []
          , 'line_items': gb.cart_obj.line_items
          });

          var ocb = _.once(cb);

          _.each(gb.cart_obj.products, function(p){
            gb.doc.products.push({
              'product': p.product._id
            , 'stock': p.stock._id
            , 'options': p.options
            , 'sku': p.sku
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

          gb.doc.setSlug();

          gb.doc.set({
            'buyer.email': Belt.get(gb, 'doc.buyer.email.toLowerCase()')
          });

          gb['processing_failure'] = true;

          gb.step = 10;

          S.instance.stripe.customers.create({
            'source': a.o.data.token
          , 'metadata': Belt.objFlatten(gb.cart.buyer)
          }, Belt.cs(cb, gb, 'customer', 1, 0));
        }
      , function(cb){
          if (!Belt.get(gb, 'customer.id')
            || !Belt.get(gb, 'customer.sources.data.0.id')){
            return cb(new Error('Customer information is invalid'));
          }

          gb.doc.set({
            'buyer.payment_method': Belt.get(gb, 'customer.sources.data.0.id')
          , 'buyer.payment_customer_id': gb.customer.id
          });

          S.instance.stripe.charges.create({
            'amount': Math.ceil(gb.doc.get('total_price') * 100)
          , 'currency': 'usd'
          , 'source': gb.doc.get('buyer.payment_method')
          , 'description': 'Wanderset Order #' + gb.doc.get('slug').toString()
          , 'customer': gb.doc.get('buyer.payment_customer_id')
          , 'statement_descriptor': ('WNDRST' + gb.doc.get('slug').toString()).split('').slice(0, 22).join('')
          }, Belt.cs(cb, gb, 'transaction', 1, 0));
        }
      , function(cb){
          gb.step = 12;

          if (!Belt.get(gb.transaction, 'id')){
            return cb(new Error('Unable to process payment'));
          }

          gb.processing_failure = false;

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
          gb.step = 13;

          if (S.settings.environment !== 'production') return cb();

          gb.doc.createVendorOrders(Belt.cw(cb, 0));
        }
      , function(cb){
          gb.step = 14;

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.step = 15;

          req.session['order'] = gb.doc.get('_id').toString();

          S.sendOrderConfirmation({
            'request': req
          , 'doc': gb.doc
          }, Belt.cw(cb));
        }
      , function(cb){
          gb.step = 16;

          S.instance.db.model('user').findOneAndUpdate({
            'email': Belt.get(gb, 'doc.buyer.email')
          }, {
            '$set': {
              'email': Belt.get(gb, 'doc.buyer.email')
            , 'roles.subscriber': Belt.get(gb, 'doc.buyer.subscriber') ? true : false
            , 'roles.customer': true
            }
          , '$addToSet': {
              'ip_addresses': req.ip
            }
          }, {
            'upsert': true
          , 'new': true
          , 'runValidators': true
          }, Belt.cw(cb));
        }
      ], function(err){
        if (err){
          console.log(err);
          console.log(gb.step);

          S.instance.ErrorNotification(err, 'CreateOrder', {
            '_id': Belt.get(gb, 'doc._id')
          , 'cart_id': Belt.get(a.o, 'request.session.cart._id')
          , 'data': a.o.data
          });

          if (gb.processing_failure){
            S.sendOrderFailure({
              'request': req
            , 'doc': gb.doc
            , 'error': err.message
            }, Belt.np);
          }
        } else {
          Belt.delete(req, 'session.cart');
          gb.cart.remove(Belt.np);
        }

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': {
            'total_price': Belt.get(gb.doc, 'total_price')
          }
        });
      });
    });

    S.instance.express.post('/admin/' + S.name + '/manual/create.json', function(req, res){
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
          S.instance.controllers.cart.GetSessionCart(a.o, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          if (a.o.data.products) gb.cart.set({
            'products': a.o.data.products
          });

          if (a.o.data.line_items) gb.cart.set({
            'line_items': a.o.data.line_items
          });

          if (!Belt.get(gb, 'cart.products.0')) return cb(new Error('Bag is empty'));

          gb.cart.set({
            'buyer': a.o.data.buyer
          , 'recipient': a.o.data.recipient
          });

          gb.cart.save(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.save(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){

          gb['cart_obj'] = gb.cart.toSanitizedObject();

          gb['doc'] = S.model({});

          gb.doc.set({
            'buyer': _.extend({}, gb.cart_obj.buyer || {}, {
              'payment_method': Belt.get(gb, 'customer.sources.data.0.id')
            , 'payment_customer_id': gb.customer.id
            , 'country': 'US'
            })
          , 'recipient':  _.extend({}, gb.cart_obj.recipient || {}, {
              'country': 'US'
            })
          , 'total_paid': 0
          , 'total_refunded': 0
          , 'total_outstanding': 0
          , 'products': []
          , 'shipments': []
          , 'transactions': []
          , 'line_items': gb.cart_obj.line_items
          });

          var ocb = _.once(cb);

          _.each(gb.cart_obj.products, function(p){
            gb.doc.products.push({
              'product': p.product._id
            , 'stock': p.stock._id
            , 'options': p.options
            , 'sku': p.sku
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

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (S.settings.environment !== 'production') return cb();

          gb.doc.createVendorOrders(Belt.cw(cb, 0));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          req.session['order'] = gb.doc.get('_id').toString();

          S.sendOrderConfirmation({
            'request': req
          , 'doc': gb.doc
          }, Belt.cw(cb));
        }
      , function(cb){
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
      ], function(err){
        if (err){
          S.instance.ErrorNotification(err, 'AdminCreateManualOrder', {
            '_id': Belt.get(gb, 'doc._id')
          , 'cart_id': Belt.get(a.o, 'request.session.cart._id')
          , 'data': a.o.data
          });
        }

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': {
            'total_price': Belt.get(gb.doc, 'total_price')
          }
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
        if (err) S.instance.ErrorNotification(err, 'ReadOrder', {
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
        if (err) S.instance.ErrorNotification(err, 'UpdateOrder', {
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
        if (err) S.instance.ErrorNotification(err, 'DeleteOrder', {
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
        if (err) S.instance.ErrorNotification(err, 'ListOrder', {
          'data': a.o.data
        });

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
        if (err) S.instance.ErrorNotification(err, 'CountOrder', {
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
   * @api {get} /admin/order/:_id/confirmation/send.json Send Order Confirmation
   * @apiName SendConfirmationOrder
   * @apiGroup Order
   * @apiPermission public
   *
   */
    S.instance.express.get('/admin/' + S.name + '/:_id/confirmation/send.json', function(req, res){
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

          S.sendOrderConfirmation({
            'request': req
          , 'doc': gb.doc
          }, Belt.cw(cb));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'SendOrderConfirmation', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': gb.email
        });
      });
    });


  /**
   * @api {get} /admin/order/:_id/shipping_notification/send.json Send Shipping Notification
   * @apiName ShippingNotificationOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.get('/admin/' + S.name + '/:_id/shipping_notification/send.json', function(req, res){
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

          gb.doc.getShipments();

          S.sendAllShippingNotifications({
            'doc': gb.doc
          , 'request': req
          }, Belt.cw(cb));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'SendOrderShippingNotification', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb.doc, 'toSanitizedObject()')
        });
      });
    });

  /**
   * @api {post} /admin/order/:_id/vendor_orders/create.json Create Vendor Orders
   * @apiName CreateVendorOrders
   * @apiGroup Order
   * @apiPermission public
   *
   */
    S.instance.express.all('/admin/' + S.name + '/:_id/vendor_orders/create.json', function(req, res){
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

          gb.doc.createVendorOrders(Belt.cw(cb, 0));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateVendorOrders', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/admin/' + S.name + '/:_id/vendor/:vendor/order/:order/update.json', function(req, res){
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

          return self.instance.db.model('vendor').findOne({
            '_id': req.params.vendor
          }, Belt.cs(cb, gb, 'vendor', 1, 0));
        }
      , function(cb){
          if (!gb.vendor) return cb(new Error('vendor not found'));

          if (Belt.get(gb, 'vendor.shopify.access_token')){
            self.instance.helpers.shopify.ReadOrder({
              'vendor': gb.vendor
            , 'order': req.params.order
            }, Belt.cs(cb, gb, 'order', 1, 0));

          } else if (Belt.get(gb, 'vendor.woocommerce.secret')){
            self.instance.helpers.woocommerce.ReadOrder({
              'vendor': gb.vendor
            , 'order': req.params.order
            }, Belt.cs(cb, gb, 'order', 1, 0));

          } else {
            return cb(new Error('vendor does not accept API orders'));

          }
        }
      , function(cb){
          if (!gb.order) return cb(new Error('order not found'));

          _.each(gb.doc.productsByVendor()[req.params.vendor], function(v){
            var prod = _.find(gb.doc.get('products'), function(p){
              return p._id.toString() === v._id.toString();
            });

            if (prod) Belt.set(prod, 'source.order', gb.order);
          });

          gb.doc.getShipments();

          S.sendAllShippingNotifications({
            'doc': gb.doc
          , 'request': req
          }, Belt.cw(cb));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'UpdateVendorOrder', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /admin/order/:_id/shipment/create.json Create Order Shipment
   * @apiName CreateShipmentOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.all('/admin/' + S.name + '/:_id/shipment/create.json', function(req, res){
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

          var ship = req.data().shipment;
          ship.sent_shipped_email = Belt.cast(ship.sent_shipped_email, 'boolean');

          ship['vendor'] = ship.vendor || Belt.get(_.find(gb.doc.get('products'), function(p){
            return _.some(ship.products, function(p2){
              return p2.toString() === p._id.toString();
            });
          }), 'source.product.vendor');

          gb.doc.shipments.push(ship);

          S.sendAllShippingNotifications({
            'doc': gb.doc
          , 'request': req
          }, Belt.cw(cb));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateOrderShipment', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': gb.email
        });
      });
    });

  /**
   * @api {get} /admin/order/streetammo/export.csv Export Streetammo Orders CSV
   * @apiName ExportStreetammoOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.all('/admin/' + S.name + '/streetammo/export.csv', function(req, res){
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
      , function(cb){
          gb['objs'] = Belt.get(gb, 'docs.[].toSanitizedObject()');

          gb.objs = _.chain(gb.objs)
                     .filter(function(o){
                       return o.streetammo_csv_order;
                      })
                     .map(function(o){
                        return _.extend({
                          'date': Moment(o.created_at).format('DD/MM/YYYY')
                        }, o.streetammo_csv_order, {

                        });
                      })
                     .value();

          cb();
        }
      ], function(err){
        if (err){
          S.instance.ErrorNotification(err, 'OrderStreetammoCSVExport', {
            '_id': Belt.get(gb, 'doc._id')
          , 'data': a.o.data
          });
          return res.end(err.message);
        }

        var csv = CSV.format({'headers': true})
                     .transform(function(doc, next){
                       next(null, _.extend({}, doc));
                     });

        csv.pipe(res.status(200).type('text/csv'));

        _.each(gb.objs || [], function(d){
          csv.write(d);
        });

        csv.end();
      });
    });


  /**
   * @api {get} /admin/order/export.csv Export Orders CSV
   * @apiName ExportOrder
   * @apiGroup Order
   * @apiPermission admin
   *
   */
    S.instance.express.all('/admin/' + S.name + '/export.csv', function(req, res){
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
      , function(cb){
          gb['objs'] = _.flatten(Belt.get(gb, 'docs.[].createCSVOrderData()'));

          cb();
        }
      ], function(err){
        if (err){
          S.instance.ErrorNotification(err, 'OrderCSVExport', {
            '_id': Belt.get(gb, 'doc._id')
          , 'data': a.o.data
          });
          return res.end(err.message);
        }

        var csv = CSV.format({'headers': true})
                     .transform(function(doc, next){
                       next(null, _.extend({}, doc));
                     });

        csv.pipe(res.status(200).type('text/csv'));

        _.each(gb.objs || [], function(d){
          csv.write(d);
        });

        csv.end();
      });
    });

/*
  if (S.settings.environment === 'production-worker' && Belt.get(S.settings, 'notifications.unshipped_order_slack')){
    S.instance.on('ready', function(){
      Async.forever(function(next){
        if (Moment().format('hh:mm') !== '08:01') return setTimeout(next, 60 * 1000);

        var gb = {};

        Async.waterfall([
          function(cb){
            S.model.find({
              'shipping_status': 'unshipped'
            , 'created_at': {
                '$gt': Moment().subtract(3, 'days')
              }
            }, Belt.cs(cb, gb, 'docs', 1, 0));
          }
        , function(cb){
            _.each(gb.docs, function(d){
              Request({
                'url': S.settings.notifications.unshipped_order_slack
              , 'method': 'post'
              , 'json': true
              , 'body': {
                  'text': 'Order #'
                        + d.get('slug') + ' has unshipped items after more than three days!'
                        + ' <https://wanderset.com/admin/order/' + d.get('_id').toString() + '/read>'
                , 'username': 'ORDER-BOT'
                , 'icon_emoji': ':interrobang:'
                }
              }, Belt.noop);
            });

            cb();
          }
        ], function(err){
          setTimeout(next, 60 * 1000);
        });
      }, Belt.np);
    });
  }
*/

  if ((S.settings.environment === 'production-worker') && Belt.get(S.settings, 'notifications.unshipped_order_slack')){
    S.instance.on('ready', function(){
      Async.forever(function(next){
        var gb = {};

        Async.waterfall([
          function(cb){
            S.model.find({
              'shipping_status': 'unshipped'
            , 'support_status': {
                '$ne': 'refunded'
              }
            , 'updated_at': {
                '$lt': Moment().subtract(24, 'hours').toDate()
              }
            }, Belt.cs(cb, gb, 'docs', 1, 0));
          }
        , function(cb){
            Async.eachSeries(gb.docs, function(d, cb2){
              Request({
                'url': S.settings.notifications.unshipped_order_slack
              , 'method': 'post'
              , 'json': true
              , 'body': {
                  'text': 'Order #'
                        + d.get('slug') + ' has unshipped items and has not been updated in the last 24 hours!'
                        + ' <https://wanderset.com/admin/order/' + d.get('_id').toString() + '/read>'
                , 'username': 'ORDER-BOT'
                , 'icon_emoji': ':interrobang:'
                }
              }, Belt.np);

              S.instance.mailer.sendMail({
                'from': S.settings.email.order
              , 'to': S.settings.email.order_inactivity
              , 'subject': 'IMPORTANT! INACTIVE WANDERSET Order ' + d.get('slug')
              , 'text': 'Order #'
                    + d.get('slug') + ' has unshipped items and has not been updated in the last 24 hours!'
                    + ' https://wanderset.com/admin/order/' + d.get('_id').toString() + '/read'
              , 'html': 'Order #'
                    + d.get('slug') + ' has unshipped items and has not been updated in the last 24 hours!'
                    + ' https://wanderset.com/admin/order/' + d.get('_id').toString() + '/read'
              }, Belt.np);

              d.set({
                'notes': Moment().format('MM/DD/YY hh:mm a') + ' - Inactivity Alarm' + (d.get('notes') ? '\n' + d.get('notes') : '')
              });

              d.save(Belt.cw(cb2, 0));
            }, Belt.cw(cb));
          }
        ], function(err){
          if (err) S.instance.ErrorNotification(err, 'UnshippedOrderNotification', {

          });

          setTimeout(next, 60 * 1000);
        });
      }, Belt.np);
    });
  }

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
