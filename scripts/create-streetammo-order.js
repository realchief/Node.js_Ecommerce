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
externalid: "S1OGDMU5Z",
origin: "wanderset",
comments: "wanderset dropship order #S1OGDMU5Z",
email: "orders@wanderset.com",
phone: "6173000585",
firstname: "Sylvia",
surname: "Zurlo",
address: "223 Powder Point Avenue",
zip: "02332",
city: "Duxbury",
country: "US",
recipientfirstname: "Sylvia",
recipientsurname: "Zurlo",
recipientaddress: "223 Powder Point Avenue",
recipientzip: "02332",
recipientcity: "Duxbury",
recipientcountry: "US",
orderlines: [
{
item_id: 1,
quanity: 1,
productprice: 120,
totalprice: 120,
title: "HIGH CALIBER / THE CLASSIC ENZYME TEE / L / BLACK"
},
{
item_id: 2,
quanity: 1,
productprice: 120,
totalprice: 120,
title: "HIGH CALIBER / SCOUT TEE / L / ASH GRAY"
},
{
item_id: 3,
quanity: 1,
productprice: 50,
totalprice: 50,
title: "STREETAMMO / 2-PACKS URBAN ANKLE / OS / BLACK"
},
{
item_id: 4,
quanity: 1,
productprice: 130,
totalprice: 130,
title: "STREETAMMO / WEATHER SPORT / OS / NAVY"
}
],
total: 420
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
