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
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': ['package.json', 'environment.json', 'assets.json', 'settings.json', 'config.json']
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'query': {
    'hide': {
      '$ne': true
    }
  , 'sync_hide': {
      '$ne': true
    }
  /*, 'low_price': {
      '$gt': 0
    }*/
  , 'slug': {
      '$exists': true
    }
  , 'label.us': {
      '$exists': true
    }
  }
, 'skip': 0
, 'limit': 500
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    if (!O.argv.output) return cb(new Error('output is required'));

    var cont;

    GB['products'] = [];

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
          GB.products.push(d);
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, function(cb){
    GB.time = Moment().format('YYYY-MM-DDTHH:mm:ss.SZ');

    var feed = [
      {
        'channel': [
          {
            'title': 'Wanderset Products'
          }
        , {
            'description': 'Products on wanderset.com'
          }
        , {
            'link': 'https://wanderset.com'
          }
        ].concat(_.map(GB.products, function(s){
          return {
            'item': [
              {
                'id': s.slug
              }
            , {
                'title': s.label.us
              }
            , {
                'description': Belt.get(s, 'description.us') || (s.brands.join(', ') + ' ' + s.label.us)
              }
            , {
                'link': O.host + '/product/' + encodeURIComponent(s.slug)
              }
            ]
          };
        })))
      }
    ];

    var feed = '<?xml version="1.0"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' + XML(xml, {'indent': '  '}) + '\n</rss>';

    return FS.writeFile(O.argv.output, feed, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
