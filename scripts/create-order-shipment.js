#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Util = require('util')
  , Winston = require('winston')
  , Events = require('events')
  , Spinner = require('its-thinking')
  , CP = require('child_process')
  , Request = require('request')
  , Assert = require('assert')
  , CSV = require('fast-csv')
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'assets.json'
                       , 'settings.json'
                       , 'environment.json'
                       , 'config.json'
                       , 'credentials.json'
                       , 'users.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'query': {
    'slug': 'S1U6LBYIB'
  }
, 'shipment': {
    'created_at': new Date()
  , 'id': '1Z8R407F6793306470'
  , 'carrier': 'UPS'
  , 'tracking_number':'1Z8R407F6793306470'
  , 'tracking_url': 'https://wwwapps.ups.com/WebTracking/processRequest?tracknum=1Z8R407F6793306470'
  , 'products': [
      '59c1c0bdbc5389008a377964'
    ]
  , 'status': 'in transit'
  , 'sent_shipped_email': false
  }
, 'skip': 0
, 'limit': 1
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'order'
, 'iterator': function(o, cb){
    console.log('Updating ' + GB.model + ' [' + o._id + ']...');

    Request({
      'url': O.host + '/admin/' + GB.model + '/' + o.slug + '/shipment/create.json'
    , 'auth': GB.auth
    , 'body': {
        'shipment': GB.shipment
      }
    , 'json': true
    , 'method': 'post'
    }, Belt.cw(cb));
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var cont;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/' + GB.model + '/list.json'
      , 'auth': GB.auth
      , 'qs': {
          'query': GB.query
        , 'skip': GB.skip
        , 'limit': GB.limit
        }
      , 'method': 'get'
      , 'json': true
      }, function(err, res, json){
        cont = _.any(Belt.get(json, 'data')) ? true : false;
        GB.skip += GB.limit;
        console.log(GB.skip);

        Async.eachLimit(Belt.get(json, 'data') || [], 6, function(d, cb2){
          GB.iterator(d, cb2);
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
