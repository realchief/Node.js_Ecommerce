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

  S['fixtures'] = {
    'category': {
      '_id': Belt.uuid()
    , 'name': 'Pants'
    , 'description': 'Pants and legwear'
    , 'subcategories': [
        {
          '_id': Belt.uuid()
        , 'name': 'Jeans'
        }
      , {
          '_id': Belt.uuid()
        , 'name': 'Khakis'
        }
      , {
          '_id': Belt.uuid()
        , 'name': 'Shorts'
        }
      ]
    , 'created_at': new Date()
    , 'updated_at': new Date()
    }
  };

  S.instance.express.all('/fixture/:model/list.json', function(req, res){
    var doc = Belt.get(S.fixtures, req.params.model)
      , count = req.data().count || 20;

    return res.status(200).json({
      'data': _.times(count, function(){ return Belt.copy(doc); })
    });
  });

  S.instance.express.all('/fixture/:model/:id/read.json', function(req, res){
    return res.status(200).json({
      'data': Belt.get(S.fixtures, req.params.model)
    });
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
