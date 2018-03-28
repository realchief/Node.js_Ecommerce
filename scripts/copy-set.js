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
  , Mongodb = require('mongodb')
  , Request = require('request')
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
  'mongodb': O.mongodb
, 'host': 'wanderset.com'
, 'db': 'staging_wanderset'
, 'from_set': {
    'name': 'Chance the Rapper'
  }
, 'to_set': {
    'name': 'homepage'
  }
, 'copy_media': true
, 'copy_products': false
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    return Mongodb.MongoClient.connect('mongodb://'
    + (GB.host || GB.mongodb.host)
    + ':' + GB.mongodb.port
    + '/' + (GB.db || GB.mongodb.db)
    , Belt.cs(cb, GB, 'db', 1, 0));
  }
, function(cb){
    var ocb = _.once(cb);
    return GB.db.collection('sets', Belt.cs(ocb, GB, 'sets', 1, 0));
  }
, function(cb){
    GB.sets.find(GB.from_set).toArray(Belt.cs(cb, GB, 'from_set', 1, '0', 0));
  }
, function(cb){
    GB.sets.find(GB.to_set).toArray(Belt.cs(cb, GB, 'to_set', 1, '0', 0));
  }
, function(cb){
    Async.eachSeries([GB.to_set], function(e, cb2){
      var products = (GB.to_set.products || []).concat(GB.from_set.products || [])
        , media = (GB.to_set.media || []).concat(GB.from_set.media || []);

      products = _.uniq(products);
      media = _.uniq(media);

      Request({
        'url': O.host + '/set/' + GB.to_set._id + '/update.json'
      , 'method': 'post'
      , 'auth': GB.auth
      , 'json': {
        // 'products': products
          'media': media
        }
      }, function(err, res, json){
        console.log(Belt.stringify(json));
        cb2();
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
