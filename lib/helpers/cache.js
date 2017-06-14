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

  S.instance.settings['us_regions'] = require(Path.join(S.settings.__dirname, './resources/assets/us.regions.json'));

  S['LoadProductCategories'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['categories'] = {};

    Async.waterfall([
      function(cb){
        var skip = 0
          , limit = 500;

        Async.doWhilst(function(next){
          S.instance.db.model('product').find({}).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs;

            _.each(docs, function(d){
              if (!Belt.get(d, 'categories.0')) return;

              var cats = d.categories[0].split(' > ')
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
        cb();
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
          , 'homepage': {
              '$ne': true
            }
          }).skip(skip).limit(limit).exec(function(err, docs){
            if (err) return next(err);

            gb['docs'] = docs || [];
            gb['sets'] = gb.sets.concat(Belt.get(gb.docs, '[].toSanitizedObject()'));

            skip += limit;

            next();
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

        cb();
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
            gb['sets'] = gb.sets.concat(Belt.get(gb.docs, '[].toSanitizedObject()'));

            skip += limit;

            next();
          });
        }, function(){ return _.any(gb.docs); }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb.sets = Belt.arrayDefalse(_.sortBy(gb.sets, function(d){
          return d.name.replace(/ö/ig, 'oe').toLowerCase();
        }));
        cb();
      }
    ], function(err){
      return a.cb(err, gb.sets);
    });
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
