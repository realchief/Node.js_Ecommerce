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
            'query': Belt.stringify({
            /*  'categories.0': {
                '$exists': false
              }
            , 'auto_category': {
                '$exists': false
              }*/
              'categories': {
                '$not': /^[^>]+>[^>]+/
              }
            , 'auto_category': {
                '$not': /^[^>]+>[^>]+/
              }
            , 'hide': {
                '$ne': true
              }
            , 'sync_hide': {
                '$ne': true
              }
            })
          , 'sort': JSON.stringify({
              '-created_at': -1
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
      ]
    }
  , 'inventory_rule': {
      'pages': [
        {
          'title': 'Create'
        , 'route': '/admin/inventory_rule/create'
        , 'view': 'admin_inventory_rule'
        , 'button_title': 'Create'
        , 'js_files': [
            '/public/js/admin/inventory_rule_view.js'
          , '/public/js/admin/inventory_rule_create.js'
          ]
        }
      , {
          'title': 'List'
        , 'route': '/admin/inventory_rule/list'
        , 'view': 'admin_inventory_rule_list'
        , 'js_files': [
            '/public/js/admin/inventory_rule_list.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/inventory_rule/:_id/read'
        , 'view': 'admin_inventory_rule'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/inventory_rule_view.js'
          , '/public/js/admin/inventory_rule_update.js'
          ]
        }
      , {
          'title': 'Edit'
        , 'route': '/admin/inventory_rule/:_id'
        , 'view': 'admin_inventory_rule'
        , 'hide_menu': true
        , 'button_title': 'Update'
        , 'js_files': [
            '/public/js/admin/inventory_rule_view.js'
          , '/public/js/admin/inventory_rule_update.js'
          ]
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
                //, 'urgent'
                //, 'inprogress'
                //, 'processing other vendor'
                //, 'in progress'
                //, 'in process'
                //, 'possible fraud'
                //, 'fraud'
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
          'title': 'Issue'
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
                , 'issue'
                , 'escalate'
                , 'escalated'
                ]
              }
            })
          }
        }
      , {
          'title': 'Escalated'
        , 'route': '/admin/order/list/escalated'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'escalated'
                , 'escalate'
                ]
              }
            })
          }
        }
      , {
          'title': 'Possible Fraud'
        , 'route': '/admin/order/list/possible-fraud'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'possible fraud'
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
                , 'in process'
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
          'title': 'Fraud'
        , 'route': '/admin/order/list/fraud'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'support_status': {
                '$in': [
                  'fraud'
                ]
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
          'title': 'Vendor Error'
        , 'route': '/admin/order/list/vendor-error'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
        , 'js_data': {
            'query': Belt.stringify({
              'products.source.order.errors': {
                '$exists': true
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
  , 'kpi': {
      'pages': [
        {
          'title': 'Orders Today'
        , 'route': '/admin/kpi/order/today'
        , 'skip_route': true
        }
      , {
          'title': 'Orders Yesterday'
        , 'route': '/admin/kpi/order/yesterday'
        , 'skip_route': true
        }
      , {
          'title': 'Orders This Week'
        , 'route': '/admin/kpi/order/this-week'
        , 'skip_route': true
        }
      , {
          'title': 'Orders Last Week'
        , 'route': '/admin/kpi/order/last-week'
        , 'skip_route': true
        }
      , {
          'title': 'Orders This Month'
        , 'route': '/admin/kpi/order/this-month'
        , 'skip_route': true
        }
      , {
          'title': 'Orders Last Month'
        , 'route': '/admin/kpi/order/last-month'
        , 'skip_route': true
        }
      ]
    }
  , 'content': {
      'pages': [
          {
              'title': 'Homepage'
              , 'route': '/admin/content/homepage'
              , 'view': 'admin_content_homepage'
              , 'js_files': [
                  '/public/js/admin/content_view.js'
                , '/public/js/admin/content_homepage_update.js'
            ]
          }
          , {
              'title': 'Header'
              , 'route': '/admin/content/header'
              , 'view': 'admin_content_header'
              , 'js_files': [
                  '/public/js/admin/content_view.js'
                , '/public/js/admin/content_header_update.js'
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

  S.instance.express.all('/admin/kpi/order/:key', function(req, res){
    S.instance.redis.get('kpis:orders:' + req.params.key, function(err, data){
      try {
        data = Belt.parse(data);
      } catch (e) {
        data = {};
      }

      return res.status(200).type('text/html').end(S.instance.renderView(req, 'admin_order_kpis', {
        'section': 'KPIs'
      , 'title': 'Orders ' + Str.capitalize(Str.humanize(req.params.key))
      , 'route': '/admin/kpi/order/' + req.params.key
      , 'sections': S.sections
      , 'data': data
      }));
    });
  });

  S.instance.express.all('/status.json', function(req, res){
    res.status(200).json({
      'data': Moment().format('MM/DD/YYYY HH:mm:ss')
    , 'host': S.instance.settings.host
    });
  });

  S.instance.express.all('/admin', function(req, res){
    return res.redirect('/admin/order/list');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
