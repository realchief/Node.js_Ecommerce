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
  , CSV = require('fast-csv')
  , Str = require('underscore.string')
  , Crypto = require('crypto')
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
  , 'label.us': {
      '$exists': true
    }
  , 'media.0': {
      '$exists': true
    }
  }
, 'skip': 0
, 'limit': 500
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'google_categories_csv_path': Path.join(O.__dirname, '/resources/assets/google-shopping-categories.csv')
, 'output_path': Path.join(O.__dirname, '/tmp/wanderset-google-shopping-feed.xml')
, 'domain': 'https://wanderset.com'
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(GB.google_categories_csv_path);

    GB.google_categories = {};

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          GB.google_categories[d.wanderset_category] = d.google_category_id;
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    O.argv.output = O.argv.output || GB.output_path;

    if (!O.argv.output) return cb(new Error('output is required'));

    var cont;

    GB['products'] = [];

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/product/list.json'
      , 'auth': GB.auth
      , 'qs': {
          'query': Belt.stringify(GB.query)
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
    GB.time = Moment().format('YYYY-MM-DDTHH:mm:ss.SZ');

    GB.items = [];

    _.each(GB.products, function(p){
      var brand = (p.brands || []).join(', ') || '';
      brand += brand ? ' ' : '';

      var cat = Belt.get(p, 'categories.0') || Belt.get(p, 'auto_category') || 'clothing';

      var slug = p.slug || p._id;

      _.each(p.configurations, function(v, k){
        if (!v.price) return;

        var url = GB.domain + '/product/' + slug
                + (!_.size(v.options) ? ''
                   :  _.map(v.options, function(v2, k2){
                        return '/' + encodeURIComponent(k2) + '/' + encodeURIComponent(v2.value);
                      }).join('')
                  );

        var item = {
          'id': v.sku
        , 'title': Str.titleize(brand + p.label.us)
        , 'description': Belt.get(p, 'description.us')
                      || (_.map(v.options, function(v2, k2){
                           return k2 + ': ' + v2.value;
                         }) || []).join(', ')
                      || cat
        , 'link': url
        , 'image_link': Belt.get(p, 'media.0.url') || Belt.get(p, 'media.0.remote_url')
        , 'additional_image_link': Belt.get(p, 'media.1.url') || Belt.get(p, 'media.1.remote_url')
        , 'availability': v.available_quantity > 0 ? 'in stock' : 'out of stock'
        , 'price': v.price.toFixed(2) + ' USD'
        , 'google_product_category': GB.google_categories[cat]
        , 'product_type': cat
        //, 'brand': Str.titleize(brand) || 'Wanderset'
        //, 'gtin': 'no'
        , 'identifier_exists': 'no'
        , 'condition': 'new'
        , 'adult': 'no'
        , 'age_group': 'adult'
        , 'gender': 'male'
        , 'color': Belt.get(_.find(v.options, function(v2, k2){
                    return k2.match(/color/i);
                  }), 'value.toLowerCase()') || 'one color'
        , 'size': Belt.get(_.find(v.options, function(v2, k2){
                    return k2.match(/size/i);
                  }), 'value.toLowerCase()') || 'one size'
        , 'material': Belt.get(_.find(v.options, function(v2, k2){
                    return k2.match(/material/i);
                  }), 'value.toLowerCase()')
        , 'pattern': Belt.get(_.find(v.options, function(v2, k2){
                    return k2.match(/pattern/i);
                  }), 'value')
        , 'item_group_id': p._id
        , 'adwords_redirect': url + '?utm_source=google_adwords'
        };

        item = Belt.objDefalse(item);

        GB.items.push(item);
      });
    });

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
            'link': GB.domain
          }
        ].concat(_.map(GB.items, function(s){
          return {
            'item': _.map(s, function(v, k){
              var o = {};
              o['g:' + k] = v;
              return o;
            })
          };
        }))
      }
    ];

    var feed = '<?xml version="1.0"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n' + XML(feed, {'indent': '  '}) + '\n</rss>';

    return FS.writeFile(O.argv.output, feed, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
