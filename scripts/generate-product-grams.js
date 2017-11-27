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
  , Natural = require('natural')
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

  })
, 'grams': {}
, 'skip': 0
, 'limit': 500
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'manual_additions': [
    {
      'gram': 'hypland'
    , 'count': 1
    , 'category_1': ''
    , 'category_2': ''
    , 'category_3': ''
    , 'hide': 'x'
    }
  ]
, 'outfile': Path.join(O.__dirname, '/resources/assets/category-grams.csv')
, 'iterator': function(o, cb){
    var slug = _.map(Belt.arrayDefalse([
                o.brands.join(' ')
              , Belt.get(o, 'label.us')
              , Belt.get(o, 'source.record.product_type')
              , Belt.get(o, 'source.record.tags')
              , Belt.get(o, 'source.record.categories')
              ]), function(k){
                return Belt.cast(k, 'string');
              }).join(' ').toLowerCase().replace(/\W+/g, ' ')
      , grams = [];

    _.times(3, function(i){
      grams = grams.concat(Natural.NGrams.ngrams(slug, i + 1));
    });

    _.each(grams, function(g){
      g = g.join(' ');
      GB.grams[g] = {
        'gram': g
      , 'count': (Belt.get(GB.grams[g], 'count') || 0) + 1
      , 'category_1': ''
      , 'category_2': ''
      , 'category_3': ''
      , 'hide': ''
      };
    });

    cb();
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    if (!O.argv.infile) return cb();

    var fs = FS.createReadStream(O.argv.infile);

    GB.old_grams = {};

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          if (!d.category_1 && !d.category_2 && !d.category_3 && !d.hide) return;

          GB.old_grams[d.gram] = d;
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    var cont;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/product/list.json'
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
, function(cb){
    if (!O.argv.infile);

    _.extend(GB.grams, GB.old_grams);

    cb();
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.outfile);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.grams, function(v, k){
      cs.write(v);
    });

    _.each(GB.manual_additions, function(v){
      cs.write(v);
    });

    cs.end();
  }
], function(err){
  console.log(GB.grams)

  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
