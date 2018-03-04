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
  , Str = require('underscore.string')
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
  'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

O.argv.infile = O.argv.infile || Path.join(O.__dirname, '/resources/assets/categories.csv');

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(O.argv.infile);

    GB['categories'] = {};

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          if (d.category){
            GB['cur_cat'] = Str.trim(d.category.toLowerCase());
            GB.categories[GB.cur_cat] = {};
          }

          if (d.subcategory){
            GB['sub_cat'] = Str.trim(d.subcategory.toLowerCase());
            GB.categories[GB.cur_cat][GB.sub_cat] = {};
          }

          if (d.sub_subcategory){
            d.sub_subcategory = d.sub_subcategory.split(/\s*,\s*/);

            _.each(d.sub_subcategory, function(s){
              s = Str.trim(s.toLowerCase());
              GB.categories[GB.cur_cat][GB.sub_cat][s] = {};
            });
          }
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    GB['flat_categories'] = _.sortBy(_.map(Belt.objFlatten(GB.categories), function(v, k){
      return k.replace(/\./g, ' > ');
    }), function(s){
      return s;
    });

    console.log(Belt.stringify(GB.flat_categories));

    Async.eachSeries(GB.flat_categories, function(e, cb2){
      Request({
        'url': O.host + '/admin/category/create.json'
      , 'method': 'post'
      , 'body': {
          'label': e
        }
      , 'auth': GB.auth
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
