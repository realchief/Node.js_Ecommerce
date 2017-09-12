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
                       , 'environment.json'
                       , 'settings.json'
                       , 'config.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'query': Belt.stringify({
    'custom_sync.strategy': 'streetammo'
  })
, 'skip': 0
, 'limit': 1
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'vendor'
, 'order': {
externalid: "SYEVH9XQZ",
origin: "wanderset",
comments: "wanderset dropship order #SYEVH9XQZ",
email: "orders@wanderset.com",
phone: "6173000585",
firstname: "clinton ",
surname: "sparks",
address: "20873, Bridlewood Drive",
zip: "91384",
city: "Castaic",
country: "US",
recipientfirstname: "clinton ",
recipientsurname: "sparks",
recipientaddress: "20873, Bridlewood Drive",
recipientzip: "91384",
recipientcity: "Castaic",
recipientcountry: "US",
orderlines: [
{
item_id: 1,
quanity: 1,
productprice: 400,
totalprice: 400,
title: "ADIDAS ORIGINALS / X BY O LS TEE / L / BLACK"
},
{
item_id: 2,
quanity: 1,
productprice: 500,
totalprice: 500,
title: "ADIDAS ORIGINALS / TREFOIL CREW / L / MGREYH/BLACK"
}
],
total: 900
  }
, 'iterator': function(o, cb){
    Request({
      'url': 'https://www.streetammo.dk/api/rest/ordercreate'
    , 'method': 'post'
    , 'auth': {
        'user': o.custom_sync.details.auth.user
      , 'pass': o.custom_sync.details.auth.password
      }
    }, function(err, res, json){
      console.log(err);
      console.log(Belt.stringify(json));

      cb();
    });
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var cont;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/admin/' + GB.model + '/list.json'
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
