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
                       '__dirname': Path.resolve(module.filename + '/../../..')
                     , 'file_priority': ['package.json', 'environment.json', 'credentials.json']
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'mongodb': O.mongodb
, 'collection_name': 'products'
, 'db': 'streetammo'
});

Spin.start();

Async.waterfall([
  function(cb){
    return Mongodb.MongoClient.connect('mongodb://'
    + GB.mongodb.host
    + ':' + GB.mongodb.port
    + '/' + (GB.db || GB.mongodb.db)
    , Belt.cs(cb, GB, 'db', 1, 0));
  }
, function(cb){
    var ocb = _.once(cb);
    return GB.db.collection(GB.collection_name, Belt.cs(ocb, GB, 'collection', 1, 0));
  }
, function(cb){
    var count = 0
      , skip = 279
      , limit = 100;

    return Async.doWhilst(function(next){
      GB.collection.find({}).skip(skip).limit(limit).toArray(function(err, res){
        GB['results'] = res || [];
        skip += limit;

        Async.eachSeries(GB.results, function(e, cb2){
          Async.waterfall([
            function(cb3){
              Request({
                'url': O.host + '/product/create.json'
              , 'method': 'post'
              , 'json': {
                  'name': e.title
                , 'label': {
                    'us': e.name
                  }
                , 'vendors': [
                    'Streetammo'
                  ]
                , 'brands': [
                    e.brand
                  ]
                , 'options': {
                    'size': {
                      'label': {
                        'us': 'size'
                      }
                    , 'values': {
                        'us': e.sizes
                      }
                    }
                  }
                }
              }, function(err, res, json){
                err = err || Belt.get(json, 'error');
                if (err) return cb3(new Error(err));

                console.log(Belt.stringify(json.data));

                GB['doc'] = json.data;

                cb3();
              });
            }
          , function(cb3){
              Request({
                'url': O.host + '/product/' + GB.doc._id + '/stock/create.json'
              , 'method': 'post'
              , 'json': {
                  'vendor': 'streetammo'
                , 'sku': e.url.split('/').pop()
                , 'price': e.usd
                }
              }, function(err, res, json){
                err = err || Belt.get(json, 'error');
                if (err) return cb3(new Error(err));

                console.log(Belt.stringify(json.data));

                GB['doc'] = json.data;

                cb3();
              });
            }
          , function(cb3){
              Request({
                'url': O.host + '/product/' + GB.doc._id + '/media/create.json'
              , 'method': 'post'
              , 'json': {
                  'remote_url': e.image
                }
              }, function(err, res, json){
                err = err || Belt.get(json, 'error');
                if (err) return cb3(new Error(err));

                console.log(Belt.stringify(json.data));

                GB['doc'] = json.data;

                cb3();
              });
            }
          ], Belt.cw(cb2, 0));
        }, Belt.cw(next, 0));
      });
    }, function(){ return _.any(GB.results); }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
