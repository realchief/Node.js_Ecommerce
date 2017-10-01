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
    /^\/admin/
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
          'title': 'List'
        , 'route': '/admin/product/list'
        , 'view': 'admin_product_list'
        , 'js_files': [
            '/public/js/admin/product_list.js'
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
          'title': 'List'
        , 'route': '/admin/media/list'
        , 'view': 'admin_media_list'
        , 'js_files': [
            '/public/js/admin/media_list.js'
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
          'title': 'List'
        , 'route': '/admin/set/list'
        , 'view': 'admin_set_list'
        , 'js_files': [
            '/public/js/admin/set_list.js'
          ]
        }
      ]
    }
  , 'vendor': {
      'pages': [
        {
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
      , {
          'title': 'List'
        , 'route': '/admin/vendor/list'
        , 'view': 'admin_vendor_list'
        , 'js_files': [
            '/public/js/admin/vendor_list.js'
          ]
        }
      ]
    }
  , 'order': {
      'pages': [
        {
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
          'title': 'List'
        , 'route': '/admin/order/list'
        , 'view': 'admin_order_list'
        , 'js_files': [
            '/public/js/admin/order_list.js'
          ]
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
      ]
    }
  };

  /*
  S.instance.express.all('/vip', function(req, res){
    req.session['no_auth'] = true;
    res.redirect('/');
  });
  */

  _.each(S.admin_routes, function(r){
    S.instance.express.all(r, function(req, res, next){
      //if (req.session.no_auth || req.hostname.match(/shopify/)) return next();

      var user = Auth(req);

      if (!user || !user.name || !user.pass || !_.some(S.settings.admin_users, function(v, k){
        return user.name === k && user.pass === v
      })) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
      }

      next();
    });
  });

  _.each(S.sections, function(v, k){
    _.each(v.pages, function(p){
      S.instance.express.all(p.route, function(req, res){
        return res.status(200).type('text/html').end(S.instance.renderView(req, 'admin', {
          'section': k
        , 'title': k.toUpperCase() + ' | ' + p.title
        , 'view': p.view
        , 'sections': S.sections
        , 'route': p.route
        , 'js_files': p.js_files
        , 'data': p
        }));
      });
    })
  });

  S.instance.express.all('/admin', function(req, res){
    return res.redirect('/admin/product/list');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
