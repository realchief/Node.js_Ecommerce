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
, 'output_path': Path.join(O.__dirname, '/tmp/wanderset-facebook-shopping-feed.xml')
, 'brand_output_path_template': _.template(Path.join(O.__dirname, '/tmp/wanderset-facebook-shopping-feed.<%= brand %>.xml'))
, 'domain': 'https://wanderset.com'
, 'negative_regex': new RegExp('(' + O.brand_blacklist.join('|') + ')', 'i')
});

Spin.start();

GB['CreateFeed'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //feed_name
    //feed_description
    //items
    //output_path
    //domain
  });

  console.log('Creating feed "' + a.o.output_path + '"...');

  var feed = [
    {
      'channel': [
        {
          'title': a.o.feed_name
        }
      , {
          'description': a.o.feed_description
        }
      , {
          'link': a.o.domain
        }
      ].concat(_.map(a.o.items, function(s){
        s = _.omit(s, function(v, k){
          return k.match(/^__/);
        });

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

  return FS.writeFile(a.o.output_path, feed, Belt.cw(a.cb, 0));
};

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
    if (GB.products.length < 1000) return cb(new Error('Fewer than 1000 products'));

    var cont;

    GB['vendors'] = [];

    GB.skip = 0;

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/admin/vendor/list.json'
      , 'auth': GB.auth
      , 'qs': {
          'skip': GB.skip
        , 'limit': GB.limit
        }
      , 'method': 'get'
      , 'json': true
      }, function(err, res, json){
        cont = _.any(Belt.get(json, 'data')) ? true : false;
        GB.skip += GB.limit;
        console.log(GB.skip);

        Async.eachLimit(Belt.get(json, 'data') || [], 6, function(d, cb2){
          GB.vendors.push(d);
          cb2();
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
, function(cb){
    GB['vendors'] = _.object(_.pluck(GB.vendors, '_id'), GB.vendors);

    GB.time = Moment().format('YYYY-MM-DDTHH:mm:ss.SZ');

    GB.items = [];

    _.each(GB.products, function(p){
      var brand = (p.brands || []).join(', ') || '';
      brand += brand ? ' ' : '';

      var cat = Belt.get(p, 'categories.0') || Belt.get(p, 'auto_category') || 'clothing';

      var slug = p.slug || p._id;

      var vendor = GB.vendors[p.vendor];

      var api = Belt.get(vendor, 'shopify.access_token') ? 'shopify' :
                (Belt.get(vendor, 'woocommerce.consumer_key') ? 'woocommerce' :
                (Belt.get(vendor, 'custom_sync.strategy') === 'streetammo' ? 'streetammo' : 'manual'));

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
        , 'availability': v.available_quantity > 0 ? 'in stock' : 'out of stock'
        , 'condition': 'new'
        , 'description': Belt.get(p, 'description.us')
                      || (_.map(v.options, function(v2, k2){
                           return k2 + ': ' + v2.value;
                         }) || []).join(', ')
                      || cat
        , 'image_link': Belt.get(p, 'media.0.url') || Belt.get(p, 'media.0.remote_url')
        , 'title': Str.titleize(brand + p.label.us)
        , 'link': url
        , 'price': (v.compare_at_price && v.compare_at_price > v.price ? v.compare_at_price : v.price).toFixed(2) + ' USD'
        , 'brand': brand
        , 'additional_image_link': _.map(p.media.slice(1, 11), function(m){
            return m.url || m.remote_url;
          }).join(',')
        , 'google_product_category': GB.google_categories[cat]
        , 'product_type': cat
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
        , '__brand': Str.trim(Str.slugify(brand.toLowerCase()))
        };

        if (v.compare_at_price && v.compare_at_price > v.price){
          item['sale_price'] = v.price.toFixed(2) + ' USD';
        }

        item['custom_label_0'] = item.__brand;
        item['custom_label_1'] = api;
        item['custom_label_2'] = api.match(/shopify|woocommerce/i) ? 'api' : 'manual';
        item['custom_label_3'] = !item.__brand.match(GB.negative_regex) ? 'whitelist' : 'blacklist';
        item['custom_label_4'] = GB.domain + '/product/' + slug;

        if (item['custom_label_4'].length > 100) item['custom_label_4'] = GB.domain + '/product/' + p._id;


        if (item.description && item.description === item.description.toUpperCase()) item.description = Str.titleize(item.description);

        if (item.description) item.description = item.description.split('').slice(0, 9999).join('');

        item = Belt.objDefalse(item);

        GB.items.push(item);
      });
    });

    GB.CreateFeed({
      'items': GB.items
    , 'domain': GB.domain
    , 'feed_name': 'Wanderset Products'
    , 'feed_description': 'Products on wanderset.com'
    , 'output_path': GB.output_path
    }, Belt.cw(cb, 0));
  }
, function(cb){
    GB['whitelisted_items'] = _.filter(GB.items, function(i){
      return !i.__brand.match(GB.negative_regex);
    });

    GB.CreateFeed({
      'items': GB.whitelisted_items
    , 'domain': GB.domain
    , 'feed_name': 'Popular Wanderset Products'
    , 'feed_description': 'Popular products on wanderset.com'
    , 'output_path': GB.brand_output_path_template({
        'brand': 'popular'
      })
    }, Belt.cw(cb, 0));
  }
, function(cb){
    GB['grouped_items'] = _.groupBy(GB.items, function(i){
      return i.__brand;
    });

    Async.eachSeries(_.keys(GB.grouped_items), function(g, cb2){
      GB.CreateFeed({
        'items': GB.grouped_items[g]
      , 'domain': GB.domain
      , 'feed_name': Str.titleize(g) + ' Wanderset Products'
      , 'feed_description': Str.titleize(g) + ' products on wanderset.com'
      , 'output_path': GB.brand_output_path_template({
          'brand': g
        })
      }, Belt.cw(cb2, 0));
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
