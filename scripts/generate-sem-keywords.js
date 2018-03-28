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
  , Str = require('underscore.string')
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
    'hide': {
      '$ne': true
    }
  , 'sync_hide': {
      '$ne': true
    }
  , 'low_price': {
      '$gt': 0
    }
  })
, 'campaign': 'text'
, 'ad_group': 'primary'
, 'keyword_type': 'Broad'
, 'keywords': {}
, 'brands': {}
, 'negative_regex': new RegExp('(' + [
    'nike'
  , 'asics'
  , 'champion'
  , 'fila'
  , 'lacoste'
  , 'levi'
  , 'north.*face'
  , 'puma'
  , 'reebok'
  , 'vans'
  ].join('|') +')', 'i')
, 'skip': 0
, 'limit': 500
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'product_iterator': function(o, cb){
    var slug = _.map(Belt.arrayDefalse([
                o.brands.join(' ')
              , Belt.get(o, 'label.us')
              ]), function(k){
                return Belt.cast(k, 'string');
              }).join(' ')
      , grams = [];

    GB.keywords[slug.toLowerCase()] = {
      'keyword': slug.toLowerCase()
    , 'label': Str.titleize(slug)
    , 'url': O.host + '/product/' + o.slug
    };

    cb();
  }
});

Spin.start();

Async.waterfall([
/*  function(cb){
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
          GB.product_iterator(d, cb2);
        }, Belt.cw(next, 0));
      });
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, */function(cb){
    Request({
      'url': O.host + '/cache/set/brands.json'
    , 'auth': GB.auth
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      _.each(json, function(s){
        GB.brands[s.slug] = {
          'prefix': s.name.toLowerCase()
        , 'name': s.name
        , '_id': s._id
        , 'keywords': {}
        };
      });

      cb();
    });
  }
, function(cb){
    Request({
      'url': O.host + '/cache/set/categories.json'
    , 'auth': GB.auth
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      _.each(GB.brands, function(s, k){
        s.keywords[s.prefix] = {
          'keyword': s.prefix
        , 'label': Str.titleize(s.name)
        , 'url': O.host + '/brand/' + encodeURIComponent(k)
        };

        var c = json[s._id];

        _.each(c, function(v1, c1){
          s.keywords[s.prefix + ' ' + c1] = {
            'keyword': s.prefix + ' ' + c1
          , 'label': Str.titleize(s.name + ' ' + c1)
          , 'url': O.host + '/brand/' + encodeURIComponent(k) + '/' + encodeURIComponent(c1)
          };

          _.each(v1, function(v2, c2){
            s.keywords[s.prefix + ' ' + c2] = {
              'keyword': s.prefix + ' ' + c2
            , 'label': Str.titleize(s.name + ' ' + c2)
            , 'url': O.host + '/brand/' + encodeURIComponent(k) + '/' + encodeURIComponent(c1) + '/' + encodeURIComponent(c2)
            };

            _.each(v2, function(v3, c3){
              s.keywords[s.prefix + ' ' + c3 + ' ' + c2] = {
                'keyword': s.prefix + ' ' + c3 + ' ' + c2
              , 'label': Str.titleize(s.name + ' ' + c3 + ' ' + c2)
              , 'url': O.host + '/brand/' + encodeURIComponent(k) + '/' + encodeURIComponent(c1) + '/' + encodeURIComponent(c2)
              };
            });
          });
        });
      });

      _.each(GB.brands, function(v){
        _.extend(GB.keywords, v.keywords);
      });

      cb();
    });
  }
, function(cb){
    var cs = CSV.createWriteStream({
               'headers': true
             })
      , fs = FS.createWriteStream(GB.outfile);

    fs.on('finish', Belt.cw(cb));

    cs.pipe(fs);

    _.each(GB.keywords, function(v2, k){
      var v = {
        'Campaign': GB.campaign
      , 'Ad Group': GB.ad_group
      , 'Keyword': v2.keyword
      , 'Type': GB.keyword_type
      , 'Headline 1': Str.wrap(v2.label, {'width': 30}).split('\n')[0].split('').slice(0, 30).join('')
      , 'Description': Str.wrap(v2.label, {'width': 80}).split('\n')[0].split('').slice(0, 80).join('')
      , 'Final URL': v2.url
      };

      var pDesc = 'Huge selection of ';
      if (v.Description.length < (80 - pDesc.length)){
        v.Description = pDesc + v.Description;
      } else {
        pDesc = 'Shop ';
        if (v.Description.length < (80 - pDesc.length)){
          v.Description = pDesc + v.Description;
        }
      }

      var uLines = Str.wrap(v2.keyword, {'width': 15}).split('\n');

      v['Path 1'] = uLines[0].split('').slice(0, 15).join('');
      if (uLines[1]){
        v['Path 2'] = uLines[1].split('').slice(0, 15).join('');
      } else {
        v['Path 2'] = '';
      }

      v = _.pick(v, [
        'Campaign'
      , 'Ad Group'
      , 'Type'
      , 'Keyword'
      , 'Final URL'
      ]);

      if (v.Keyword.match(GB.negative_regex)) return;

      cs.write(v);
    });

    cs.end();
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
