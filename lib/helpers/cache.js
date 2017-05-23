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
    ], function(err){
      return a.cb(err, gb.categories);
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
            'brand': false
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

        gb.sets = gb.sort_docs.concat(_.filter(gb.sets, function(s){
          return !_.some(gb.sort_docs, function(d){
            return d._id === s._id;
          });
        }));

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
        gb.sets = _.sortBy(gb.sets, function(d){
          return d.name.replace(/ö/ig, 'oe').toLowerCase();
        });
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
