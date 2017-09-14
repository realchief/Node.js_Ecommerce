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
externalid: "RJQOYG8CB",
origin: "wanderset",
comments: "wanderset dropship order #RJQOYG8CB",
email: "orders@wanderset.com",
phone: "6173000585",
firstname: "carissa",
surname: "rossi",
address: "50 Stanhope St., Apt. 3L",
zip: "11221",
city: "BROOKLYN",
country: "US",
recipientfirstname: "Carissa",
recipientsurname: "Rossi",
recipientaddress: "10 W. 33rd St. Suite 418",
recipientzip: "10001",
recipientcity: "New York",
recipientcountry: "US",
orderlines: [
{
item_id: 1,
quanity: 1,
productprice: 225,
totalprice: 225,
title: "HIGH CALIBER / THE RAW EDGE HOODIE / S / MOSS"
}
],
total: 225
  }
, 'iterator': function(o, cb){
    Request({
      'url': 'https://www.streetammo.dk/api/rest/ordercreate'
    , 'method': 'post'
    , 'auth': {
        'user': o.custom_sync.details.auth.user
      , 'pass': o.custom_sync.details.auth.password
      }
    , 'body': GB.order
    , 'json': true
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
