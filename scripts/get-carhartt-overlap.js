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
  , CSV = require('fast-csv')
  , Natural = require('natural')
  , Diacritics = require('diacritics')
  , Stopwords = require('stopwords')
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
  'product_queries': {
    'carhartt': {
      'brands': {
        '$regex': 'carhartt'
      , '$options': 'i'
      }
    }
  }
, 'skip': 0
, 'limit': 1000
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'product_lists': {

  }
, 'products': [

  ]
, 'carhartt_csv_path': '/home/ben/Downloads/carhartt_products.csv'
, 'carhartt_feed_csv_path': '/home/ben/Downloads/streetammo_products.csv'
});

Spin.start();

Async.waterfall([
  function(cb){
    Async.eachSeries(_.keys(GB.product_queries), function(q, cb2){

      GB['product_lists'][q] = [];

      var cont;

      GB.skip = 0;
      GB.limit = 1000;

      Async.doWhilst(function(next){
        Request({
          'url': O.host + '/product/list.json'
        , 'auth': GB.auth
        , 'qs': {
            'query': GB.product_queries[q]
          , 'skip': GB.skip
          , 'limit': GB.limit
          }
        , 'method': 'get'
        , 'json': true
        }, function(err, res, json){
          cont = _.any(Belt.get(json, 'data')) ? true : false;
          GB.skip += GB.limit;

          _.each(Belt.get(json, 'data') || [], function(d){
            d = _.pick(d, [
              'name'
            , 'label'
            , 'brands'
            , 'slug'
            , 'source'
            , '_id'
            ]);

            d.label = _.reject(Diacritics.remove([
              Belt.get(d, 'source.record.brand') || Belt.get(d, 'source.record.vendor')
            , Belt.get(d, 'source.record.title')
            ].join('').toLowerCase()).replace(/\W+/g, ' ').split(/\s/), function(w){
              return _.some(Stopwords.english, function(s){ return s === w; });
            }).join('');

            GB.product_lists[q].push(d);

            console.log(d.label);
          });

          console.log(GB.product_lists[q].length);

          next();
        })
      }, function(){ return cont; }, Belt.cw(cb2, 0));

    }, Belt.cw(cb, 0));
  }
, function(cb){
    _.each(GB.product_lists.active, function(v, k){
      var msa = _.min(GB.product_lists.streetammo, function(v2){
        return Natural.LevenshteinDistance(v.label, v2.label);
      });

      var p = _.extend({
        'active_id': v._id
      , 'active_url': 'https://wanderset.com/' + v.slug
      , 'active_title': v.source.record.title
      , 'active_brand': v.source.record.vendor
      , 'streetammo_id': msa._id
      , 'streetammo_url': 'https://wanderset.com/' + msa.slug
      , 'streetammo_title': msa.source.record.title
      , 'streetammo_brand': msa.source.record.brand
      , 'ld': Natural.LevenshteinDistance(v.label, msa.label)
      });

      console.log(p);

      GB.products.push(p);
    });

    cb();
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.active_csv_path);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.products, function(v, k){
      cs.write(v);
    });

    cs.end();
  }
, function(cb){
    GB.products = [];

    _.each(GB.product_lists.streetammo, function(v, k){
      var msa = _.min(GB.product_lists.active, function(v2){
        return Natural.LevenshteinDistance(v.label, v2.label);
      });

      var p = _.extend({
        'streetammo_id': v._id
      , 'streetammo_url': 'https://wanderset.com/' + v.slug
      , 'streetammo_title': v.source.record.title
      , 'streetammo_brand': v.source.record.brand
      , 'active_id': msa._id
      , 'active_url': 'https://wanderset.com/' + msa.slug
      , 'active_title': msa.source.record.title
      , 'active_brand': msa.source.record.vendor
      , 'ld': Natural.LevenshteinDistance(v.label, msa.label)
      });

      console.log(p);

      GB.products.push(p);
    });

    cb();
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.streetammo_csv_path);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.products, function(v, k){
      cs.write(v);
    });

    cs.end();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
