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
  S['admin_routes'] = [
    /\/admin\//
  , /^\/(product|set|media)\/.*(create|update|delete)\.json/
  , /^\/(vendor)/
  , /^\/(stock)/
  , /^\/(order)\/.*(list|count|read|send|update|delete)\.json/
  , /^\/public\/admin/
  , /^\/public\/js\/admin/
  ];

  S['sections'] = {
    'product': {
      'pages': [
        {
          'title': 'Create'
        , 'route': '/admin/product/create'
        , 'view': 'admin_product'
        , 'button_title': 'Create'
        , 'js_files': [
            '/public/js/admin/product_view.js'
          , '/public/js/admin/product_create.js'
          ]
        }
      , {
          'title': 'List'
        , 'route': '/admin/product/list'
        , 'view': 'admin_product_list'
        , 'js_files': [
            '/public/js/admin/product_list.js'
          ]
        }
      , {
          'title': 'Uncategorized'
        , 'route': '/admin/product/list/uncategorized'
        , 'view': 'admin_product_list'
        , 'js_files': [
            '/public/js/admin/product_list.js'
          ]
        , 'js_data': {
            'query': JSON.stringify({
              'categories.0': {
                '$exists': false
              }
            , 'auto_category': {
                '$exists': false
              }
            })
          }
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/product/:_id/read'
        , 'view': 'admin_product'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/product_view.js'
          , '/public/js/admin/product_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/product/:_id'
        , 'view': 'admin_product'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/product_view.js'
          , '/public/js/admin/product_update.js'
          ]
        }
      , {
          'title': 'Bulk Updates'
        , 'route': '/admin/product/bulk'
        , 'view': 'admin_product_bulk'
        , 'js_files': [
            '/public/js/admin/product_bulk.js'
          ]
        , 'js_data': {

          }
        }
      ]
    }
  , 'media': {
      'pages': [
        {
          'title': 'Create'
        , 'route': '/admin/media/create'
        , 'view': 'admin_media'
        , 'button_title': 'Create'
        , 'js_files': [
            '/public/js/admin/media_view.js'
          , '/public/js/admin/media_create.js'
          ]
        }
      , {
          'title': 'List'
        , 'route': '/admin/media/list'
        , 'view': 'admin_media_list'
        , 'js_files': [
            '/public/js/admin/media_list.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/media/:_id/read'
        , 'view': 'admin_media'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/media_view.js'
          , '/public/js/admin/media_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/media/:_id'
        , 'view': 'admin_media'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/media_view.js'
          , '/public/js/admin/media_update.js'
          ]
        }
      ]
    }
  , 'set': {
      'pages': [
        {
          'title': 'Create'
        , 'route': '/admin/set/create'
        , 'view': 'admin_set'
        , 'button_title': 'Create'
        , 'js_files': [
            '/public/js/admin/set_view.js'
          , '/public/js/admin/set_create.js'
          ]
        }
      , {
          'title': 'List'
        , 'route': '/admin/set/list'
        , 'view': 'admin_set_list'
        , 'js_files': [
            '/public/js/admin/set_list.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/set/:_id/read'
        , 'view': 'admin_set'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/set_view.js'
          , '/public/js/admin/set_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/set/:_id'
        , 'view': 'admin_set'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/set_view.js'
          , '/public/js/admin/set_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/brand/:_id'
        , 'view': 'admin_set'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/set_view.js'
          , '/public/js/admin/set_update.js'
          ]
        }
      ]
    }
  , 'vendor': {
      'pages': [
        {
          'title': 'List'
        , 'route': '/admin/vendor/list'
        , 'view': 'admin_vendor_list'
        , 'js_files': [
            '/public/js/admin/vendor_list.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/vendor/:_id/read'
        , 'view': 'admin_vendor'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/vendor_view.js'
          , '/public/js/admin/vendor_update.js'
          ]
        }
      ]
    }
  , 'order': {
      'pages': [
        {
          'title': 'List'
        , 'route': '/admin/order/list'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'limit': 25
          }
        }
      , {
          'title': 'Paypal'
        , 'route': '/admin/order/list/paypal'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'transactions.payment_gateway': 'paypal'
            })
          }
        }
      , {
          'title': 'Unshipped'
        , 'route': '/admin/order/list/unshipped'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'shipping_status': 'unshipped'
            , 'support_status': {
                '$nin': [
                  'refunded'
                , 'ignore'
                , 'closed'
                , 'close'
                , 'refund'
                , 'oos'
                , 'urgent'
                , 'inprogress'
                , 'processing other vendor'
                , 'in progress'
                , 'possible fraud'
                , 'fraud'
                ]
              }
            })
          }
        }
      , {
          'title': 'Out of Stock'
        , 'route': '/admin/order/list/oos'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'oos'
                ]
              }
            })
          }
        }
      , {
          'title': 'Urgent'
        , 'route': '/admin/order/list/urgent'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'urgent'
                ]
              }
            })
          }
        }
      , {
          'title': 'Possible Fraud'
        , 'route': '/admin/order/list/urgent'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'possible fraud'
                , 'fraud'
                ]
              }
            })
          }
        }
      , {
          'title': 'In Progress'
        , 'route': '/admin/order/list/in-progress'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'inprogress'
                , 'in progress'
                , 'processing other vendor'
                ]
              }
            })
          }
        }
      , {
          'title': 'Refunded'
        , 'route': '/admin/order/list/refunded'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'transactions.amount_refunded': {
                '$gt': 0
              }
            })
          }
        }
      , {
          'title': 'Ignored'
        , 'route': '/admin/order/list/ignored'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'refunded'
                , 'ignore'
                , 'closed'
                , 'close'
                , 'refund'
                ]
              }
            })
          }
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/order/:_id/read'
        , 'view': 'admin_order'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/order_view.js'
          , '/public/js/admin/order_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/order/:_id'
        , 'view': 'admin_order'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/order_view.js'
          , '/public/js/admin/order_update.js'
          ]
        }
      ]
    }
  , 'promo_code': {
      'pages': [
        {
          'title': 'Create'
        , 'route': '/admin/promo_code/create'
        , 'view': 'admin_promo_code'
        , 'button_title': 'Create'
        , 'js_files': [
            '/public/js/admin/promo_code_view.js'
          , '/public/js/admin/promo_code_create.js'
          ]
        }
      , {
          'title': 'List'
        , 'route': '/admin/promo_code/list'
        , 'view': 'admin_promo_code_list'
        , 'js_files': [
            '/public/js/admin/promo_code_list.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/promo_code/:_id/read'
        , 'view': 'admin_promo_code'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/promo_code_view.js'
          , '/public/js/admin/promo_code_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/promo_code/:_id'
        , 'view': 'admin_promo_code'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/promo_code_view.js'
          , '/public/js/admin/promo_code_update.js'
          ]
        }
      ]
    }
  };

  S.instance.express.all(/\.csv$/i, function (req, res, next){
    S.log.warn(Belt.stringify({
      'route': req.path
    , 'query': req.query
    , 'body': req.body
    , 'params': req.params
    , 'files': req.files
    , 'headers': req.headers
    , 'session': req.session
    }));

    return next();
  });

  S.instance['AdminLogin'] = function(req, res, next){
    var user = Auth(req);

    if (!user || !user.name || !user.pass || !_.some(S.settings.admin_users, function(v, k){
      return user.name === k && user.pass === v
    })) {
      if (next){
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
      }
      return false;
    }

    if (req.session){
      req.session['is_admin'] = true;
      req.session['admin_user'] = user.name;
    } else {
      if (next){
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        res.sendStatus(401);
      }

      return false;
    }

    if (next) next();

    return true;
  };

  _.each(S.admin_routes, function(r){
    S.instance.express.all(r, S.instance.AdminLogin);
  });

  S.instance.express.all('/admin/order/breakdown', function(req, res){
    var gb = {};

    Async.waterfall([
      function(cb){
        S.instance.db.model('order').find({

        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        gb['breakdown'] = S.instance.db.model('order').orderBreakdown({
          'orders': gb.docs
        });

        gb.breakdown.total_revenue = Belt.cast(gb.breakdown.total_revenue, 'number') + 70 + 195;

        gb['html'] = '<h1>Wanderset Sales Report</h1>';
        gb.html += '<h3>TOTAL</h3>';
        _.each(gb.breakdown, function(v, k){
          if (k === 'vendors'){
            _.each(v, function(v2, k2){
              gb.html += '<hr>';
              gb.html += '<h3>' + k2 + '</h3>';
              _.each(v2, function(v3, k3){
                gb.html += '<p>' + k3 + ': <strong>' + v3 + '</strong></p>';
              });
            });

            return;
          }

          gb.html += '<p>' + k + ': <strong>' + v + '</strong></p>';
        });

        cb();
      }
    ], function(err){
      res.status(200).send(err ? err.message : gb.html);
    });
  });

  _.each(S.sections, function(v, k){
    _.each(v.pages, function(p){
      if (p.skip_route) return;

      S.instance.express.all(p.route, function(req, res, next){
        if ((req.path || '').match(/(\.csv|\.json)$/)) return next();

        return res.status(200).type('text/html').end(S.instance.renderView(req, 'admin', {
          'section': k
        , 'title': k.toUpperCase() + ' | ' + p.title
        , 'view': p.view
        , 'sections': S.sections
        , 'route': p.route
        , 'js_files': p.js_files
        , 'js_data': p.js_data || {}
        , 'data': p
        }));
      });
    })
  });

  S.instance.express.all('/status.json', function(req, res){
    res.status(200).json({
      'data': Moment().format('MM/DD/YYYY HH:mm:ss')
    });
  });

  S.instance.express.all('/admin', function(req, res){
    return res.redirect('/admin/product/list');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
