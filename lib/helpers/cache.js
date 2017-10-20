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

  S['LoadSetmemberSets'] = function(options, callback){
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
            'brand': {
              '$ne': true
            }
          , 'hide': {
              '$ne': true
            }
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
        gb['sort_docs'] = [];

        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/chance/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/trevor/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/jaden/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/mane/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/andrew/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/cash/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/nabil/i);
        }));
        gb.sort_docs.push(_.find(gb.sets, function(d){
          return d.name.match(/javier/i);
        }));

        gb.sets = Belt.arrayDefalse(gb.sort_docs.concat(_.filter(gb.sets, function(s){
          return !_.some(gb.sort_docs, function(d){
            return Belt.get(d, '_id') === Belt.get(s, '_id');
          });
        })));

        gb.sets = _.sortBy(gb.sets, function(s){
          return s.name;
        });

        self.instance['setmember_sets'] = gb.sets;

        self.instance['setmember_logo_sets'] = _.map(Belt.copy(gb.sets), function(s){
          return _.omit(s, [
            'media'
          , 'products'
          , 'filtered_products'
          , 'filtered_media'
          ]);
        });

        cb();
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
            }
          }, function(err, cats){
            self.instance.set_categories[s._id] = cats;
            cb2();
          });
        }, Belt.cw(cb));
      }
    ], function(err){
      return a.cb(err, gb.sets);
    });
  };

  S['LoadBrandSets'] = function(options, callback){
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
            'brand': true
          , 'hide': {
              '$ne': true
            }
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
        gb.sets = Belt.arrayDefalse(_.sortBy(gb.sets, function(d){
          return d.name.replace(/ö/ig, 'oe').toLowerCase();
        }));

        self.instance['brand_sets'] = gb.sets;
        self.instance['brand_slugs'] = _.object(_.map(gb.sets, function(s){
          return (Belt.get(s, 'listing_label.us')
              || Belt.get(s, 'label.us')
              || Belt.get(s, 'name')).toLowerCase();
        }), gb.sets);

        gb.logo_sets = Belt.arrayDefalse(_.sortBy(gb.sets, function(d){
          return (d.logo_label || d.name).replace(/ö/ig, 'oe').toLowerCase();
        }));

        self.instance['brand_logo_sets'] = _.map(Belt.copy(gb.logo_sets), function(s){
          return _.omit(s, [
            'media'
          , 'products'
          , 'filtered_products'
          , 'filtered_media'
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
            'brand_sets'
          , 'brand_logo_sets'
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
        self.instance['set_categories'] = self.instance.set_categories || {};

        Async.eachSeries(gb.sets, function(s, cb2){
          self.LoadProductCategories({
            'set_instance': false
          , 'query': {
              '_id': {
                '$in': s.filtered_products
              }
            }
          }, function(err, cats){
            self.instance.set_categories[s._id] = cats;
            cb2();
          });
        }, Belt.cw(cb));
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

        cb();
      }
    ], function(err){
      return a.cb(err, gb.vendors);
    });
  };

  _.each([
    'LoadProductCategories'
  , 'LoadProductOptions'
  , 'LoadBrandSets'
  , 'LoadSetmemberSets'
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

  S.instance.express.all('/cache/set/setmembers.json', function(req, res){
    res.status(200).json(S.instance.setmember_sets);
  });

  S.instance.express.all('/cache/set/categories.json', function(req, res){
    res.status(200).json(S.instance.set_categories);
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
