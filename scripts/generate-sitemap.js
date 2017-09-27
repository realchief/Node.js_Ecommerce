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
  , Moment = require('moment')
  , CP = require('child_process')
  , OS = require('os')
  , XML = require('xml')
  , Request = require('request')
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': ['package.json', 'environment.json', 'assets.json', 'settings.json', 'config.json']
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = {
  'skip': 0
, 'limit': 500
};

O.host = 'https://wanderset.com';

Spin.start();

Async.waterfall([
  function(cb){
    if (!O.argv.output) return cb(new Error('output is required'));

    GB['server'] = new require(O.__dirname + '/lib/server.js')(O);
    GB.server.on('ready', Belt.cw(cb));
  }
/*, function(cb){
    return GB.server.db.model('product').find({
      'hide': {
        '$ne': true
      }
    , 'sync_hide': {
        '$ne': true
      }
    , 'low_price': {
        '$gt': 0
      }
    , 'slug': {
        '$exists': true
      }
    }, {'slug': 1}, Belt.cs(cb, GB, 'products', 1, 0));
  }*/
, function(cb){
    var cont;

    GB['products'] = [];

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/product/list.json'
      , 'auth': {
          'user': _.keys(O.admin_users)[0]
        , 'pass': _.values(O.admin_users)[0]
        }
      , 'qs': {
          'query': Belt.stringify({
            'hide': {
              '$ne': true
            }
          , 'sync_hide': {
              '$ne': true
            }
          , 'label.us': {
              '$exists': true
            }
          , 'media.0': {
              '$exists': true
            }
          })
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
          GB.products.push(d);
          cb2();
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, function(cb){
    return GB.server.db.model('set').find({
      'hide': {
        '$ne': true
      }
    , 'brand': {
        '$ne': true
      }
    , 'slug': {
        '$exists': true
      }
    }, {'slug': 1}, Belt.cs(cb, GB, 'sets', 1, 0));
  }
, function(cb){
    return GB.server.db.model('set').find({
      'hide': {
        '$ne': true
      }
    , 'brand': true
    , 'slug': {
        '$exists': true
      }
    }, {'slug': 1}, Belt.cs(cb, GB, 'brands', 1, 0));
  }
, function(cb){
    return GB.server.db.model('media').find({
      'hide': {
        '$ne': true
      }
    , 'slug': {
        '$exists': true
      }
    }, {'slug': 1}, Belt.cs(cb, GB, 'media', 1, 0));
  }
, function(cb){
    GB.time = Moment().format('YYYY-MM-DDTHH:mm:ss.SZ');

    var sm = {
      'urlset': [
        {
          '_attr': {'xmlns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        }
      , {
          'url': [
            {
              'loc': O.host
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': O.host + '/brands'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': O.host + '/sets'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': O.host + '/lifestyle'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': O.host + '/products/new'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      ].concat(_.map(GB.sets, function(s){
        return {
          'url': [
            {
              'loc': O.host + '/set/' + encodeURIComponent(s.slug)
            }
          , {
              'lastmod': GB.time
            }
          ]
        };
      })).concat(_.map(GB.brands, function(s){
        return {
          'url': [
            {
              'loc': O.host + '/brand/' + encodeURIComponent(s.slug)
            }
          , {
              'lastmod': GB.time
            }
          ]
        };
      })).concat(_.flatten(_.map(GB.server.categories, function(v, k){
        return [
          {
            'url': [
              {
                'loc': O.host + '/product/category/' + encodeURIComponent(k)
              }
            , {
                'lastmod': GB.time
              }
            ]
          }
        ].concat(_.map(v, function(v2, k2){
          return {
            'url': [
              {
                'loc': O.host + '/product/' + encodeURIComponent(k) + '/' + encodeURIComponent(k2)
              }
            , {
                'lastmod': GB.time
              }
            ]
          };
        }));
      }))).concat(_.flatten(_.map(GB.products, function(s){
        return _.map(s.configurations, function(v, k){
          return {
            'url': [
              {
                'loc': O.host + '/product/' + encodeURIComponent(s.slug) + _.map(v.options, function(v2, k2){
                  return '/' + encodeURIComponent(k2) + '/' + encodeURIComponent(v2.value);
                }).join('')
              }
            , {
                'lastmod': GB.time
              }
            ]
          };
        });
      }))).concat(_.map(GB.media, function(s){
        return {
          'url': [
            {
              'loc': O.host + '/media/' + encodeURIComponent(s.slug)
            }
          , {
              'lastmod': GB.time
            }
          ]
        };
      }))
    };

    var sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n' + XML(sm, {'indent': '  '});

    return FS.writeFile(O.argv.output, sitemap, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
