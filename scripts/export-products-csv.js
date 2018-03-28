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
  , CSV = require('fast-csv')
  , CP = require('child_process')
  , OS = require('os')
  , Mongodb = require('mongodb')
  , Moment = require('moment')
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
  'concurrency': OS.cpus().length
, 'host': O.domain
, 'count': 0
, 'fields': {}
, 'db': O.mongodb.db
, 'collection': 'products'
});

Spin.start();

Async.waterfall([
  function(cb){
    if (!GB.db) return cb(new Error('db is required'));
    if (!GB.collection) return cb(new Error('collection is required'));
    if (!GB.host) return cb(new Error('host is required'));
    if (!GB.csv_path) return cb(new Error('csv_path is required'));

    return Mongodb.MongoClient.connect('mongodb://'
    + GB.host
    + '/' + GB.db
    , Belt.cs(cb, GB, 'db', 1, 0));
  }
, function(cb){
    return GB.db.collection(GB.collection, Belt.cs(cb, GB, 'collection', 1, 0));
  }
, function(cb){
    var ocb = _.once(cb);

    var output = FS.createWriteStream(GB.csv_path)
      , csv = CSV.createWriteStream({'headers': true, 'quoteHeaders': true, 'quoteColumns': true});

    output.on('finish', Belt.cw(ocb, 0));
    csv.pipe(output);

    var count = 0
      , limit = 500;

    return Async.doWhilst(function(next){
      return GB.collection.find({

      }).skip(count).limit(limit).toArray(function(err, docs){
        if (err) return next(err);

        _.each(docs || [], function(v){
          v = Belt.objFlatten(v);

          GB.count++;

          return csv.write(v);
        });

        count += limit;

        GB.results = docs;

        return next(err);
      });
    }, function(){ return _.any(GB.results); }, function(err){
      if (err) ocb(err);
      csv.end();
      Log.info('TOTAL: ' + GB.count);
    });
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
