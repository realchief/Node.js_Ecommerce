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
  , Cheerio = require('cheerio')
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
    'slug': {
      '$in': [
"mister-tee-bitch-please-hoody-gra-rym88zatb", "mister-tee-99-problems-crew-sort-s1uilbcy", "mister-tee-chill-hoody-sort-s1dxo9ycb", "mister-tee-deadline-tee-black-l-hyfafo19w", "mister-tee-99-problems-t-shirt-b1hvxik5z", "mister-tee-amk-tee-black-l-skppqij9b", "mister-tee-chilluminati-2-0-hoody-black-l-hk9xei1qb", "mister-tee-thug-life-skull-tee-black-l-s1-zvojc", "mister-tee-99-problems-bandana-crewneck-black-l-sk-sgjxqz", "mister-tee-99-problems-block-camo-tee-black-l-b18sgjgqb", "mister-tee-shit-is-dope-bucket-hat-black-one-size-b1nlwkxc", "mister-tee-pray-city-hoody-black-l-hyjd0yg5z", "mister-tee-hgh-hoody-charcoal-syarislcb", "mister-tee-dollar-tee-black-skinibx9b", "mister-tee-i-got-enemies-tee-black-3xl-hjp2nhe9w", "mister-tee-gangsta-rap-tee-white-l-skcw6req", "mister-tee-dope-shit-tee-black-l-rybhprx9w", "mister-tee-deadline-crewneck-black-l-hy0lthx9", "mister-tee-shit-is-dope-snapback-blk-silver-one-size-s1pkasgc", "mister-tee-chilluminati-snapback-one-size-bylo6hl9b"
, "mister-tee-99-problems-cap-hksz0hlqb", "mister-tee-99-problems-desert-camo-tee-white-l-bjauasecb", "mister-tee-99-problems-bandana-tee-white-l-bylccblc", "mister-tee-i-got-enemies-hoody-rjjjrrl5b", "mister-tee-thug-life-old-english-tee-white-l-sy8klue5w", "mister-tee-dollar-snapback-green-one-size-bj4mjhlcb", "mister-tee-switch-dope-tee-black-l-r1umi2eq", "mister-tee-thug-life-cities-tee-black-l-h1cls2g9b"
]
    }
  })
, 'skip': 0
, 'limit': 500
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'iterator': function(o, cb){
    console.log('Updating product [' + o._id + ']...');

    Request({
      'url': O.host + '/product/' + o._id + '/update.json'
    , 'auth': GB.auth
    , 'body': {
        'hide': true
      , 'hide_note': 'Requested mister tee hide'
      }
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
