var FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Util = require('util')
  , Path = require('path')
  , Optionall = require('optionall')
  , Mongoose = require('mongoose')
  , Moment = require('moment-timezone')
  , CP = require('child_process')
  , OS = require('os')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Request = require('request')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'term': {'type': String}
  , 'term_fields': [
      {'type': String}
    ]
  , 'brand': {'type': String}
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'active': {'type': Boolean, 'default': true}
  , 'product_category': {'type': String}
  , 'product_brand': {'type': String}
  , 'product_hide': {'type': Boolean, 'default': false}
  , 'product_show': {'type': Boolean, 'default': false}
  , 'details': {'type': Object}
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'term': 1
  , 'term_fields': 1
  , 'brand': 1
  , 'active': 1
  , 'vendor': 1
  }, {
    'unique': 1
  });

  M['Instance'] = Instance;

  M.method('CheckProduct', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });


  });

  M.method('ProcessRule', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });
  });

  M.method('FindProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'progress_cb': Belt.np
    , 'skip': 0
    , 'limit': 500
    });

    Async.waterfall([
      function(cb){
        gb['query'] = {};

        if (self.get('brand')) gb.brand = new RegExp(M.Instance.escapeRegExp(self.get('brand')), 'i');

        if (self.get('term')){
          gb['term'] = new RegExp(M.Instance.escapeRegExp(self.get('term')), 'i');

          gb.query['$or'] = [];

          _.each(self.get('term_fields'), function(f){
            if (gb.brand){
              gb.query.$or.push(_.object([
                f
              , 'brands'
              ], [
                gb.term
              , gb.brand
              ]));

              gb.query.$or.push(_.object([
                f
              , 'manual_brand'
              ], [
                gb.term
              , gb.brand
              ]));

            } else {
              gb.query.$or.push(_.object([
                f
              ], [
                gb.term
              ]));
            }
          });

        } else if (gb.brand) {
          gb.query['$or'] = [
            {
              'brands': gb.brand
            }
          , {
              'manual_brand': gb.brand
            }
          ];
        }

        if (self.get('vendor')) gb.query['vendor'] = self.get('vendor');

        Async.doWhilst(function(next){
          M.Instance.db.model('product').find(gb.query).skip(a.o.skip).limit(a.o.limit).exec(function(err, docs){
            gb['results'] = docs || [];

            a.o.skip += a.o.limit;

            Async.eachSeries(gb.results, function(e, cb2){
              a.o.progress_cb(e, cb2);
            }, Belt.cw(next, 0));
          });
        }, function(){ return _.any(gb.results); }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  });

  M.pre('save', function(next){
    if (!_.any(this.get('term_fields'))){
      if (!this.get('brand')){
        this.set({
          'term_fields': [
            'brands'
          , 'manual_brand'
          , 'label.us'
          , 'source.record.product_type'
          , 'source.record.tags'
          , 'source.record.categories'
          ]
        });
      } else {
        this.set({
          'term_fields': [
            'label.us'
          , 'source.record.product_type'
          , 'source.record.tags'
          , 'source.record.categories'
          ]
        });
      }
    }

    next();
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    if (!a.o.is_admin){

    }

    return obj;
  });

  return M;
};
