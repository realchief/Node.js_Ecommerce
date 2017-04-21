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

  S['sections'] = {
    'product': {
      'pages': [
        {
          'title': 'Create New'
        , 'route': '/admin/product/create'
        , 'view': 'admin_product'
        , 'js_files': [
            '/public/js/admin/product_create.js'
          ]
        }
      , {
          'title': 'Search'
        , 'route': '#'
        , 'view': 'admin_product_list'
        , 'js_files': [
            '/public/js/admin/product_create.js'
          ]
        }
      ]
    }
  , 'media': {
      'pages': [
        {
          'title': 'Create New'
        , 'route': '/admin/media/create'
        , 'view': 'admin_media'
        , 'js_files': [
            '/public/js/admin/media_create.js'
          ]
        }
      , {
          'title': 'Search'
        , 'route': '#'
        , 'view': 'admin_media_list'
        , 'js_files': [
            '/public/js/admin/media_create.js'
          ]
        }
      ]
    }
  , 'set': {
      'pages': [
        {
          'title': 'Create New'
        , 'route': '/admin/set/create'
        , 'view': 'admin_set'
        , 'js_files': [
            '/public/js/admin/set_create.js'
          ]
        }
      , {
          'title': 'Search'
        , 'route': '#'
        , 'view': 'admin_set_list'
        , 'js_files': [
            '/public/js/admin/set_create.js'
          ]
        }
      ]
    }
  };

  S.instance.express.all(/^\/admin/, function(req, res, next){
    var user = Auth(req);

    if (!user || !user.name || !user.pass || !_.some(S.settings.admin_users, function(v, k){
      return user.name === k && user.pass === v
    })) {
      res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
      return res.send(401);
    }

    next();
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
        }));
      });
    })
  });

  S.instance.express.all('/admin', function(req, res){
    return res.redirect('/admin/product/create');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
