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
externalid: "BYIEJASZ",
origin: "wanderset",
comments: "wanderset dropship order #BYIEJASZ",
email: "orders@wanderset.com",
phone: "6173000585",
firstname: "Garrett",
surname: "Gaston",
address: "11 Marbella",
zip: "92673",
city: "San Clemente",
country: "US",
recipientfirstname: "Garrett",
recipientsurname: "Gaston",
recipientaddress: "1769 East Walnut Street , Apartment #4011",
recipientzip: "91106",
recipientcity: "Pasadena",
recipientcountry: "US",
orderlines: [
{
item_id: 1,
quantity: 1,
productprice: 400,
totalprice: 400,
title: "PUMA / ARCHIVE T7 TRACK PANTS / L / OLIVE"
}
],
total: 400
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
      console.log(json);
      console.log(res);
      console.log(Belt.stringify(res));
      console.log(_.keys(res));

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
