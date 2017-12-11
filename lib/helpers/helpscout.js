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
  , FS = require('fs')
  , Mime = require('mime')
;

module.exports = function(S){
  S['host'] = 'https://api.helpscout.net/v1';

  S['SearchOrderConversations'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'key': S.settings.helpscout.key
      //order_slug
      //vendor_order_ids
      //buyer_email
    });

    return Async.waterfall([
      function(cb){
        gb['query'] = [];
        if (a.o.order_slug){
          gb.query.push('body:"' + a.o.order_slug + '"');
          gb.query.push('subject:"' + a.o.order_slug + '"');
          gb.query.push('email:orders+' + a.o.order_slug + '@wanderset.com');
          gb.query.push('email:fulfillment+' + a.o.order_slug + '@wanderset.com');
        }
        if (a.o.buyer_email){
          gb.query.push('email:' + a.o.buyer_email);
        }
        _.each(a.o.vendor_order_ids, function(i){
          gb.query.push('body:"' + i + '"');
          gb.query.push('subject:"' + i + '"');
        });

        gb.query = '(' + gb.query.join(' OR ') + ')';

        Request({
          'url': self.host + '/search/conversations.json'
        , 'method': 'get'
        , 'qs': {
            'query': gb.query
          }
        , 'auth': {
            'user': a.o.key
          , 'password': 'x'
          }
        , 'json': true
        }, function(err, res, json){
          gb['conversations'] = Belt.get(json, 'items');
          gb.conversations = _.each(gb.conversations, function(c){
            c['url'] = 'https://secure.helpscout.net/conversation/' + c.id + '/' + c.number;
          });

          cb(err);
        })
      }
    ], function(err){
      a.cb(err, gb.conversations);
    });
  };

  S['TagAllCustomerThreads'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){

      }
    , function(cb){

      }
    ], function(err){

    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
