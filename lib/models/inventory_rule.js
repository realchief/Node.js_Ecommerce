var FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Str = require('underscore.string')
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
  , 'add_to_set': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'set'}
  , 'remove_from_set': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'set'}
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

  M.virtual('description').get(function(){
    var astr = ''
      , tstr = ''
      , gb = {};

    if (this.get('product_hide')) astr += (astr ? ' and ' : '') + 'hidden';
    if (this.get('product_show')) astr += (astr ? ' and ' : '') + 'shown';
    if (this.get('product_brand')) astr += (astr ? ' and ' : '') + 'rebranded to "' + this.get('product_brand') + '"';
    if (this.get('product_category')) astr += (astr ? ' and ' : '') + 'categorized as "' + this.get('product_category') + '"';
    if (this.get('add_to_set')){
      var set = Belt.get(M.Instance.sets, this.get('add_to_set').toString());
      set = set ? set.name + ' (' + set._id.toString() + ')' : set._id.toString();

      astr += (astr ? ' and ' : '') + 'added to set ' + set;
    }
    if (this.get('remove_from_set')){
      var set = Belt.get(M.Instance.sets, this.get('remove_from_set').toString());
      set = set ? set.name + ' (' + set._id.toString() + ')' : set._id.toString();

      astr += (astr ? ' and ' : '') + 'removed from set ' + set;
    }

    if (this.get('brand')) tstr += (tstr ? ' and ' : '') + 'brand is ' + this.get('brand');
    if (this.get('vendor')) tstr += (tstr ? ' and ' : '') + 'vendor is ' + M.Instance.VendorName(this.get('vendor'));
    if (this.get('term')) tstr += (tstr ? ' and ' : '') + 'product includes term "' + this.get('term') + '"';

    return [
      astr
    , tstr
    ];
  });

  M.virtual('query').get(function(){
    var self = this
      , gb = {};

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

    return gb.query;
  });

  M['Instance'] = Instance;

  M.method('CheckProduct', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //product
    });

    if (self.get('brand')){
      gb['brand'] = new RegExp(M.Instance.escapeRegExp(self.get('brand')), 'i');

      if (!(a.o.product.manual_brand || '').match(gb.brand)
         && !(Belt.get(a.o.product, 'brands.0') || '').match(gb.brand)) return false;
    }

    if (self.get('vendor') && Belt.get(a.o, 'product.vendor.toString()') !== self.get('vendor').toString()) return false;

    if (self.get('term')){
      gb['term'] = new RegExp(M.Instance.escapeRegExp(self.get('term')), 'i');

      if (_.every(self.get('term_fields'), function(f){
        return !(Belt.cast(Belt.get(a.o.product, f) || '', 'string')).match(gb.term);
      })) return false;
    }

    return true;
  });

  M.method('ProcessRule', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //product
    });

/*    Async.waterfall([
      function(cb){
        if (self.get('product_category')) a.o.product.set({
          'auto_category': self.get('product_category')
        });

        if (self.get('product_hide')) a.o.product.set({
          'hide': true
        });

        if (self.get('product_show')) a.o.product.set({
          'show': true
        });

        if (self.get('product_brand')) a.o.product.set({
          'manual_brand': self.get('product_brand')
        });

        cb();
      }
    , function(cb){
        if (!self.get('add_to_set')) return cb();


      }
    ], function(err){

    });*/

        if (self.get('product_category')) a.o.product.set({
          'auto_category': self.get('product_category')
        });

        if (self.get('product_hide')) a.o.product.set({
          'hide': true
        });

        if (self.get('product_show')) a.o.product.set({
          'show': true
        });

        if (self.get('product_brand')) a.o.product.set({
          'manual_brand': self.get('product_brand')
        });

    var ir = a.o.product.inventory_rules || {};

    delete ir[self.get('_id').toString()];

    ir[self.get('_id').toString()] = {
      'description': 'Product ' + self.get('description').join(' because ')
    , 'updated_at': new Date()
    };

    a.o.product.set({
      'inventory_rules': ir
    });

    return a.o.product;
  });

  M.method('FindProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'progress_cb': Belt.np
    , 'skip': 0
    , 'limit': 1500
    , 'sort': '-created_at'
    });

    Async.waterfall([
      function(cb){
        gb['query'] = self.get('query');

        Async.doWhilst(function(next){
          M.Instance.db.model('product').find(gb.query).sort(a.o.sort).skip(a.o.skip).limit(a.o.limit).exec(function(err, docs){
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

  M.method('ProcessProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        self.FindProducts({
          'progress_cb': function(p, cb2){
            console.log('...processing product "' + p.slug + ' with inventory rule "' + self._id.toString() + '"...');
            self.ProcessRule({
              'product': p
            });

            p.set({
              'skip_media_processing': true
            });

            p.save(Belt.cw(cb2));
          }
        }, Belt.cw(cb));
      }
    ], function(err){
      a.cb(err);
    });
  });

  M.pre('save', function(next){
    if (this.get('term')) this.set({
      'term': Str.trim(this.get('term').toLowerCase())
    });

    if (this.get('brand')) this.set({
      'brand': Str.trim(this.get('brand').toLowerCase())
    });

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
      'query': Belt.stringify(self.get('query'))
    , 'description': self.get('description')
    });

    if (!a.o.is_admin){

    }

    return obj;
  });

  M.method('toCSVObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    delete obj.query;

    if (!a.o.is_admin){

    }

    return obj;
  });

  return M;
};
