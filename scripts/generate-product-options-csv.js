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
    Request({
      'url': O.host + '/cache/product/options.json'
    , 'auth': GB.auth
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB['option_keys'] = _.map(json, function(v, k){
        return {
          'option': k
        };
      });

      GB['options'] = [];
      _.each(json, function(v, k){
        _.each(v, function(v2){
          GB.options.push({
            'option': k
          , 'value': v2
          });
        });
      });

      cb();
    });
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.option_keys_file);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.option_keys, function(v, k){
      cs.write(v);
    });

    cs.end();
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.options_file);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.options, function(v, k){
      cs.write(v);
    });

    cs.end();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
