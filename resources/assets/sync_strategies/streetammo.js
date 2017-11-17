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
;

module.exports = function(options, Instance){
  var o = _.defaults(options || {}, {
    'crawler_host': 'http://localhost:10235'
  , 'crawler_concurrency': 10
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
    , 'dkk_to_usd': 0.15
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
        }

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
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

        gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb.doc.getConfigurations();

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
      }
    , function(cb){
        if (!a.o.product.brand) return cb();

        Instance.db.model('set').findOne({
          'brand': true
        , 'name': new RegExp('^' + Instance.escapeRegExp(a.o.product.brand) + '$', 'i')
        , 'vendor': {
            '$exists': false
          }
        }, Belt.cs(cb, gb, 'brand_set', 1, 0));
      }
    , function(cb){
        if (!gb.brand_set) return cb();

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

  S['CrawlCategoryPage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'max_tries': 3
    , 'host': S.settings.crawler_host
      //index
      //category
    });

    gb['tries'] = 0;

    Async.doWhilst(function(next){
      Request({
        'url': a.o.host + '/method'
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

        if (err || (!_.any(gb.urls) && gb.tries < a.o.max_tries)){
          gb.next = true;
          return setTimeout(next, 1000);
        } else {
          gb.next = false;
          gb.tries = 0;
        }

        gb.urls = _.uniq(_.pluck(gb.urls, 'url') || []);
        gb.urls = _.filter(gb.urls, function(u){
          return !u.split('/').pop().replace(/\W+/g, ' ').match(S.brand_regex);
        });

        next();
      });
    }, function(){ return gb.next || _.any(gb.urls); }, function(err){
      a.cb(err, gb.urls);
    });
  };

  S['CrawlProductPage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'max_tries': 3
    , 'host': S.settings.crawler_host
      //url
    });

    gb['tries'] = 0;

    Async.doWhilst(function(next){
      Request({
        'url': a.o.host + '/method'
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
    , 'categories': [
        '/mister-tee'
      , '/kappa'
      , '/men/apparel'
      , '/men/footwear'
      , '/streetammo'
      ]
    });

    Async.waterfall([
      function(cb){
        gb['prod_cache'] = [];

        return Async.eachSeries(a.o.categories, function(c, cb2){
          gb['index'] = 0;
          gb['category'] = c;
          gb['urls'] = [];

          var tries = 0;

          Async.doWhilst(function(next){
            Request({
              'url': a.o.host + '/method'
            , 'method': 'get'
            , 'qs': {
                'method': 'getProductsList'
              , 'index': gb.index
              , 'category': gb.category
              }
            , 'json': true
            }, function(err, res, json){
              tries++;
              gb.urls = Belt.get(json, 'data.response.products') || [];

              if (err || (!_.any(gb.urls) && tries < 3)){
                gb.next = true;
                return setTimeout(next, 5000);
              } else {
                gb.next = false;
                tries = 0;
                gb.index++;
              }

              gb.urls = _.uniq(_.pluck(gb.urls, 'url') || []);
              gb.urls = _.filter(gb.urls, function(u){
                return !u.split('/').pop().replace(/\W+/g, ' ').match(S.brand_regex);
              });

              Async.eachLimit(_.uniq(gb.urls) || [], S.settings.crawler_concurrency, function(u, cb3){
                var e
                  , prod
                  , tries = 0;

                Async.doWhilst(function(next2){
                  Request({
                    'url': a.o.host + '/method'
                  , 'method': 'get'
                  , 'qs': {
                      'method': 'getProduct'
                    , 'url': u
                    }
                  , 'json': true
                  }, function(err, res, json){
                    e = err;
                    prod = Belt.get(json, 'data.response') || {};
                    prod['url'] = u;

                    tries++;

                    if (!e) console.log('[STREETAMMO] Added "' + u + '" to sync cache...');

                    next2();
                  });
                }, function(){ return e || (!Belt.get(prod, 'title') && tries < 3); }, function(err){
                  gb.prod_cache.push(prod);
                  //cb3();
                  a.o.progress_cb(prod, cb3);
                });
              }, Belt.cw(next, 0));
            });
          }, function(){ return gb.next || _.any(gb.urls); }, Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        return cb();

        gb.prod_cache = _.uniq(gb.prod_cache, 'url');

        return Async.eachSeries(gb.prod_cache, function(p, cb2){
          a.o.progress_cb(p, cb2);
        }, Belt.cw(cb, 0));
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
      'host': o.crawler_host
      //url
      //vendor
    });

    Async.waterfall([
      function(cb){
        var tries = 0;

        Async.doWhilst(function(next2){
          Request({
            'url': a.o.host + '/method'
          , 'method': 'get'
          , 'qs': {
              'method': 'getProduct'
            , 'url': a.o.url
            }
          , 'json': true
          }, function(err, res, json){
            e = err;
            gb['prod'] = Belt.get(json, 'data.response') || {};
            gb.prod['url'] = a.o.url;

            tries++;

            next2();
          });
        }, function(){ return e || (!Belt.get(gb.prod, 'title') && tries < 3); }, Belt.cw(cb, 0));
      }
    , function(cb){
        if (!Belt.get(gb.prod, 'title')) return cb(new Error('product not synced'));

        self.UpdateProduct({
          'product': gb.prod
        , 'vendor': a.o.vendor
        , 'last_sync': Belt.uuid()
        , 'synced_at': new Date()
        }, function(err, prod){
          cb(err);
        });
      }
    ], function(err){
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

        self.IterateProducts({
          'progress_cb': a.o.progress_cb
        }, Belt.cw(cb, 0));
      }
    /*, function(cb){
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

          //e.remove(Belt.cw(cb2));
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

  S['SyncProduct'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });
  };

  return S;
};
