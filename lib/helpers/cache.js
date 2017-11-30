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
;

module.exports = function(S){
  S['redis_prefix'] = S.settings.environment === 'production-worker' ? 'wanderset:production:' : 'wanderset:' + S.settings.environment + ':';

  S['LoadProductCategories'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'query': {}
    , 'set_instance': true
    });

    gb['categories'] = {};
    gb['all_categories'] = {};

    Async.waterfall([
      function(cb){
        var skip = 0
          , limit = 500;

        Async.doWhilst(function(next){
          S.instance.db.model('product').find(a.o.query).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs;

            _.each(docs, function(d){
              if (!Belt.get(d, 'categories.0') && !Belt.get(d, 'auto_category')) return;

              _.each(d.categories, function(c){
                gb.all_categories[c.toLowerCase().replace(/^\s+|\s+$/g, '')] = true;
              });

              if (d.auto_category) gb.all_categories[d.auto_category.toLowerCase().replace(/^\s+|\s+$/g, '')] = true;

              var cats = (Belt.get(d, 'categories.0') || Belt.get(d, 'auto_category')).toLowerCase().split(' > ')
                , cur = gb.categories
                , c;

              while (_.any(cats)){
                c = cats.shift();
                cur[c] = cur[c] || {};
                cur = cur[c];
              }
            });

            skip += limit;

            next();
          });
        }, function(){ return _.any(gb.docs); }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb.categories = _.omit(gb.categories, function(c){
          return !_.size(c);
        });

        _.each(gb.categories, function(v, k){
          var a = _.chain(v)
                   .keys()
                   .sortBy(function(v2){
                      return v2;
                    })
                    .value()
            , c = Belt.copy(gb.categories);

          gb.categories[k] = _.object(a, _.map(a, function(a2){
            return c[k][a2];
          }));
        });

        gb['sort_categories'] = {
          'clothing': gb.categories.clothing
        , 'footwear': gb.categories.footwear
        , 'accessories': gb.categories.accessories
        , 'home goods': gb.categories['home goods']
        };

        gb.categories = gb.sort_categories;

        gb.categories = _.omit(gb.categories, function(c){
          return !_.size(c);
        });

        gb.categories = _.mapObject(gb.categories, function(v, k){
          if (!v || !v.other) return v;

          var o = v.other;
          delete v.other;
          v['other'] = o;

          return v;
        });

        if (a.o.set_instance){
          self.instance['categories'] = gb.categories;
          self.instance['all_categories'] = _.chain(gb.all_categories)
                                             .keys()
                                             .sortBy(function(c){ return c; })
                                             .value();
        }

        cb();
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'categories" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'categories'
        , Belt.stringify(self.instance.categories)
        , Belt.cw(cb));
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'all_categories" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'all_categories'
        , Belt.stringify(self.instance.all_categories)
        , Belt.cw(cb));
      }
    ], function(err){
      return a.cb(err, gb.categories);
    });
  };

  S['LoadProductOptions'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['options'] = {};

    Async.waterfall([
      function(cb){
        var skip = 0
          , limit = 500;

        Async.doWhilst(function(next){
          S.instance.db.model('product').find({}).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs;

            _.each(docs, function(d){
              _.each(d.options, function(o){
                var l = Belt.get(o, 'label.us');
                if (!l) return;

                l = Str.trim(l.toLowerCase());
                gb.options[l] = _.uniq((gb.options[l] || []).concat(_.map(Belt.get(o, 'values.us') || [], function(v){
                  return Str.trim(v.toLowerCase());
                })));
              });
            });

            skip += limit;

            next();
          });
        }, function(){ return _.any(gb.docs); }, Belt.cw(cb, 0));
      }
    , function(cb){
        self.instance['product_options'] = gb.options;

        cb();
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'product_options" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'product_options'
        , Belt.stringify(self.instance.product_options)
        , Belt.cw(cb));
      }
    ], function(err){
      return a.cb(err, gb.options);
    });
  };

  S['LoadProductOptionsWithExamples'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'example_count': 5
    });

    gb['options'] = {};

    Async.waterfall([
      function(cb){
        var skip = 0
          , limit = 500;

        Async.doWhilst(function(next){
          S.instance.db.model('product').find({}).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs;

            _.each(docs, function(d){
              _.each(d.options, function(o){
                var l = Belt.get(o, 'label.us');
                if (!l) return;

                l = Str.trim(l.toLowerCase());

                gb.options[l] = gb.options[l] || {
                  'values': {}
                , 'skus': []
                };

                if (gb.options[l].skus.length < a.o.example_count) gb.options[l].skus.push(d.slug);

                var vals = _.map(Belt.get(o, 'values.us') || [], function(v){
                  return Str.trim(v.toLowerCase());
                });

                _.each(vals, function(v){
                  gb.options[l].values[v] = gb.options[l].values[v] || [];
                  if (gb.options[l].values[v].length < a.o.example_count) gb.options[l].values[v].push(d.slug);
                });
              });
            });

            skip += limit;

            next();
          });
        }, function(){ return _.any(gb.docs); }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, gb.options);
    });
  };

  S['LoadSets'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['sets'] = [];

    Async.waterfall([
      function(cb){
        var skip = 0
          , limit = 500;

        Async.doWhilst(function(next){
          S.instance.db.model('set').find({

          }).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs || [];

            return Async.eachSeries(gb.docs, function(d, cb2){
              d.filterProducts(function(){
                d.filterMedia(Belt.cw(cb2));
              });
            }, function(err){
              gb['sets'] = gb.sets.concat(Belt.get(gb.docs, '[].toSanitizedObject()'));

              skip += limit;

              next();
            });
          });
        }, function(){ return _.any(gb.docs); }, Belt.cw(cb, 0));
      }
    , function(cb){
        self.instance['set_categories'] = self.instance.set_categories || {};

        Async.eachSeries(gb.sets, function(s, cb2){
          self.LoadProductCategories({
            'set_instance': false
          , 'query': {
              '_id': {
                '$in': s.filtered_products
              }
            , 'hide': {
                '$ne': true
              }
            , 'sync_hide': {
                '$ne': true
              }
            , 'low_price': {
                '$gt': 0
              }
            }
          }, function(err, cats){
            self.instance.set_categories[s._id] = cats;
            cb2();
          });
        }, Belt.cw(cb));
      }
    , function(cb){
        gb.sets = Belt.arrayDefalse(_.sortBy(gb.sets, function(d){
          return (Belt.get(d, 'name') || Belt.get(d, 'label.us') || '').replace(/ö/ig, 'oe').toLowerCase();
        }));

        self.instance['setmember_sets'] = _.filter(gb.sets, function(s){
          return !s.hide && !s.brand;
        });

        _.each([
          'trevor-andrew'
        ].reverse(), function(b){
          _.each([
            'setmember_sets'
          ], function(l){
            var set = _.find(self.instance[l], function(s){
              return s.slug === b;
            });

            self.instance[l] = _.reject(self.instance[l], function(s){
              return s.slug === b;
            });

            if (set) self.instance[l].unshift(set);
          });
        });

        self.instance['setmember_logo_sets'] = _.map(Belt.copy(self.instance.setmember_sets), function(s){
          return _.pick(s, [
            '_id'
          , 'landing_label'
          , 'listing_label'
          , 'logo_label'
          , 'logo_media'
          , 'landing_media'
          , 'name'
          , 'slug'
          , 'mobile_featured_media'
          , 'featured_media'
          ]);
        });

        self.instance['brand_sets'] = _.filter(gb.sets, function(s){
          return !s.hide && s.brand;
        });

        self.instance['brand_slugs'] = _.object(_.map(self.instance.brand_sets, function(s){
          return (Belt.get(s, 'listing_label.us')
              || Belt.get(s, 'label.us')
              || Belt.get(s, 'name')
              || '').toLowerCase();
        }), self.instance.brand_sets);

        self.instance['brand_logo_sets'] = Belt.arrayDefalse(_.sortBy(self.instance.brand_sets, function(d){
          return (d.logo_label || d.name).replace(/ö/ig, 'oe').toLowerCase();
        }));

        self.instance.brand_logo_sets = _.map(self.instance.brand_logo_sets, function(s){
          return _.pick(s, [
            '_id'
          , 'landing_label'
          , 'listing_label'
          , 'logo_label'
          , 'logo_media'
          , 'landing_media'
          , 'name'
          , 'slug'
          , 'mobile_featured_media'
          , 'featured_media'
          ]);
        });

        _.each([
          'comme-des-garcons-play'
        , 'guccighost'
        , 'en-noir'
        , 'adidas-originals'
        , 'mr-completely'
        , 'champion'
        , 'android-homme'
        , 'for-those-who-sin'
        , 'surf-is-dead'
        , 'anwar-carrots'
        , 'fila'
        , 'thrasher'
        , 'pleasures'
        , 'vans'
        , 'wood-wood'
        , 'rcnstrct-studio'
        ].reverse(), function(b){
          _.each([
            'brand_logo_sets'
          ], function(l){
            var set = _.find(self.instance[l], function(s){
              return s.slug === b;
            });

            self.instance[l] = _.reject(self.instance[l], function(s){
              return s.slug === b;
            });

            if (set) self.instance[l].unshift(set);
          });
        });

        cb();
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'set_categories" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'set_categories'
        , Belt.stringify(self.instance.set_categories)
        , Belt.cw(cb));
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'setmember_sets" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'setmember_sets'
        , Belt.stringify(self.instance.setmember_sets)
        , Belt.cw(cb));
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'setmember_logo_sets" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'setmember_logo_sets'
        , Belt.stringify(self.instance.setmember_logo_sets)
        , Belt.cw(cb));
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'brand_sets" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'brand_sets'
        , Belt.stringify(self.instance.brand_sets)
        , Belt.cw(cb));
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'brand_logo_sets" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'brand_logo_sets'
        , Belt.stringify(self.instance.brand_logo_sets)
        , Belt.cw(cb));
      }
    , function(cb){
        if (!S.instance.redis) return cb();

        console.log('Setting "' + S.redis_prefix + 'brand_slugs" in Redis...');

        S.instance.redis.set(S.redis_prefix + 'brand_slugs'
        , Belt.stringify(self.instance.brand_slugs)
        , Belt.cw(cb));
      }
    ], function(err){
      return a.cb(err, gb.sets);
    });
  };

  S['LoadVendors'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['sets'] = [];

    Async.waterfall([
      function(cb){
        var skip = 0
          , limit = 500;

        Async.doWhilst(function(next){
          S.instance.db.model('vendor').find({

          }).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs || [];
            gb['vendors'] = (gb.vendors || []).concat(gb.docs);

            skip += limit;

            next();
          });
        }, function(){ return _.any(gb.docs); }, Belt.cw(cb, 0));
      }
    , function(cb){
        self.instance['vendors'] = gb.vendors;

        self.instance['vendor_ids'] = _.object(_.map(self.instance.vendors, function(v){
          return v.get('_id').toString();
        }), self.instance.vendors);

        self.instance['vendor_names'] = _.object(_.map(self.instance.vendors, function(v){
          return (v.get('name') || '').replace(/\W/g, '').toLowerCase();
        }), _.map(self.instance.vendors, function(v){
          return v.get('_id').toString();
        }));

        cb();
      }
    ], function(err){
      return a.cb(err, gb.vendors);
    });
  };

  _.each([
    'LoadProductCategories'
  , 'LoadProductOptions'
  , 'LoadSets'
  , 'LoadVendors'
  ], function(s){
    S['throttled_' + s] = _.throttle(function(cb){
      S[s](cb);
    }, 60000, {
      'leading': false
    , 'trailing': true
    });
  });

  S.instance.express.all('/cache/product/options.json', function(req, res){
    res.status(200).json(S.instance.product_options);
  });

  S.instance.express.all('/cache/product/options/skus.json', function(req, res){
    S.LoadProductOptionsWithExamples(function(err, options){
      res.status(200).json(options);
    });
  });

  S.instance.express.all('/cache/product/categories.json', function(req, res){
    res.status(200).json(S.instance.categories);
  });

  S.instance.express.all('/cache/product/all/categories.json', function(req, res){
    res.status(200).json(S.instance.all_categories);
  });

  S.instance.express.all('/cache/set/brands.json', function(req, res){
    res.status(200).json(S.instance.brand_sets);
  });

  S.instance.express.all('/cache/set/brands/slugs.json', function(req, res){
    res.status(200).json(S.instance.brand_slugs);
  });

  S.instance.express.all('/cache/set/setmembers.json', function(req, res){
    res.status(200).json(S.instance.setmember_sets);
  });

  S.instance.express.all('/cache/set/categories.json', function(req, res){
    res.status(200).json(S.instance.set_categories);
  });

  S.instance.express.all('/admin/cache/category-rules.csv', function(req, res){
    res.sendFile(Path.join(S.settings.__dirname, S.settings.category_grams_path));
  });

  S.instance['CacheLoaded'] = function(){
    return _.size(S.instance.categories)
        && _.any(S.instance.all_categories)
        && _.any(S.instance.brand_sets)
        && _.any(S.instance.setmember_sets)
        && _.size(S.instance.set_categories);
  };

  if (true) S.instance.on('ready', function(){
    Async.forever(function(next){
      return Async.eachSeries([
        'categories'
      , 'product_options'
      , 'set_categories'
      , 'setmember_sets'
      , 'setmember_logo_sets'
      , 'brand_sets'
      , 'brand_logo_sets'
      , 'brand_slugs'
      ], function(e, cb2){
        if (!S.instance.redis) return cb2();

        S.log.warn('Reading from Redis "' + S.redis_prefix + e + '"...');

        S.instance.redis.get(S.redis_prefix + e, function(err, val){
          var obj;

          try {
            obj = Belt.parse(val);
            if (obj) S.instance[e] = obj;
          } catch(e) {

          }

          cb2();
        });
      }, function(err){
        setTimeout(next, 60 * 1 * 1000);
      });
    });
  });

  if (true) S.instance.on('ready', function(){
    Async.forever(function(next){
      return Async.waterfall([
        function(cb){
          S.LoadVendors(function(){
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'vendors.length') || 0)  + ' vendors...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'shopify.access_token') ? true : false;
            }).length + ' vendors with Shopify sync...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'woocommerce.consumer_key') ? true : false;
            }).length + ' vendors with Woocommerce sync...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'custom_sync.strategy') ? true : false;
            }).length + ' vendors with custom sync strategy...');

            cb();
          });
        }
      ], function(err){
        setTimeout(next, 60 * 5 * 1000);
      });
    });
  });

  if (S.settings.environment !== 'production') S.instance.on('ready', function(){
    Async.forever(function(next){
      return Async.waterfall([
        function(cb){
          S.LoadProductCategories(function(){
            S.log.warn('PRODUCT CATEGORIES LOADED');

            cb();
          });
        }
      , function(cb){
          S.LoadProductOptions(function(){
            S.log.warn('PRODUCT OPTIONS LOADED');

            cb();
          });
        }
      , function(cb){
          S.LoadSets(function(){
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'setmember_sets.length') || 0) + ' set member sets...');
            S.log.warn('Loaded ' + _.filter(S.instance.setmember_sets || [], function(s){
              return Belt.get(s, 'products.0') ? true : false;
            }).length + ' set member sets with products...');
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'brand_sets.length') || 0)  + ' brand sets...');
            S.log.warn('Loaded ' + _.filter(S.instance.brand_sets || [], function(s){
              return Belt.get(s, 'products.0') ? true : false;
            }).length + ' brand sets with products...');

            cb();
          });
        }
      ], function(err){
        setTimeout(next, 60 * 5 * 1000);
      });
    });
  });

  setTimeout(function(){
    return Async.waterfall([
      function(cb){
        S.instance['categories'] = {};
        S.instance['product_options'] = {};
        S.instance['vendors'] = [];
        S.instance['vendor_ids'] = {};
        S.instance['set_categories'] = {};
        S.instance['setmember_sets'] = [];
        S.instance['setmember_logo_sets'] = [];
        S.instance['brand_sets'] = [];
        S.instance['brand_logo_sets'] = [];
        S.instance['brand_slugs'] = {};

        cb();
      }
    ], function(err){
      if (err) S.instance.ErrorNotification(err, 'SetupCacheHelper', {

      });

      return S.emit('ready');
    });
  }, 0);
};
