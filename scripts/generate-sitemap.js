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

var GB = {
  'skip': 0
, 'limit': 500
};

GB.host = 'https://wanderset.com';

Spin.start();

Async.waterfall([
  function(cb){
    if (!O.argv.output) return cb(new Error('output is required'));

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
      });
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, function(cb){
    if (GB.products.length < 1000) return cb(new Error('Fewer than 1000 products'));

    Request({
      'url': O.host + '/cache/set/setmembers.json'
    , 'auth': {
        'user': _.keys(O.admin_users)[0]
      , 'pass': _.values(O.admin_users)[0]
      }
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB['sets'] = json;

      cb();
    });
  }
, function(cb){
    Request({
      'url': O.host + '/cache/set/brands.json'
    , 'auth': {
        'user': _.keys(O.admin_users)[0]
      , 'pass': _.values(O.admin_users)[0]
      }
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB['brands'] = json;

      cb();
    });
  }
, function(cb){
    Request({
      'url': O.host + '/cache/product/categories.json'
    , 'auth': {
        'user': _.keys(O.admin_users)[0]
      , 'pass': _.values(O.admin_users)[0]
      }
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB['categories'] = json;

      cb();
    });
  }
, function(cb){
    GB.skip = 0;

    var cont;

    GB['media'] = [];

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/media/list.json'
      , 'auth': {
          'user': _.keys(O.admin_users)[0]
        , 'pass': _.values(O.admin_users)[0]
        }
      , 'qs': {
          'query': Belt.stringify({
            'hide': {
              '$ne': true
            }
          , 'slug': {
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
          GB.media.push(d);
          cb2();
        }, Belt.cw(next, 0));
      });
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, function(cb){
    Request({
      'url': O.host + '/cache/set/categories.json'
    , 'auth': GB.auth
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      GB['brand_categories'] = [];

      _.each(GB.brands, function(s, k){
        var c = json[s._id];
        k = s.slug;

        _.each(c, function(v1, c1){
          GB.brand_categories.push('/brand/' + encodeURIComponent(k) + '/' + encodeURIComponent(c1));

          _.each(v1, function(v2, c2){
            GB.brand_categories.push('/brand/' + encodeURIComponent(k) + '/' + encodeURIComponent(c1) + '/' + encodeURIComponent(c2));

            _.each(v2, function(v3, c3){
              GB.brand_categories.push('/brand/' + encodeURIComponent(k) + '/' + encodeURIComponent(c1) + '/' + encodeURIComponent(c2));
            });
          });
        });
      });

      GB.brand_categories = _.uniq(GB.brand_categories);

      cb();
    });
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
              'loc': GB.host
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': GB.host + '/brands'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': GB.host + '/sets'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': GB.host + '/lifestyle'
            }
          , {
              'lastmod': GB.time
            }
          ]
        }
      , {
          'url': [
            {
              'loc': GB.host + '/products/new'
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
              'loc': GB.host + '/set/' + encodeURIComponent(s.slug)
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
              'loc': GB.host + '/brand/' + encodeURIComponent(s.slug)
            }
          , {
              'lastmod': GB.time
            }
          ]
        };
      })).concat(_.map(GB.brand_categories, function(s){
        return {
          'url': [
            {
              'loc': GB.host + s
            }
          , {
              'lastmod': GB.time
            }
          ]
        };
      })).concat(_.flatten(_.map(GB.categories, function(v, k){
        return [
          {
            'url': [
              {
                'loc': GB.host + '/product/category/' + encodeURIComponent(k)
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
                'loc': GB.host + '/product/' + encodeURIComponent(k) + '/' + encodeURIComponent(k2)
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
                'loc': GB.host + '/product/' + encodeURIComponent(s.slug) + _.map(v.options, function(v2, k2){
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
              'loc': GB.host + '/media/' + encodeURIComponent(s.slug)
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
