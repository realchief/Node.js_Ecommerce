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
, 'db': 'wanderset'
, 'brand_regex': /bow3ry/i
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
    return GB.db.collection('products', Belt.cs(ocb, GB, 'products', 1, 0));
  }
, function(cb){
    var ocb = _.once(cb);
    return GB.db.collection('sets', Belt.cs(ocb, GB, 'sets', 1, 0));
  }
, function(cb){
    var count = 0
      , skip = 0
      , limit = 100;

    GB['brands'] = {};

    return Async.doWhilst(function(next){
      GB.products.find({}).skip(skip).limit(limit).toArray(function(err, res){
        GB['results'] = res || [];
        skip += limit;

        _.each(GB.results, function(r){
          _.each(r.brands, function(b){
            if (GB.brand_regex && !b.match(GB.brand_regex)) return;

            GB.brands[b] = GB.brands[b] || [];
            GB.brands[b].push(Belt.copy(r));
          });
        });

        next();
      });
    }, function(){ return _.any(GB.results); }, Belt.cw(cb, 0));
  }
, function(cb){
    var count = 0
      , skip = 0
      , limit = 100;

    GB['sets_list'] = [];

    return Async.doWhilst(function(next){
      GB.sets.find({}).skip(skip).limit(limit).toArray(function(err, res){
        GB['results'] = res || [];
        skip += limit;

        GB.sets_list = GB.sets_list.concat(GB.results);

        next();
      });
    }, function(){ return _.any(GB.results); }, Belt.cw(cb, 0));
  }
, function(cb){
    Async.eachSeries(_.keys(GB.brands), function(e, cb2){
      var set = _.find(GB.sets_list, function(s){
        return s.name.toLowerCase().includes(e.toLowerCase());
      });

      var products = _.sample(_.pluck(GB.brands[e], '_id'), 40);

      if (set) products = set.products.concat(products);

      products = _.uniq(products);

      if (set){
        Request({
          'url': O.host + '/set/' + set._id + '/update.json'
        , 'method': 'post'
        , 'auth': GB.auth
        , 'json': {
            'products': products
          , 'brand': true
          }
        }, function(err, res, json){
          console.log(Belt.stringify(json));
          cb2();
        });
      } else {
        Request({
          'url': O.host + '/set/create.json'
        , 'method': 'post'
        , 'auth': GB.auth
        , 'json': {
            'name': e
          , 'label': {
              'us': e
            }
          , 'products': products
          , 'brand': true
          }
        }, function(err, res, json){
          console.log(Belt.stringify(json));
          cb2();
        });
      }
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
