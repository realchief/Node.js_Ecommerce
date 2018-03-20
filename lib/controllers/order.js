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
  , Natural = require('natural')
  , Mongoose = require('mongoose')
  , PDF = require('html-to-pdf')
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
                + ' - https://wanderset.com/admin/order/' + a.o.doc.get('slug').toString() + '/read'
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
                + ' - ' + a.o.error + ' - ' + S.settings.host + '/admin/cart/' + Belt.get(a.o, 'request.session.cart._id.toString()') + '/read.json'
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
                + ' - https://wanderset.com/admin/order/' + a.o.doc.get('_id').toString() + '/read'
        , 'username': 'ORDER-BOT'
        , 'icon_emoji': ':package:'
        }
      }, Belt.noop);
    }

    var html = S.instance.renderView(a.o.request, 'order_shipping_email', {
      'doc': Belt.get(a.o.doc, 'toSanitizedObject()')
    , 'message': 'Items in your order have shipped' + (a.o.shipment.tracking_url ? ' <a href="' + a.o.shipment.tracking_url + '">Click here to track your shipment</a' : '')
    , 'status_update': 'Items in your order have shipped'
    , 'tracking_link': a.o.shipment.tracking_url ? '<a style="color:blue;" href="' + a.o.shipment.tracking_url + '">Track your shipment</a' : ''
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
      //override_sent
    });

    gb['sent_products'] = _.chain(a.o.doc.shipments)
                           .filter(function(s){
                             return s.sent_shipped_email;
                           })
                           .pluck('products')
                           .flatten()
                           .uniq(function(p){
                             return p.toString();
                           })
                           .value();

    Async.eachSeries(a.o.doc.shipments || [], function(s, cb2){
      if (a.o.override_sent && Belt.get(s, 'status.toLowerCase()') !== 'delivered'){
        s.sent_shipped_email = false;
      } else if (_.every(s.products, function(p){
        return _.some(gb.sent_products, function(sp){
          return p.toString() === sp.toString();
        });
      })){
        s.sent_shipped_email = true;
      }

      if (s.sent_shipped_email) return cb2();

      s['sent_shipped_email'] = true;

      self.sendOrderShippingNotification({
        'doc': a.o.doc
      , 'request': a.o.request
      , 'shipment': s
      }, Belt.cw(cb2));
    }, Belt.cw(a.cb));
  };

  S['OrderQueue'] = Async.queue(function(task, next){
    task(next);
  }, 1);

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
             , 'request': req
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

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 6;

          gb.cart.save(Belt.cw(cb, 0));
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

          gb.doc.setSlug();

          gb.doc.set({
            'buyer.email': Belt.get(gb, 'doc.buyer.email.toLowerCase()')
          });

          gb['processing_failure'] = true;

          gb.step = 10;

          S.instance.stripe.customers.create({
            'source': a.o.data.token
          , 'metadata': Belt.objFlatten(gb.cart.buyer)
          , 'email': gb.doc.get('buyer.email')
          , 'shipping': {
              'name': gb.doc.get('recipient.first_name') + ' ' + gb.doc.get('recipient.last_name')
            , 'phone': gb.doc.get('recipient.phone')
            , 'address': _.extend({
                'city': gb.doc.get('recipient.city')
              , 'state': gb.doc.get('recipient.region')
              , 'country': gb.doc.get('recipient.country')
              , 'line1': gb.doc.get('recipient.street')
              , 'postal_code': gb.doc.get('recipient.postal_code')
              }, gb.doc.get('recipient.street_b') ? {
                'line2': gb.doc.get('recipient.street_b')
              } : {})
            }
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

          S.OrderQueue.push(function(next){
            Async.waterfall([
              function(cb2){
                gb.processing_failure = false;

                S.instance.helpers.order_rules.ProcessCartRules({
                  'cart': gb.cart
                }, Belt.cs(cb2, gb, 'cart', 1, 0));
              }
            , function(cb2){
                gb['cart_obj'] = gb.cart.toSanitizedObject();

                gb.doc.products = [];

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

                gb.doc.set({
                  'line_items': gb.cart_obj.line_items
                });

                if (!_.any(gb.doc.products)) return cb2(new Error('Bag is empty'));
                if (!gb.doc.get('total_price')) return cb2();

                gb.processing_failure = true;

                S.instance.stripe.charges.create({
                  'amount': Math.ceil(gb.doc.get('total_price') * 100)
                , 'currency': 'usd'
                , 'source': gb.doc.get('buyer.payment_method')
                , 'description': 'Wanderset Order #' + gb.doc.get('slug').toString()
                , 'customer': gb.doc.get('buyer.payment_customer_id')
                , 'statement_descriptor': ('WNDRST' + gb.doc.get('slug').toString()).split('').slice(0, 22).join('')
                , 'shipping': {
                    'name': gb.doc.get('recipient.first_name') + ' ' + gb.doc.get('recipient.last_name')
                  , 'phone': gb.doc.get('recipient.phone')
                  , 'address': _.extend({
                      'city': gb.doc.get('recipient.city')
                    , 'state': gb.doc.get('recipient.region')
                    , 'country': gb.doc.get('recipient.country')
                    , 'line1': gb.doc.get('recipient.street')
                    , 'postal_code': gb.doc.get('recipient.postal_code')
                    }, gb.doc.get('recipient.street_b') ? {
                      'line2': gb.doc.get('recipient.street_b')
                    } : {})
                  }
                }, Belt.cs(cb2, gb, 'transaction', 1, 0));
              }
            , function(cb2){
                gb.step = 12;

                if (!gb.doc.get('total_price')) return cb2();

                if (!Belt.get(gb.transaction, 'id')){
                  return cb2(new Error('Unable to process payment'));
                }

                gb.processing_failure = false;

                gb.doc.transactions.push({
                  'id': gb.transaction.id
                , 'amount': gb.transaction.amount / 100
                , 'created_at': new Date()
                , 'type': 'charge'
                , 'description': 'charged at checkout'
                , 'source': gb.transaction
                , 'payment_gateway': 'stripe'
                });

                gb.doc.save(Belt.cs(cb2, gb, 'doc', 1, 0));
              }
            , function(cb2){
                gb['promo_codes'] = _.chain(gb.doc.line_items)
                                     .filter(function(v){
                                        return Belt.get(v, 'details.promo_code');
                                      })
                                     .value();

                Async.eachSeries(gb.promo_codes || [], function(e, cb3){
                  Async.waterfall([
                    function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      }, {
                        '$inc': {
                          'claims': 1
                        }
                      }, Belt.cw(cb4));
                    }
                  , function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      , 'credit_balance': true
                      }, {
                        '$inc': {
                          'discount_amount': Belt.cast(e.amount, 'number')
                        }
                      }, Belt.cw(cb4));
                    }
                  , function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      , 'credit_balance': true
                      , 'discount_amount': {
                          '$lte': 0
                        }
                      }, {
                        '$set': {
                          'active': false
                        }
                      }, Belt.cw(cb4));
                    }
                  ], Belt.cw(cb3));
                }, Belt.cw(cb2, 0));
              }
            , function(cb2){
                Async.eachSeries(gb.doc.products || [], function(p, cb3){
                  Async.waterfall([
                    function(cb4){
                      S.instance.db.model('stock').update({
                        '_id': p.stock
                      }, {
                        '$inc': {
                          'available_quantity': (-1 * p.quantity)
                        }
                      }, Belt.cw(cb4));
                    }
                  ], Belt.cw(cb3));
                }, Belt.cw(cb2, 0));
              }
            ], function(err){
              cb(err);
              next();
            });
          });
        }
      , function(cb){
          gb.step = 13;

          gb['authorized'] = S.instance.helpers.order_rules.AuthorizeOrder({
            'order': gb.doc
          });

          if (!gb.authorized) return cb();

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
          , 'cart': gb.cart
          , 'data': a.o.data
          });

          if (gb.processing_failure){
            S.sendOrderFailure({
              'request': req
            , 'doc': gb.doc
            , 'error': err.message
            }, Belt.np);

            gb.cart.failed_transactions.push({
              'created_at': new Date()
            , 'customer_id': Belt.get(gb, 'customer.id') || Belt.get(gb, 'doc.buyer.payment_account_id')
            , 'message': err.message
            });

            gb.cart.save(Belt.np);
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

    S.instance.express.all('/' + S.name + '/paypal/authorize.json', function(req, res){
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
          gb.step = 1;

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

          gb.step = 5;

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.save(Belt.cw(cb));
        }
      , function(cb){
          gb.step = 11;

          gb['cart_obj'] = gb.cart.toSanitizedObject();

          var req = JSON.stringify({
            'intent': 'sale'
          , 'payer': {
              'payment_method': 'paypal'
            }
          , 'redirect_urls': {
              'return_url': S.settings.host + '/order/paypal/create'
            , 'cancel_url': S.settings.host + '/checkout'
            }
          , 'transactions': [
              {
                'amount': {
                  'total': gb.cart.get('total_price').toFixed(2)
                , 'currency': 'USD'
                }
              , 'description': 'Payment for Wanderset order'
              /*, 'item_list': {
                  'items': _.map(gb.cart_obj.products, function(o){
                    return {
                      'name': (Belt.get(o, 'product.label.us') || '').split('').slice(0, 127).join('')
                    , 'description': (_.map(Belt.get(o, 'options'), function(v, k){
                        return k + ': ' + v;
                      }).join(', ') || '').split('').slice(0, 127).join('')
                    , 'quantity': (Belt.cast(Belt.get(o, 'quantity') || '', 'string')).split('').slice(0, 10).join('')
                    , 'price': (S.instance.priceString(Belt.get(o, 'stock.price') * o.quantity) || '').split('').slice(0, 10).join('')
                    , 'currency': 'USD'
                    };
                  })
                , 'shipping_address': Belt.objDefalse({
                    'line1': gb.cart.get('recipient.street')
                  , 'line2': gb.cart.get('recipient.street_b')
                  , 'city': gb.cart.get('recipient.city')
                  , 'country_code': gb.cart.get('recipient.country')
                  , 'postal_code': gb.cart.get('recipient.postal_code')
                  , 'state': gb.cart.get('recipient.region')
                  })
                }*/
              }
            ]
          });

          S.instance.paypal.payment.create(req, function(err, payment){
            if (err) return cb(err);

            gb['payment'] = payment;
            gb['redirect_url'] = _.find(Belt.get(gb.payment, 'links'), function(l){
              return l.rel === 'approval_url';
            });

            if (!gb.redirect_url) return cb(new Error('Unable to process payment with Paypal'));

            gb.redirect_url = gb.redirect_url.href;

            cb();
          });
        }
      ], function(err){
        if (err){
          console.log(Belt.stringify(err));
          console.log(gb.step);

          S.instance.ErrorNotification(err, 'AuthorizePaypalOrder', {
            '_id': Belt.get(gb, 'doc._id')
          , 'cart': gb.cart
          , 'data': a.o.data
          });
        }

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': {
            'redirect_url': gb.redirect_url
          }
        });
      });
    });

    S.instance.express.all('/' + S.name + '/paypal/create', function(req, res){
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
          gb.step = 1;

          if (!Belt.get(a.o, 'data.paymentId')
           || !Belt.get(a.o, 'data.PayerID')) return cb(new Error('There was a problem processing your payment'));

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
          gb.step = 5;

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 6;

          gb.cart.save(Belt.cw(cb, 0));
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

          var ocb = _.once(cb);

          gb.doc.setSlug();

          gb.doc.set({
            'buyer.email': Belt.get(gb, 'doc.buyer.email.toLowerCase()')
          });

          gb['processing_failure'] = true;

          gb.step = 10;

          S.OrderQueue.push(function(next){
            Async.waterfall([
              function(cb2){
                gb.processing_failure = false;

                S.instance.helpers.order_rules.ProcessCartRules({
                  'cart': gb.cart
                }, Belt.cs(cb2, gb, 'cart', 1, 0));
              }
            , function(cb2){
                gb['cart_obj'] = gb.cart.toSanitizedObject();

                gb.doc.products = [];

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

                gb.doc.set({
                  'line_items': gb.cart_obj.line_items
                });

                if (!_.any(gb.doc.products)) return cb2(new Error('Bag is empty'));
                if (!gb.doc.get('total_price')) return cb2();

                gb.processing_failure = true;

                S.instance.paypal.payment.execute(a.o.data.paymentId, {
                  'payer_id': a.o.data.PayerID
                , 'transactions': [
                    {
                      'amount': {
                        'total': gb.doc.get('total_price').toFixed(2)
                      , 'currency': 'USD'
                      }
                    , 'description': 'Payment for Wanderset Order #' + gb.doc.get('slug')
                    }
                  ]
                }, Belt.cs(cb2, gb, 'transaction', 1, 0))
              }
            , function(cb2){
                console.log(Belt.stringify(gb.transaction));

                gb.step = 12;

                if (!gb.doc.get('total_price')) return cb2();

                if (!Belt.get(gb.transaction, 'id')){
                  return cb2(new Error('Unable to process payment'));
                }

                if (Belt.get(gb.transaction, 'transactions.0.related_resources.0.sale.state') !== 'completed'){
                  return cb2(new Error('Paypal payment was declined'));
                }

                gb.processing_failure = false;

                gb.doc.transactions.push({
                  'id': Belt.get(gb.transaction, 'transactions.0.related_resources.0.sale.id') || gb.transaction.id
                , 'amount': Belt.cast(Belt.get(gb.transaction, 'transactions.0.amount.total'), 'number')
                , 'created_at': new Date()
                , 'type': 'charge'
                , 'description': 'charged at paypal checkout'
                , 'source': gb.transaction
                , 'payment_gateway': 'paypal'
                });

                gb.doc.set({
                  'buyer.payment_method': 'paypal'
                , 'buyer.payment_customer_id': a.o.data.PayerID
                });

                gb.doc.save(Belt.cs(cb2, gb, 'doc', 1, 0));
              }
            , function(cb2){
                gb['promo_codes'] = _.chain(gb.doc.line_items)
                                     .filter(function(v){
                                        return Belt.get(v, 'details.promo_code');
                                      })
                                     /*.map(function(v){
                                        return Belt.get(v, 'details.promo_code');
                                      })*/
                                     .value();

                Async.eachSeries(gb.promo_codes || [], function(e, cb3){
                  Async.waterfall([
                    function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      }, {
                        '$inc': {
                          'claims': 1
                        }
                      }, Belt.cw(cb4));
                    }
                  , function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      , 'credit_balance': true
                      }, {
                        '$inc': {
                          'discount_amount': Belt.cast(e.amount, 'number')
                        }
                      }, Belt.cw(cb4));
                    }
                  , function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      , 'credit_balance': true
                      , 'discount_amount': {
                          '$lte': 0
                        }
                      }, {
                        '$set': {
                          'active': false
                        }
                      }, Belt.cw(cb4));
                    }
                  ], Belt.cw(cb3));
                }, Belt.cw(cb2, 0));
              }
            ], function(err){
              cb(err);
              next();
            });
          });
        }
      , function(cb){
          gb.step = 13;

          gb['authorized'] = S.instance.helpers.order_rules.AuthorizeOrder({
            'order': gb.doc
          });

          if (!gb.authorized) return cb();

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

          err.message = Belt.get(err, 'response.message') || err.message;

          S.instance.ErrorNotification(err, 'CreatePaypalOrder', {
            '_id': Belt.get(gb, 'doc._id')
          , 'cart': gb.cart
          , 'data': a.o.data
          });

          if (gb.processing_failure){
            S.sendOrderFailure({
              'request': req
            , 'doc': gb.doc
            , 'error': err.message
            }, Belt.np);

            gb.cart.failed_transactions.push({
              'created_at': new Date()
            , 'customer_id': Belt.get(gb, 'customer.id') || Belt.get(gb, 'doc.buyer.payment_account_id')
            , 'message': err.message
            });

            gb.cart.save(Belt.np);
          }
        } else {
          Belt.delete(req, 'session.cart');
          gb.cart.remove(Belt.np);
        }

        res.redirect(err ? '/checkout?error=' + encodeURIComponent(err.message) : '/checkout/complete');
      });
    });

    S.instance.express.post('/admin/' + S.name + '/cart/:cart/create.json', function(req, res){
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
          gb.step = 1;

          if (!Belt.get(a.o, 'data.transaction')){
            if (!Belt.get(a.o, 'data.payment_method')) return cb(new Error('payment_method is missing'));
            if (!Belt.get(a.o, 'data.customer_id')) return cb(new Error('customer_id is missing'));
          }

          S.instance.db.model('cart').findOne({
            '_id': req.params.cart
          }, Belt.cs(cb, gb, 'cart', 1));
        }
      , function(cb){
          if (!gb.cart) return cb(new Error('Cart not found'));

          gb.step = 5;

          S.instance.helpers.order_rules.ProcessCartRules({
            'cart': gb.cart
          }, Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.step = 6;

          gb.cart.save(Belt.cw(cb, 0));
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

          gb.doc.set({
            'buyer.payment_method': a.o.data.payment_method
          , 'buyer.payment_customer_id': a.o.data.customer_id
          });

          S.OrderQueue.push(function(next){
            Async.waterfall([
              function(cb2){
                gb.processing_failure = false;

                S.instance.helpers.order_rules.ProcessCartRules({
                  'cart': gb.cart
                }, Belt.cs(cb2, gb, 'cart', 1, 0));
              }
            , function(cb2){
                if (a.o.data.transaction) return cb2();
                if (!gb.doc.get('total_price')) return cb2();

                gb.processing_failure = true;

                S.instance.stripe.charges.create({
                  'amount': Math.ceil(gb.doc.get('total_price') * 100)
                , 'currency': 'usd'
                , 'source': gb.doc.get('buyer.payment_method')
                , 'description': 'Wanderset Order #' + gb.doc.get('slug').toString()
                , 'customer': gb.doc.get('buyer.payment_customer_id')
                , 'statement_descriptor': ('WNDRST' + gb.doc.get('slug').toString()).split('').slice(0, 22).join('')
                , 'shipping': {
                    'name': gb.doc.get('recipient.first_name') + ' ' + gb.doc.get('recipient.last_name')
                  , 'phone': gb.doc.get('recipient.phone')
                  , 'address': _.extend({
                      'city': gb.doc.get('recipient.city')
                    , 'state': gb.doc.get('recipient.region')
                    , 'country': gb.doc.get('recipient.country')
                    , 'line1': gb.doc.get('recipient.street')
                    , 'postal_code': gb.doc.get('recipient.postal_code')
                    }, gb.doc.get('recipient.street_b') ? {
                      'line2': gb.doc.get('recipient.street_b')
                    } : {})
                  }
                }, Belt.cs(cb2, gb, 'transaction', 1, 0));
              }
            , function(cb2){
                gb.step = 12;

                if (!gb.doc.get('total_price')) return cb2();

                if (a.o.data.transaction && !gb.transaction){
                  gb['transaction'] = a.o.data.transaction;
                }

                if (!Belt.get(gb.transaction, 'id')){
                  return cb2(new Error('Unable to process payment'));
                }

                gb.processing_failure = false;

                gb.doc.transactions.push({
                  'id': gb.transaction.id
                , 'amount': gb.transaction.amount / 100
                , 'created_at': new Date()
                , 'type': 'charge'
                , 'description': 'charged at checkout'
                , 'source': gb.transaction
                , 'payment_gateway': 'stripe'
                });

                gb.doc.save(Belt.cs(cb2, gb, 'doc', 1, 0));
              }
            , function(cb2){
                gb['promo_codes'] = _.chain(gb.doc.line_items)
                                     .filter(function(v){
                                        return Belt.get(v, 'details.promo_code');
                                      })
                                     /*.map(function(v){
                                        return Belt.get(v, 'details.promo_code');
                                      })*/
                                     .value();

                Async.eachSeries(gb.promo_codes || [], function(e, cb3){
                  Async.waterfall([
                    function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      }, {
                        '$inc': {
                          'claims': 1
                        }
                      }, Belt.cw(cb4));
                    }
                  , function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      , 'credit_balance': true
                      }, {
                        '$inc': {
                          'discount_amount': Belt.cast(e.amount, 'number')
                        }
                      }, Belt.cw(cb4));
                    }
                  , function(cb4){
                      S.instance.db.model('promo_code').update({
                        'code': e.details.promo_code
                      , 'credit_balance': true
                      , 'discount_amount': {
                          '$lte': 0
                        }
                      }, {
                        '$set': {
                          'active': false
                        }
                      }, Belt.cw(cb4));
                    }
                  ], Belt.cw(cb3));
                }, Belt.cw(cb2, 0));
              }
            ], function(err){
              cb(err);
              next();
            });
          });
        }
      , function(cb){
          gb.step = 13;

          gb['authorized'] = S.instance.helpers.order_rules.AuthorizeOrder({
            'order': gb.doc
          });

          if (!gb.authorized) return cb();

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
          , 'cart': gb.cart
          , 'data': a.o.data
          });

          if (gb.processing_failure){
            S.sendOrderFailure({
              'request': req
            , 'doc': gb.doc
            , 'error': err.message
            }, Belt.np);

            gb.cart.failed_transactions.push({
              'created_at': new Date()
            , 'customer_id': Belt.get(gb, 'customer.id') || Belt.get(gb, 'doc.buyer.payment_account_id')
            , 'message': err.message
            });

            gb.cart.save(Belt.np);
          }
        } else {

        }

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb.doc, 'toSanitizedObject()')
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
    S.instance.express.get('/admin/' + S.name + '/:_id/read.json', function(req, res){
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

          gb.doc.getHelpscoutConversations(Belt.cw(cb));
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
    S.instance.express.all('/admin/' + S.name + '/:_id/update.json', function(req, res){
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
    S.instance.express.delete('/admin/' + S.name + '/:_id/delete.json', function(req, res){
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

    S.instance.express.all('/admin/' + S.name + '/:_id/line_item/create.json', function(req, res){
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

          gb.doc.line_items.push(a.o.data.line_item);

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'AddOrderLineItem', {
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
   * @api {get} /order/list.json List Orders
   * @apiName ListOrder
   * @apiGroup Order
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
          if (a.o.data && a.o.data.query && a.o.data.query['products.source.product.vendor']){
            a.o.data.query['products.source.product.vendor'] = Mongoose.Types.ObjectId(a.o.data.query['products.source.product.vendor']);
          }

          self.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(gb.docs || [], 10, function(e, cb2){
            e.getHelpscoutConversations(Belt.cw(cb2));
          }, Belt.cw(cb));
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
          if (a.o.data && a.o.data.query && a.o.data.query['products.source.product.vendor']){
            a.o.data.query['products.source.product.vendor'] = Mongoose.Types.ObjectId(a.o.data.query['products.source.product.vendor']);
          }

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
    S.instance.express.all('/admin/' + S.name + '/:_id/confirmation/send.json', function(req, res){
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
    S.instance.express.all('/admin/' + S.name + '/:_id/shipping_notification/send.json', function(req, res){
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
          , 'override_sent': a.o.data.override_sent
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
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      a.o.data.omit_ordered = false;

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

          gb.doc.createVendorOrders(a.o.data, Belt.cw(cb, 0));
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
             , 'request': req
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

          } else if (Belt.get(gb, 'vendor.magento')){
            self.instance.helpers.magento.ReadOrder({
              'vendor': gb.vendor
            , 'order': req.params.order
            }, Belt.cs(cb, gb, 'order', 1, 0));

          } else if (Belt.get(gb.vendor, 'custom_sync.strategy') === 'streetammo') {
            self.instance.helpers.helpscout.FindStreetammoShippingEmail({
              'order_slug': gb.doc.slug
            }, function(err, url){
              gb['streetammo_url'] = url;
              cb();
            });

          } else {
            return cb(new Error('vendor does not accept API orders'));

          }
        }
      , function(cb){
          if (!gb.order && !gb.streetammo_url) return cb(new Error('order not found'));

          if (gb.streetammo_url){
            var sa_products = gb.doc.productsByVendor()[req.params.vendor]
              , fulfillment = {
                  'id': Belt.uuid()
                , 'tracking_company': 'UPS'
                , 'label': 'UPS'
                , 'tracking_number': gb.streetammo_url
                , 'tracking_url': gb.streetammo_url
                , 'products': _.pluck(sa_products, '_id')
                , 'vendor': req.params.vendor
                , 'platform': 'streetammo'
                , 'shipment_status': 'shipped'
                };

            _.each(gb.doc.productsByVendor()[req.params.vendor], function(v){
              var prod = _.find(gb.doc.get('products'), function(p){
                return p._id.toString() === v._id.toString();
              });

              if (prod) Belt.set(prod, 'source.order.fulfillments', [Belt.copy(fulfillment)]);
            });
          } else if (gb.order){
            _.each(gb.doc.productsByVendor()[req.params.vendor], function(v){
              var prod = _.find(gb.doc.get('products'), function(p){
                return p._id.toString() === v._id.toString();
              });

              if (prod) Belt.set(prod, 'source.order', gb.order);
            });
          }

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
             , 'request': req
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

    S.instance.express.all('/admin/' + S.name + '/:_id/transactions/update.json', function(req, res){
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

          return Async.eachSeries(gb.doc.transactions || [], function(e, cb2){
            if (e.payment_gateway === 'stripe' || (e.id || '').match(/^ch\_/)){
              return S.instance.stripe.charges.retrieve(e.id, function(err, trans){
                if (trans){
                  e['source'] = trans;
                  e['amount_refunded'] = (Belt.get(trans, 'amount_refunded') || 0) / 100;
                  e['status'] = trans.refunded ? 'refunded' : (trans.paid ? 'paid' : 'unknown');
                }
                cb2();
              });
            }

            if (e.payment_gateway === 'paypal' || !(e.id || '').match(/^ch\_/)){
              return S.instance.paypal.payment.get(Belt.get(e, 'source.id') || e.id, function(err, trans){
                if (trans){
                  e['id'] = Belt.get(trans, 'transactions.0.related_resources.0.sale.id');
                  e['source'] = trans;
                  e['amount_refunded'] = Belt.cast(Belt.get(trans, 'transactions.0.related_resources.0.refund.amount.total') || 0, 'number');
                  e['status'] = Belt.get(trans, 'transactions.0.related_resources.0.sale.state');
                  if (e.status === 'completed') e.status = 'paid';
                }
                cb2();
              });
            }

            cb2();
          }, Belt.cw(cb));
        }
      , function(cb){
          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'UpdateOrderTransactions', {
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
             , 'request': req
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.listAll(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
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

    S.instance.express.all('/admin/' + S.name + '/:date/export.csv', function(req, res){
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
/*
      a.o.data['query'] = _.extend(a.o.data.query || {}, {
        'created_at': {
          '$gte':
        , '$lt':
        }
      });
*/
      return Async.waterfall([
        function(cb){
          self.listAll(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
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

    S.instance.express.all('/admin/' + S.name + '/:_id/product/create.json', function(req, res){
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
          if (!a.o.data.product) return cb(new Error('product is required'));

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

          gb['cart'] = S.instance.db.model('cart')({
            'products': a.o.data.product
          });

          gb.cart.populateProducts(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          gb.cart.getStocks(Belt.cs(cb, gb, 'cart', 1, 0));
        }
      , function(cb){
          var p = gb.cart.products[0];

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

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateOrderProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/admin/' + S.name + '/:_id/product/:product/delete.json', function(req, res){
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
          if (!a.o.data.product) return cb(new Error('product is required'));

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

          gb.doc.products.pull(a.o.data.product);

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'DeleteOrderProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/' + S.name + '/:_id/v/:vendor/h/:hash/packing_slip.html', function(req, res){
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

          gb.doc = gb.doc.toSanitizedObject();

          gb['html'] = S.instance.renderView(req, 'order_packing_slip', {
            'doc': gb.doc
          });

          cb();
        }
      ], function(err){
        if (err) return res.status(404).send(err ? err.message : 'Forbidden');


        res.status(200).send(gb.html);
      });
    });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
