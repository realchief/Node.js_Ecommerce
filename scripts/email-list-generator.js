#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Str = require('underscore.string')
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
  'existing_list_path': _.template('/home/ben/Downloads/KL/<%= index %>.csv')
, 'existing_header_list_path': '/home/ben/Downloads/KL/head.csv'
, 'output_list_path_template': _.template('/home/ben/Downloads/KL/by-brand/<%= brand %>.csv')
, 'output_lists': {}
, 'count': 0
, 'existing_lists': _.times(19, function(i){
    return i + 1;
  }).concat([
    'a'
  , 'b'
  , 'c'
  , 'd'
  ])
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(GB.existing_header_list_path);

    CSV.fromStream(fs, {
          'headers': false
        , 'strictColumnHandling': false
        , 'discardUnmappedColumns': true
        , 'ignoreEmpty': true
        , 'quote': '"'
        , 'escape': '"'
        })
       .on('data', function(d){
          GB['headers'] = d;
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    return Async.eachSeries(GB.existing_lists, function(e, cb2){
      var ocb = _.once(cb2);

      var fs = FS.createReadStream(GB.existing_list_path({
        'index': e
      }));

      CSV.fromStream(fs, {
            'headers': false
          , 'strictColumnHandling': false
          , 'discardUnmappedColumns': true
          , 'ignoreEmpty': true
          , 'quote': '"'
          , 'escape': '"'
          })
         .on('data', function(d){
            try {
              d = _.object(GB.headers, d);
            } catch (e) {
              return;
            }

            if (!d.Brand) return;

            var brand = d.Brand.toLowerCase().replace(/\W/g, '');

            if (!GB.output_lists[brand]){
              GB.output_lists[brand] = {
                'cs': CSV.createWriteStream({
                        'headers': true
                      , 'strictColumnHandling': false
                      , 'discardUnmappedColumns': true
                      , 'quote': '"'
                      , 'escape': '"'
                      , 'ignoreEmpty': true
                      })
              , 'fs': FS.createWriteStream(GB.output_list_path_template({
                        'brand': brand
                      }), {
                        'flags': !FS.existsSync(GB.output_list_path_template({
                                   'brand': brand
                                 })) ? 'w' : 'r+'
                      })
              };

              GB.output_lists[brand].fs.on('finish', Belt.np);

              GB.output_lists[brand].cs.pipe(GB.output_lists[brand].fs);
            }

            console.log('Writing to "' + brand + '" [' + (++GB.count) + '] [' + e + ']...');

            GB.output_lists[brand].cs.write(d);
          })
         .on('error', function(err){
            console.log(err);
            ocb();
          })
         .on('data-invalid', function(err){
            console.log('invalid');
            ocb();
          })
         .on('end', Belt.cw(ocb));
    }, Belt.cw(cb));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  //return process.exit(err ? 1 : 0);
});
