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
, 'skip': 0
, 'limit': 500
, 'cat_count': 0
, 'hide_count': 0
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
    });

    grams = _.flatten(grams);

    var mgrams = _.filter(GB.grams, function(g){
          return _.some(grams, function(g2){
            return g2 === g.gram;
          });
        })
    ;

    if (!_.any(mgrams)) return cb();

    var update = {};

    if (_.some(mgrams, function(m){
      return m.hide;
    })){
      update['sync_hide'] = true;
    }

    var match = _.max(mgrams, function(m){
      return (m.category_1 ? 1 : 0)
           + (m.category_2 ? 1 : 0)
           + (m.category_3 ? 1 : 0);
    });

    if (match){
      match = Belt.arrayDefalse([
        match.category_1
      , match.category_2
      , match.category_3
      ]).join(' > ');

      if (match) update['auto_category'] = match;
    }

    if (!_.size(update)) return cb();

    Request({
      'url': O.host + '/product/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': update
    , 'json': true
    , 'method': 'post'
    }, function(err, res, json){
      console.log(Belt.stringify(json));

      cb();
    });
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(O.argv.infile);

    GB.grams = [];

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          if (!d.category_1 && !d.category_2 && !d.category_3 && !d.hide) return;

          GB.grams.push(d);
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
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
