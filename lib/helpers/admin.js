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
;

module.exports = function(S){

  S['models'] = [
    {
      'name': 'product'
    , 'list': {
        'fields': [
          'name'
        , 'label'
        , 'description'
        , 'vendor'
        , 'media'
        ]
      }
    }
  ];

  _.each(S.models, function(v){
    S.instance.express.all('/admin/' + v.name + '/list', function(req, res){
      return res.status(200).type('text/html').end(S.instance.renderView(req, 'admin', {
        'model': v
      , 'operation': 'list'
      , 'title': v.name.toUpperCase() + ' LIST'
      , 'models': S.models
      }));
    });

    S.instance.express.all('/admin/' + v.name + '/create', function(req, res){
      return res.status(200).type('text/html').end(S.instance.renderView(req, 'admin', {
        'model': v
      , 'operation': 'create'
      , 'title': 'CREATE NEW ' + v.name.toUpperCase()
      , 'models': S.models
      }));
    });

    S.instance.express.all('/admin/' + v.name + '/:_id/read', function(req, res){
      return res.status(200).type('text/html').end(S.instance.renderView(req, 'admin', {
        'model': v
      , 'operation': 'read'
      , 'title': 'EDIT ' + v.name.toUpperCase()
      , 'models': S.models
      }));
    });
  });

  S.instance.express.all('/admin', function(req, res){
    return res.redirect('/admin/product/list');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
