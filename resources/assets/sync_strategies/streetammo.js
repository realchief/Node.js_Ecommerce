#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , Str = require('underscore.string')
  , Querystring = require('querystring')
  , Request = require('request')
  , Crypto = require('crypto')
  , XML = require('xml')
  , XMLParser = require('xml2js')
;

module.exports = function(options, Instance){
  var o = _.defaults(options || {}, {
    'crawler_host': 'http://localhost:10235'
  , 'crawler_hosts': _.times(10, function(i){
      return 'http://localhost:' + (10235 + i);
    })
  , 'crawler_concurrency': 5
  , 'google_shopping_feed_url': 'https://www.streetammo.dk/export/googlepla.xml'
  , 'xml_feed_url': 'https://www.streetammo.dk/export/trendsales.xml'
  , 'stock_update_url': 'https://www.streetammo.dk/api/rest/stockchanges'
  });

  var S = {};
  S['settings'] = o;

  S['brand_regex'] = new RegExp([
    'just water'
  , 'london sock company'
  , 'flexfit'
  , 'eton'
  , 'tom ford'
  , 'new era'
  , 'chance the rapper'
  , 'ricta'
  , 'element'
  , 'birkenstock'
  , 'converse'
  //, 'nike sb'
  , 'stüssy'
  , 'stussy'
  //, 'nike sportswear'
  , 'urban classics'
  , '40s & shorties'
  //, 'mister tee'
  , 'obey'
  , 'huf'
  //, 'cheap monday'
  //, 'clarks originals'
  , 'dickies'
  , 'threads'
  , 'unmarked'
  , 'spitfire'
  , 'defend paris'
  , 'usgoodz'
  , 'supra'
  , 'other'
//  , 'nike'
  ].join('|'), 'i');

  S['LoadGoogleShoppingFeed'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'url': S.settings.google_shopping_feed_url
    , 'update_url': S.settings.stock_update_url
    });

    Async.waterfall([
      function(cb){
        Request({
          'url': a.o.url
        , 'method': 'get'
        , 'timeout': 1000 * 60 * 5
        }, function(err, res, xml){
          if (err || !xml) return cb(err || new Error('Streetammo feed not downloaded'));

          gb['last_modified'] = Moment.utc(res.headers['last-modified'], 'ddd, DD MMM YYYY HH:mm:ss').toDate();

          gb['xml'] = xml;

          cb();
        });
      }
    , function(cb){
        XMLParser.parseString(gb.xml, Belt.cs(cb, gb, 'xml', 1, 0));
      }
    , function(cb){
        if (gb.xml){
          gb.xml = Belt.get(gb.xml, 'rss.channel.0.item');

          gb.xml = _.map(gb.xml, function(v){
            return _.mapObject(v, function(v2){
              return v2 ? v2[0] : v2;
            });
          });

          gb.xml = _.map(gb.xml, function(v){
            return _.object(_.map(v, function(v2, k2){
              return k2.replace(/^g:/, '');
            }), _.values(v));
          });

          _.each(gb.xml, function(v){
            v.id = v.id.split('-').pop();
          });

          gb.xml = _.filter(gb.xml, function(v){
            return v.gender === 'male';
          });

          gb.xml = _.groupBy(gb.xml, function(v){
            return v['item_group_id'];
          });

          //Instance['streetammo_feed'] = gb.xml;
          cb();
        } else {
          cb(new Error('Streetammo feed not loaded'));
        }
      }
    , function(cb){
        gb['vendor'] = _.find(Instance.vendor_ids, function(n){
          return (n.name || '').match(/streetammo/i);
        });

        if (!gb.vendor) return cb();

        Request({
          'url': a.o.update_url
        , 'auth': {
            'user': gb.vendor.custom_sync.details.auth.user
          , 'pass': gb.vendor.custom_sync.details.auth.password
          }
        , 'qs': {
            'time': Moment.utc(gb.last_modified).format('YYYY-MM-DD HH:mm:ss')
          }
        , 'method': 'get'
        , 'json': true
        , 'timeout': 1000 * 60 * 5
        }, function(err, res, json){
          if (err || !json) return cb();

          gb['updates'] = _.object(_.pluck(json, 'id'), _.pluck(json, 'quantity'));

          _.each(gb.xml, function(x){
            _.each(x, function(v){
              if (Belt.isNull(gb.updates[v.id])){
                v['quantity_available'] = 0;
                return;
              }

              v['quantity_available'] = Belt.cast(gb.updates[v.id], 'number');
            });
          });

          gb.xml = _.mapObject(gb.xml, function(x, k){
            return {
              'product': _.omit(x[0], [
                'sale_price'
              , 'price'
              , 'id'
              , 'color'
              , 'size'
              , 'quantity_available'
              ])
            , 'variants': x
            };
          });

          cb();
        });
      }
    ], function(err){
      if (!err && gb.xml) Instance['streetammo_feed'] = gb.xml;

      a.cb(err, gb.xml);
    });
  };

  S['LoadProductFeed'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'url': S.settings.xml_feed_url
    , 'update_url': S.settings.stock_update_url
    });

    Async.waterfall([
      function(cb){
        Request({
          'url': a.o.url
        , 'method': 'get'
        , 'timeout': 1000 * 60 * 5
        }, function(err, res, xml){
          if (err || !xml) return cb(err || new Error('Streetammo feed not downloaded'));

          gb['last_modified'] = Moment.utc(res.headers['last-modified'], 'ddd, DD MMM YYYY HH:mm:ss').toDate();

          gb['xml'] = xml;

          cb();
        });
      }
    , function(cb){
        XMLParser.parseString(gb.xml, Belt.cs(cb, gb, 'xml', 1, 0));
      }
    , function(cb){
        if (gb.xml){
          gb.xml = Belt.get(gb.xml, 'products.product');

          gb.xml = _.object(_.map(gb.xml, function(p){
            return Belt.get(p, 'style.0');
          }), gb.xml);

          _.each(gb.xml, function(v, k){
            _.each([
              'category'
            , 'area'
            , 'item'
            , 'brand'
            , 'style'
            , 'description'
            ], function(v2){
              v[v2] = Belt.get(v[v2], '0'); //|| v[v2];
            });

            _.each(v.variant, function(v2, i){
              _.each(v2, function(v3, k3){
                v2[k3] = Belt.get(v3, '0'); //|| v3;
              });
            });

            _.each(v.shipping, function(v2, i){
              _.each(v2, function(v3, k3){
                v2[k3] = Belt.get(v3, '0'); //|| v3;
              });
            });
          });

          //Instance['streetammo_feed'] = gb.xml;
          cb();
        } else {
          cb(new Error('Streetammo feed not loaded'));
        }
      }
    , function(cb){
        gb['vendor'] = _.find(Instance.vendor_ids, function(n){
          return (n.name || '').match(/streetammo/i);
        });

        if (!gb.vendor) return cb();

        Request({
          'url': a.o.update_url
        , 'auth': {
            'user': gb.vendor.custom_sync.details.auth.user
          , 'pass': gb.vendor.custom_sync.details.auth.password
          }
        , 'qs': {
            'time': Moment.utc(gb.last_modified).format('YYYY-MM-DD HH:mm:ss')
          }
        , 'method': 'get'
        , 'json': true
        , 'timeout': 1000 * 60 * 5
        }, function(err, res, json){
          if (err || !json) return cb();

          gb['updates'] = _.object(_.pluck(json, 'id'), _.pluck(json, 'quantity'));

          _.each(gb.xml, function(x){
            _.each(x.variant, function(v){
              if (Belt.isNull(gb.updates[v.sku])) return;

              v['stock'] = Belt.cast(gb.updates[v.sku], 'string');
            });
          });

          cb();
        });
      }
    ], function(err){
      if (!err && gb.xml) Instance['streetammo_feed'] = gb.xml;

      a.cb(err, gb.xml);
    });
  };

  Instance.express.all('/admin/streetammo/google/feed.json', function(req, res){
    S.LoadGoogleShoppingFeed(function(err, json){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': json
      });
    });
  });

  Instance.express.all('/admin/streetammo/feed.json', function(req, res){
    S.LoadProductFeed(function(err, json){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': json
      });
    });
  });

  S['UpdateGoogleShoppingProduct'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //product
      //vendor
      //last_sync
      //synced_at
      'dkk_to_usd': 0.16
    });

    Async.waterfall([
      function(cb){
        //gb['sku'] =
        if (!gb.sku) return cb(new Error('sku is missing'));

        Instance.log.warn('Syncing "' + gb.sku + '"');

        Instance.db.model('product').findOne({
          'sku': gb.sku
        , 'vendor': a.o.vendor.get('_id')
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc || Instance.db.model('product')({});

        gb.doc.set({
          'sku': gb.sku
        , 'name': a.o.product.title
        , 'label': {
            'us': a.o.product.title
          }
        , 'description': {

          }
        , 'vendor': a.o.vendor.get('_id')
        , 'brands': false && Belt.get(gb.doc, 'brands.0') ? gb.doc.brands : (a.o.product.brand ? [
            a.o.product.brand
          ] : [])
        , 'last_sync': a.o.last_sync
        , 'synced_at': a.o.synced_at
        , 'source': {
            'platform': a.o.vendor.get('custom_sync.strategy')
          , 'record': a.o.product
          }
        , 'skip_media_processing': true
        });

        gb['options'] = {};

        if (a.o.product.color) gb.options['color'] = {
          'name': 'color'
        , 'label': {
            'us': 'color'
          }
        , 'values': {
            'us': [
              a.o.product.color
            ]
          }
        };

        if (_.any(a.o.product.sizes)) gb.options['size'] = {
          'name': 'size'
        , 'label': {
            'us': 'size'
          }
        , 'values': {
            'us': a.o.product.sizes
          }
        };

        gb.doc.set({
          'options': gb.options
        });

        gb.doc.media = _.filter(gb.doc.media, function(m){
          return _.some(a.o.product.images, function(i){
            return i === m.remote_url;
          });
        }) || [];

        _.each(a.o.product.images, function(i){
          if (_.some(gb.doc.media, function(m){
            return i === m.remote_url;
          })) return;

          gb.doc.media.push({
            'remote_url': i
          , 'skip_processing': true
          });
        });

        gb.doc.media = _.sortBy(gb.doc.media, function(m){
          return _.indexOf(a.o.product.images, m.remote_url);
        });

        _.each(gb.doc.media, function(m){
          m['skip_processing'] = true;
        });

        if (a.o.product.brand && a.o.product.brand.match(a.o.brand_regex)){
          gb.doc.set({
            'sync_hide': true
          , 'hide_note': 'brand is blocked'
          });
        } else if (!a.o.product.availability){
          gb.doc.set({
            'sync_hide': true
          , 'hide_note': 'product is unavailable'
          });
        } else {
          gb.doc.set({
            'sync_hide': false
          });

          gb['price'] = a.o.product.price;
          gb.price = Belt.cast(gb.price, 'number') || 0;
          gb.price = Math.ceil(a.o.dkk_to_usd * gb.price);

          if (a.o.product.compare_to_price){
            gb['compare_at_price'] = a.o.product.compare_to_price;
            gb.compare_at_price = Belt.cast(gb.compare_at_price, 'number') || 0;
            gb.compare_at_price = Math.ceil(a.o.dkk_to_usd * gb.compare_at_price);
          }
        }

        gb.doc.set({
          'skip_media_processing': true
        });

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        gb.doc.set({
          'skip_media_processing': true
        });

        gb['stocks'] = [];
        if (!gb.price) return cb();

        Async.eachSeries(gb.doc.getOptionConfigurations() || [true], function(v, cb2){
          var gb2 = {};

          if (v === true){
            gb2['no_options'] = true;
          } else {
            gb2['options'] = _.mapObject(v, function(v2, k2){
              return {
                'value': v2
              , 'alias': k2
              , 'alias_value': v2
              };
            });
          }

          Async.waterfall([
            function(cb3){
              if (v === true){
                Instance.db.model('stock').findOne({
                  '$or': [
                    {
                      'options': {}
                    }
                  , {
                      'options': {
                        '$exists': false
                      }
                    }
                  ]
                , 'vendor': a.o.vendor.get('_id')
                , 'product': gb.doc.get('_id')
                }, Belt.cs(cb3, gb2, 'stock', 1, 0));
              } else {
                Instance.db.model('stock').findOne({
                  'options': gb2.options
                , 'vendor': a.o.vendor.get('_id')
                , 'product': gb.doc.get('_id')
                }, Belt.cs(cb3, gb2, 'stock', 1, 0));
              }
            }
          , function(cb3){
              gb2.stock = gb2.stock || Instance.db.model('stock')({});

              gb2.stock.set({
                'product': gb.doc.get('_id')
              , 'vendor': a.o.vendor.get('_id')
              , 'sku': Crypto.createHash('md5')
                             .update(gb.doc.get('_id').toString() + (gb.no_options ? '' : JSON.stringify(v)))
                             .digest('hex')
              , 'source': {
                  'platform': a.o.vendor.get('custom_sync.strategy')
                , 'record': a.o.product
                }
              , 'last_sync': a.o.last_sync
              , 'synced_at': a.o.synced_at
              , 'options': gb2.options
              , 'price': gb.price
              , 'list_price': gb.price
              , 'compare_at_price': gb.compare_at_price || null
              , 'available_quantity': a.o.base_quantity
              });

              gb2.stock.save(Belt.cs(cb3, gb2, 'stock', 1, 0));
            }
          , function(cb3){
              gb.stocks.push(gb2.stock.get('_id'));

              cb3();
            }
          ], Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb.doc.set({
          'stocks': gb.stocks || []
        });

        gb.doc.set({
          'skip_media_processing': true
        });

        gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getConfigurations();

        gb.doc.set({
          'skip_media_processing': true
        });

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        gb['brand'] = Belt.get(gb, 'doc.brands.0');

        if (!gb.brand) return cb();

        Instance.db.model('set').findOne({
          'brand': true
        , 'name': new RegExp('^' + Instance.escapeRegExp(gb.brand) + '$', 'i')
        }, Belt.cs(cb, gb, 'brand_set', 1));
      }
    , function(cb){
        gb.brand_set = gb.brand_set || Instance.db.model('set')({
          'brand': true
        , 'hide': true
        , 'name': gb.brand
        , 'slug': Str.slugify(gb.brand)
        , 'label': {
            'us': gb.brand
          }
        , 'landing_label': {
            'us': gb.brand
          }
        , 'listing_label': {
            'us': gb.brand
          }
        , 'logo_label': gb.brand
        });

        if (_.some(gb.brand_set.products, function(p){
          return p.toString() === gb.doc.get('_id').toString();
        })) return cb();

        gb.brand_set.products.unshift(gb.doc.get('_id'));

        gb.brand_set.save(Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  };

  S['UpdateProduct'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //product
      //vendor
      //last_sync
      //synced_at
      'base_quantity': 3
    , 'dkk_to_usd': 0.16
    , 'brand_regex': S.brand_regex
    });

    Async.waterfall([
      function(cb){
        gb['sku'] = (Belt.get(a.o, 'product.url') || '').split('/').pop();
        if (!gb.sku) return cb(new Error('sku is missing'));

        Instance.log.warn('Syncing "' + gb.sku + '"');

        Instance.db.model('product').findOne({
          'sku': gb.sku
        , 'vendor': a.o.vendor.get('_id')
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc = gb.doc || Instance.db.model('product')({});

        gb.doc.set({
          'sku': gb.sku
        , 'name': a.o.product.title
        , 'label': {
            'us': a.o.product.title
          }
        , 'description': {

          }
        , 'vendor': a.o.vendor.get('_id')
        , 'brands': false && Belt.get(gb.doc, 'brands.0') ? gb.doc.brands : (a.o.product.brand ? [
            a.o.product.brand
          ] : [])
        , 'last_sync': a.o.last_sync
        , 'synced_at': a.o.synced_at
        , 'source': {
            'platform': a.o.vendor.get('custom_sync.strategy')
          , 'record': a.o.product
          }
        , 'skip_media_processing': true
        });

        gb['options'] = {};

        if (a.o.product.color) gb.options['color'] = {
          'name': 'color'
        , 'label': {
            'us': 'color'
          }
        , 'values': {
            'us': [
              a.o.product.color
            ]
          }
        };

        if (_.any(a.o.product.sizes)) gb.options['size'] = {
          'name': 'size'
        , 'label': {
            'us': 'size'
          }
        , 'values': {
            'us': a.o.product.sizes
          }
        };

        gb.doc.set({
          'options': gb.options
        });

        gb.doc.media = _.filter(gb.doc.media, function(m){
          return _.some(a.o.product.images, function(i){
            return i === m.remote_url;
          });
        }) || [];

        _.each(a.o.product.images, function(i){
          if (_.some(gb.doc.media, function(m){
            return i === m.remote_url;
          })) return;

          gb.doc.media.push({
            'remote_url': i
          , 'skip_processing': true
          });
        });

        gb.doc.media = _.sortBy(gb.doc.media, function(m){
          return _.indexOf(a.o.product.images, m.remote_url);
        });

        _.each(gb.doc.media, function(m){
          m['skip_processing'] = true;
        });

        if (a.o.product.brand && a.o.product.brand.match(a.o.brand_regex)){
          gb.doc.set({
            'sync_hide': true
          , 'hide_note': 'brand is blocked'
          });
        } else if (!a.o.product.availability){
          gb.doc.set({
            'sync_hide': true
          , 'hide_note': 'product is unavailable'
          });
        } else {
          gb.doc.set({
            'sync_hide': false
          });

          gb['price'] = a.o.product.price;
          gb.price = Belt.cast(gb.price, 'number') || 0;
          gb.price = Math.ceil(a.o.dkk_to_usd * gb.price);

          if (a.o.product.compare_to_price){
            gb['compare_at_price'] = a.o.product.compare_to_price;
            gb.compare_at_price = Belt.cast(gb.compare_at_price, 'number') || 0;
            gb.compare_at_price = Math.ceil(a.o.dkk_to_usd * gb.compare_at_price);
          }
        }

        gb.doc.set({
          'skip_media_processing': true
        });

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        gb.doc.set({
          'skip_media_processing': true
        });

        gb['stocks'] = [];
        if (!gb.price) return cb();

        Async.eachSeries(gb.doc.getOptionConfigurations() || [true], function(v, cb2){
          var gb2 = {};

          if (v === true){
            gb2['no_options'] = true;
          } else {
            gb2['options'] = _.mapObject(v, function(v2, k2){
              return {
                'value': v2
              , 'alias': k2
              , 'alias_value': v2
              };
            });
          }

          Async.waterfall([
            function(cb3){
              if (v === true){
                Instance.db.model('stock').findOne({
                  '$or': [
                    {
                      'options': {}
                    }
                  , {
                      'options': {
                        '$exists': false
                      }
                    }
                  ]
                , 'vendor': a.o.vendor.get('_id')
                , 'product': gb.doc.get('_id')
                }, Belt.cs(cb3, gb2, 'stock', 1, 0));
              } else {
                Instance.db.model('stock').findOne({
                  'options': gb2.options
                , 'vendor': a.o.vendor.get('_id')
                , 'product': gb.doc.get('_id')
                }, Belt.cs(cb3, gb2, 'stock', 1, 0));
              }
            }
          , function(cb3){
              gb2.stock = gb2.stock || Instance.db.model('stock')({});

              gb2.stock.set({
                'product': gb.doc.get('_id')
              , 'vendor': a.o.vendor.get('_id')
              , 'sku': Crypto.createHash('md5')
                             .update(gb.doc.get('_id').toString() + (gb.no_options ? '' : JSON.stringify(v)))
                             .digest('hex')
              , 'source': {
                  'platform': a.o.vendor.get('custom_sync.strategy')
                , 'record': a.o.product
                }
              , 'last_sync': a.o.last_sync
              , 'synced_at': a.o.synced_at
              , 'options': gb2.options
              , 'price': gb.price
              , 'list_price': gb.price
              , 'compare_at_price': gb.compare_at_price || null
              , 'available_quantity': a.o.base_quantity
              });

              gb2.stock.save(Belt.cs(cb3, gb2, 'stock', 1, 0));
            }
          , function(cb3){
              gb.stocks.push(gb2.stock.get('_id'));

              cb3();
            }
          ], Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb.doc.set({
          'stocks': gb.stocks || []
        });

        gb.doc.set({
          'skip_media_processing': true
        });

        gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getConfigurations();

        gb.doc.set({
          'skip_media_processing': true
        });

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        gb['brand'] = Belt.get(gb, 'doc.brands.0');

        if (!gb.brand) return cb();

        Instance.db.model('set').findOne({
          'brand': true
        , 'name': new RegExp('^' + Instance.escapeRegExp(gb.brand) + '$', 'i')
        }, Belt.cs(cb, gb, 'brand_set', 1));
      }
    , function(cb){
        gb.brand_set = gb.brand_set || Instance.db.model('set')({
          'brand': true
        , 'hide': true
        , 'name': gb.brand
        , 'slug': Str.slugify(gb.brand)
        , 'label': {
            'us': gb.brand
          }
        , 'landing_label': {
            'us': gb.brand
          }
        , 'listing_label': {
            'us': gb.brand
          }
        , 'logo_label': gb.brand
        });

        if (_.some(gb.brand_set.products, function(p){
          return p.toString() === gb.doc.get('_id').toString();
        })) return cb();

        gb.brand_set.products.unshift(gb.doc.get('_id'));

        gb.brand_set.save(Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  };

  S['CategoryQueue'] = Async.priorityQueue(function(task, callback){
    task(callback);
  }, S.settings.crawler_concurrency);

  S['ProductQueue'] = Async.priorityQueue(function(task, callback){
    task(callback);
  }, S.settings.crawler_concurrency);

  S['CrawlCategoryPage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'max_tries': 3
    , 'host': S.settings.crawler_host
    , 'hosts': S.settings.crawler_hosts
      //index
      //category
    });

    gb['tries'] = 0;

    Async.doWhilst(function(next){
      Request({
        'url': _.sample(a.o.hosts) + '/method'
      , 'method': 'get'
      , 'qs': {
          'method': 'getProductsList'
        , 'index': a.o.index
        , 'category': a.o.category
        }
      , 'json': true
      }, function(err, res, json){
        gb.tries++;
        gb.urls = Belt.get(json, 'data.response.products') || [];
        gb.indexes = Belt.get(json, 'data.response.product_list_pages') || [];

        if (err || (!_.any(gb.urls) && gb.tries < a.o.max_tries)){
          gb.next = true;
          return setTimeout(next, 1000);
        } else {
          gb.next = false;
          gb.tries = 0;
        }

        gb.urls = _.uniq(_.pluck(gb.urls, 'url') || []);

        next();
      });
    }, function(){ return gb.next; }, function(err){
      a.cb(err, gb.urls, gb.indexes);
    });
  };

  S['CrawlProductPage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'max_tries': 3
    , 'host': S.settings.crawler_host
    , 'hosts': S.settings.crawler_hosts
      //url
    });

    gb['tries'] = 0;

    Async.doWhilst(function(next){
      Request({
        'url': _.sample(a.o.hosts) + '/method'
      , 'method': 'get'
      , 'qs': {
          'method': 'getProduct'
        , 'url': a.o.url
        }
      , 'json': true
      }, function(err, res, json){
        gb['err'] = err;
        gb['prod'] = Belt.get(json, 'data.response') || {};
        gb.prod['url'] = a.o.url;

        gb.tries++;

        next();
      });
    }, function(){
      return gb.err || (!Belt.get(gb.prod, 'title') && gb.tries < a.o.max_tries);
    }, function(err){
      a.cb(err, gb.prod);
    });
  };

  S['IterateProducts'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'progress_cb': Belt.np
    , 'host': o.crawler_host
    , 'hosts': o.crawler_hosts
    , 'crawler_concurrency': self.settings.crawler_concurrency
    , 'categories': Instance.settings.environment === 'production-worker-4' ? [
        '/men/apparel'
      , '/men/footwear'
      ] : [
       '/streetammo'
      , '/mister-tee'
      , '/kappa'
      , '/adidas'
      , '/nike_sb'
      , '/nike'
      , '/adidas_skateboarding'
      , '/reebok'
      , '/puma'
      , '/carhartt'
      ]
    });

    Async.waterfall([
      function(cb){
        return Async.eachLimit(_.shuffle(a.o.categories),  a.o.crawler_concurrency, function(c, cb2){
          var category = c
            , tries = 0;

          self.CrawlCategoryPage({
            'index': 0
          , 'category': c
          }, function(err, urls, indexes){
            if (!_.any(indexes)){
              indexes = [
                '0'
              ];
            } else {
              indexes.unshift('0');
            }

            _.each(indexes, function(i){
              self.CategoryQueue.push(function(cb3){
                self.SyncCategoryPage(_.extend({}, a.o, {
                  'category': c
                , 'index': Belt.cast(i, 'number')
                }), Belt.cw(cb3));
              }, Belt.cast(i, 'number'));
            });

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  };

  S['SyncCategoryPage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //vendor
      //category
      //index
      'host': o.crawler_host
    , 'hosts': o.crawler_hosts
    , 'last_sync': Belt.uuid()
    , 'synced_at': new Date()
    });

    Async.waterfall([
      function(cb){
        console.log('[STREETAMMO CATEGORY] Crawling "' + a.o.category +'" page ' + a.o.index + '...');

        self.CrawlCategoryPage(a.o, Belt.cs(cb, gb, 'urls', 1, 0));
      }
    , function(cb){
        console.log('[STREETAMMO CATEGORY] ...found ' + (Belt.get(gb, 'urls.length') || 0) + ' products on "' + a.o.category + '" page ' + a.o.index + '!');

        _.each(gb.urls, function(u, i){
          self.ProductQueue.push(function(cb2){
            self.SyncProduct(_.extend({}, a.o, {
              'url': u
            }), Belt.cw(cb2));
          }, Belt.cast(i, 'number'));
        });

        cb();
      }
    ], function(err){
      a.cb(err);
    });
  };

  S['SyncProduct'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //url
      //vendor
      'host': o.crawler_host
    , 'hosts': o.crawler_hosts
    , 'last_sync': Belt.uuid()
    , 'synced_at': new Date()
    });

    Async.waterfall([
      function(cb){
        console.log('[STREETAMMO PRODUCT] Crawling "' + a.o.url +'"...');

        self.CrawlProductPage(a.o, Belt.cs(cb, gb, 'prod', 1, 0));
      }
    , function(cb){
        if (!Belt.get(gb.prod, 'title')) return cb(new Error('product not synced'));

        self.UpdateProduct({
          'product': gb.prod
        , 'vendor': a.o.vendor
        , 'last_sync': a.o.last_sync
        , 'synced_at': a.o.synced_at
        }, function(err, prod){
          cb(err);
        });
      }
    ], function(err){
      if (err){
        console.log('...[STREETAMMO PRODUCT] ERROR Crawling "' + a.o.url +'"');
      } else {
        console.log('...[STREETAMMO PRODUCT] Finished crawling "' + a.o.url +'"');
      }

      a.cb(err);
    });
  };

  S['SyncVendor'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //vendor
      //progress_cb
      'last_sync': Belt.uuid()
    , 'synced_at': new Date()
    });

    return Async.waterfall([
      function(cb){
        gb['products'] = [];
        gb['last_sync'] = a.o.last_sync;
        gb['synced_at'] = a.o.synced_at;

        self.IterateProducts(a.o, Belt.cw(cb, 0));
      }
/*    , function(cb){
        Instance.db.model('product').find({
          'vendor': a.o.vendor.get('_id')
        , 'last_sync': {
            '$ne': gb.last_sync
          }
        }, Belt.cs(cb, gb, 'remove_products', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.remove_products || [], function(e, cb2){
          e.set({
            'sync_hide': true
          , 'hide_note': 'sync - removed when not synced'
          });

          e.save(Belt.cw(cb2));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Instance.db.model('stock').find({
          'vendor': a.o.vendor.get('_id')
        , 'last_sync': {
            '$ne': gb.last_sync
          }
        }, Belt.cs(cb, gb, 'remove_stocks', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.remove_stocks || [], function(e, cb2){
          e.remove(Belt.cw(cb2));
        }, Belt.cw(cb, 0));
      }*/
    ], function(err){
      a.cb(err);
    });
  };

  return S;
};
