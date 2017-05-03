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

////////////////////////////////////////////////////////////////////////////////
//// METHODS
////////////////////////////////////////////////////////////////////////////////

  S.instance.express.all('/checkout', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'checkout', {

    }));
  });

  S.instance.express.all('/bag', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'bag', {
      'navbar': [
        {
          'title': 'NEW'
        }
      , {
          'title': 'THE SET'
        }
      , {
          'title': 'BRANDS'
        }
      , {
          'title': 'CATEGORIES'
        }
      , {
          'title': 'LIFESTYLE'
        }
      ]
    }));
  });

  S.instance.express.all('/set', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'set', {
      'navbar': [
        {
          'title': 'NEW'
        }
      , {
          'title': 'THE SET'
        }
      , {
          'title': 'BRANDS'
        }
      , {
          'title': 'CATEGORIES'
        }
      , {
          'title': 'LIFESTYLE'
        }
      ]
    }));
  });

  S.instance.express.all('/outfit', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'outfit', {
      'navbar': [
        {
          'title': 'NEW'
        }
      , {
          'title': 'THE SET'
        }
      , {
          'title': 'BRANDS'
        }
      , {
          'title': 'CATEGORIES'
        }
      , {
          'title': 'LIFESTYLE'
        }
      ]
    }));
  });

  S.instance.express.all('/product', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'product', {
      'navbar': [
        {
          'title': 'NEW'
        }
      , {
          'title': 'THE SET'
        }
      , {
          'title': 'BRANDS'
        }
      , {
          'title': 'CATEGORIES'
        }
      , {
          'title': 'LIFESTYLE'
        }
      ]
    }));
  });

  S.instance.express.all('/', function(req, res){
    return res.redirect('/admin');
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
