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
  , OS = require('os')
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

  })
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

    grams = _.map(grams, function(g){
      return g.join(' ');
    });

    grams = _.flatten(grams);

    var mgrams = _.chain(grams)
                  .filter(function(g){
                    return GB.grams[g];
                   })
                  .map(function(g){
                    return GB.grams[g];
                   })
                  .value()
    ;

    if (!_.any(mgrams)) return cb();

    var update = {};

    var hgrams = _.filter(mgrams, function(m){
      return m.hide;
    });

    if (_.any(hgrams) && !o.show){
      update['hide'] = true;
      update['hide_note'] = 'grams check: ' + _.pluck(hgrams, 'gram').join(', ');
    }

    var match = _.max(mgrams, function(m){
      return (m.category_1 ? 1 : 0)
           + (m.category_2 ? 1 : 0)
           + (m.category_3 ? 1 : 0);
    });

    if (match && !Belt.get(o, 'categories.0')){
      match = Belt.arrayDefalse([
        match.category_1
      , match.category_2
      , match.category_3
      ]).join(' > ');

      if (match) update['auto_category'] = match;
    }

    if (!_.size(update)) return cb();

    update['skip_media_processing'] = true;

    Request({
      'url': O.host + '/product/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': update
    , 'json': true
    , 'method': 'post'
    }, function(err, res, json){
      //console.log(Belt.stringify(json));

      console.log(o.slug + ': ' + update.hide_note);

      cb();
    });
  }
});

O.argv.infile = O.argv.infile || Path.join(O.__dirname, '/resources/assets/category-grams.csv');

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(O.argv.infile);

    GB['grams'] = {};

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          if (!d.category_1 && !d.category_2 && !d.category_3 && !d.hide) return;

          GB.grams[d.gram] = _.extend({
            'term': d.gram
          , 'active': true
          , 'product_hide': d.hide ? true : false
          }, d.category_1 || d.category_2 || d.category_3 ? {
            'product_category': Belt.arrayDefalse([d.category_1, d.category_2, d.category_3]).join(' > ')
          } : {});

          GB.grams[d.term] = d;
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    Async.eachLimit(_.values(GB.grams), OS.cpus().length, function(g, cb2){
      Request({
        'url': O.host + '/admin/inventory_rule/create.json'
      , 'auth': GB.auth
      , 'body': g
      , 'method': 'post'
      , 'json': true
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
