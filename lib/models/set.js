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
  , Crypto = require('crypto')
  , Mime = require('mime')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Str = require('underscore.string')
  , Shortid = require('shortid')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var M = new Mongoose.Schema({
    'name': {'type': String, 'required': true}
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'listing_label': Instance.helpers.locality.LocalitySchemaObject()
  , 'landing_label': Instance.helpers.locality.LocalitySchemaObject()
  , 'slug': {'type': String}
  , 'warning_message': {'type': String}
  , 'logo_label': {'type': String}
  , 'text_color': {'type': String, 'default': '#29363b'}
  , 'featured_media': {
      'url': {'type': String}
    , 'mime': {'type': String}
    , 'metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'downsample_url': {'type': String}
    , 'downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'super_downsample_url': {'type': String}
    , 'super_downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    }
  , 'mobile_featured_media': {
      'url': {'type': String}
    , 'mime': {'type': String}
    , 'metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'downsample_url': {'type': String}
    , 'downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'super_downsample_url': {'type': String}
    , 'super_downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    }
  , 'logo_media': {
      'url': {'type': String}
    , 'mime': {'type': String}
    , 'metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'downsample_url': {'type': String}
    , 'downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'super_downsample_url': {'type': String}
    , 'super_downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    }
  , 'landing_media': {
      'url': {'type': String}
    , 'mime': {'type': String}
    , 'metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'downsample_url': {'type': String}
    , 'downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    , 'super_downsample_url': {'type': String}
    , 'super_downsample_metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    }
  , 'products': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product'}
    ]
  , 'media': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'media'}
    ]
  , 'setmembers': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'setmember'}
    ]
  , 'sync_from_sets': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'set'}
    ]
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'brand': {'type': Boolean, 'default': false}
  , 'hide': {'type': Boolean, 'default': false}
  , 'show_stock_outs': {'type': Boolean, 'default': false}
  });

  M.virtual('filtered_products').get(function(){
    return this['_filtered_products'];
  }).set(function(val){
    this['_filtered_products'] = val;
  });

  M.virtual('filtered_media').get(function(){
    return this['_filtered_media'];
  }).set(function(val){
    this['_filtered_media'] = val;
  });

  _.each([
    ''
  , 'mobile_'
  , 'logo_'
  , 'landing_'
  ], function(p){
    M.virtual(p + 'local_path').get(function(){
      return this['_' + p + 'local_path'];
    }).set(function(val){
      this['_' + p + 'local_path'] = val;
    });

    M.virtual(p + 'remote_url').get(function(){
      return this['_' + p + 'remote_url'];
    }).set(function(val){
      this['_' + p + 'remote_url'] = val;
    });

    M.virtual(p + 'filename').get(function(){
      return this['_' + p + 'filename'];
    }).set(function(val){
      this['_' + p + 'filename'] = val;
    });
  });

  M.index({
    'slug': 1
  }, {
    'unique': true
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.method('uploadS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'prefix': ''
    , 'dest_path': 'featured_media'
    });
    a.o = _.defaults(a.o, {
      'path': self.get(a.o.prefix + 'local_path') ? self.get(a.o.prefix + 'local_path') : undefined
    , 'url': self.get(a.o.prefix + 'remote_url') ? self.get(a.o.prefix + 'remote_url') : (self.get(a.o.prefix + 'url') || undefined)
    , 'filename': self.get(a.o.prefix + 'filename') ? self.get(a.o.prefix + 'filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + a.o.prefix + (self.get('slug') || self.get('_id').toString()) + '.' + Shortid.generate() + '.jpg' //+ (a.o.filename || a.o.path || a.o.url.replace(/(\?|#).*$/g, '')).split('.').pop()
    });
    a.o = _.defaults(a.o, {
      'mime': Mime.lookup(a.o.s3_path)
    });

    if (a.o.mime.match(/image/)){
      a.o['image_metadata'] = true;
      a.o['image_shrink'] = true;
      a.o['width'] = false;
      a.o['quality'] = 100;
    }

    return Async.waterfall([
      function(cb){
        return M.Instance.helpers.s3[
          a.o.url ? 'UploadURL' : 'UploadPath'
        ](a.o, Belt.cs(cb, gb, 'upload', 1, 0));
      }
    , function(cb){
        var obj = {};
        obj[a.o.dest_path] = {
          'url': gb.upload.url
        , 'mime': a.o.mime
        , 'metadata': gb.upload.metadata
        , 'downsample_url': null
        , 'super_downsample_url': null
        };

        self.set(obj);

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  M.method('uploadDownsampleS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'prefix': ''
    , 'dest_path': 'featured_media'
    });
    a.o = _.defaults(a.o, {
      'url': self.get(a.o.dest_path + '.url') ? self.get(a.o.dest_path + '.url') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + a.o.prefix + (self.get('slug') || self.get('_id').toString()) + '.' + Shortid.generate() + '.downsample.jpg'
    });
    a.o = _.defaults(a.o, {
      'mime': Mime.lookup(a.o.s3_path)
    });

    if (a.o.mime.match(/image/)){
      a.o['image_metadata'] = true;
      a.o['image_shrink'] = true;
      a.o['width'] = false;
    }

    return Async.waterfall([
      function(cb){
        return M.Instance.helpers.s3.UploadURL(a.o, Belt.cs(cb, gb, 'upload', 1, 0));
      }
    , function(cb){
        var obj = {};
        obj[a.o.dest_path] = {
          'downsample_url': gb.upload.url
        , 'downsample_metadata': gb.upload.metadata
        };

        self.set(obj);

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  M.method('uploadSuperDownsampleS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'prefix': ''
    , 'dest_path': 'featured_media'
    });
    a.o = _.defaults(a.o, {
      'url': self.get(a.o.dest_path + '.url') ? self.get(a.o.dest_path + '.url') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + a.o.prefix + (self.get('slug') || self.get('_id').toString()) + '.' + Shortid.generate() + '.super.downsample.jpg'
    });
    a.o = _.defaults(a.o, {
      'mime': Mime.lookup(a.o.s3_path)
    });

    if (a.o.mime.match(/image/)){
      a.o['image_metadata'] = true;
      a.o['image_shrink'] = true;
      a.o['width'] = 72;
      a.o['quality'] = 10;
    }

    return Async.waterfall([
      function(cb){
        return M.Instance.helpers.s3.UploadURL(a.o, Belt.cs(cb, gb, 'upload', 1, 0));
      }
    , function(cb){
        var obj = {};
        obj[a.o.dest_path] = {
          'super_downsample_url': gb.upload.url
        , 'super_downsample_metadata': gb.upload.metadata
        };

        self.set(obj);

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  M.method('populateProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        self.populate('products', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        Async.each(gb.doc.get('products'), function(p, cb2){
          p.populate('stocks', Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, gb.doc);
    });
  });

  M.method('populateMediaProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        self.populate('media', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        Async.each(gb.doc.get('media'), function(p, cb2){
          p.populate('products.product', Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, gb.doc);
    });
  });

  M.method('filterProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'products': self.get('products')
    , 'limit': 100
    , 'product_query': {
        'hide': {
          '$ne': true
        }
      , 'sync_hide': {
          '$ne': true
        }
      , 'low_price': {
          '$gt': 0
        }
      }
    });

    return Async.waterfall([
      function(cb){
        gb['arrays'] = Belt.splitArray(a.o.products, a.o.limit);

        gb['filtered_products'] = {};

        Async.eachSeries(gb.arrays || [], function(arr, cb2){
          M.Instance.db.model('product').find(_.extend({}, a.o.product_query, {
            '_id': {
              '$in': arr
            }
          }), function(err, docs){
            _.each(docs, function(d){
              gb.filtered_products[d.get('_id').toString()] = true;
            });

            cb2();
          });
        }, Belt.cw(cb));
      }
    , function(cb){
        gb['products'] = _.filter(a.o.products, function(p){
          return gb.filtered_products[p.toString()];
        });

        self.set({
          'filtered_products': gb.products
        });

        cb();
      }
    ], function(err){
      a.cb(err, gb.products);
    });
  });

  M.method('filterMedia', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        gb['media'] = self.get('media');

        self.populateMediaProducts(Belt.cw(cb));
      }
    , function(cb){
        gb['filtered_media'] = {};

        _.each(self.get('media'), function(d){
          if (_.some(d.products, function(p){
            return p && p.product
                && !p.product.hide
                && !p.product.sync_hide
                && p.product.low_price > 0;
          })) gb.filtered_media[d.get('_id').toString()] = true;
        });

        gb.media = _.filter(gb.media, function(p){
          return gb.filtered_media[p.toString()];
        });

        self.set({
          'filtered_media': gb.media
        });

        cb();
      }
    ], function(err){
      a.cb(err, gb.media);
    });
  });

  M.pre('save', function(next){
    if (!this.get('local_path') && !this.get('remote_url')) return next();

    var self = this;

    self.uploadS3({
      'dest_path': 'featured_media'
    }, function(err){
      self.set({
        'remote_url': undefined
      , 'local_path': undefined
      });

      next(err);
    });
  });

  M.pre('save', function(next){
    if (!this.get('mobile_local_path') && !this.get('mobile_remote_url')) return next();

    var self = this;

    self.uploadS3({
      'dest_path': 'mobile_featured_media'
    , 'prefix': 'mobile_'
    }, function(err){
      self.set({
        'mobile_remote_url': undefined
      , 'mobile_local_path': undefined
      });

      next(err);
    });
  });

  M.pre('save', function(next){
    if (!this.get('logo_local_path') && !this.get('logo_remote_url')) return next();

    var self = this;

    self.uploadS3({
      'dest_path': 'logo_media'
    , 'prefix': 'logo_'
    }, function(err){
      self.set({
        'logo_remote_url': undefined
      , 'logo_local_path': undefined
      });

      next(err);
    });
  });

  M.pre('save', function(next){
    if (!this.get('landing_local_path') && !this.get('landing_remote_url')) return next();

    var self = this;

    self.uploadS3({
      'dest_path': 'landing_media'
    , 'prefix': 'landing_'
    }, function(err){
      self.set({
        'landing_remote_url': undefined
      , 'landing_local_path': undefined
      });

      next(err);
    });
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
      'products': self.populated('products') ? _.map(self.get('products'), function(s){
        return s.toSanitizedObject(a.o);
      }) : obj.products
    , 'media': self.populated('media') ? _.map(self.get('media'), function(s){
        return s.toSanitizedObject(a.o);
      }) : obj.media
    , 'filtered_products': self.get('filtered_products') || []
    , 'filtered_media': self.get('filtered_media') || []
    });

    _.extend(obj, {
      'shown_media': self.populated('media') ? _.filter(obj.media, function(s){
        return !Belt.get(s, 'hide') ? true : false
        //return Belt.get(s, 'products.0') ? true : false
      }) : {}
    , 'shown_products': self.populated('products') ? _.filter(obj.products, function(s){
        return !Belt.get(s, 'hide') && !Belt.get(s, 'sync_hide') && Belt.get(s, 'low_price') > 0 ? true : false
        //return Belt.get(s, 'products.0') ? true : false
      }) : {}
    });

    _.omit(obj, [

    ]);

    _.each([
      'featured_media'
    , 'mobile_featured_media'
    , 'landing_media'
    , 'logo_media'
    ], function(p){
      if (Belt.get(obj, p + '.url')) obj[p].url = M.Instance.SanitizeURL(obj[p].url);
      if (Belt.get(obj, p + '.downsample_url')) obj[p].downsample_url = M.Instance.SanitizeURL(obj[p].downsample_url);
      if (Belt.get(obj, p + '.super_downsample_url')) obj[p].super_downsample_url = M.Instance.SanitizeURL(obj[p].super_downsample_url);
    });

    return obj;
  });

  M.pre('save', function(next){
    if (!this.get('slug')){
      this.set({
        'slug': Str.slugify(
              (
                 this.get('listing_label.us')
              || Str.stripTags(this.get('label.us'))
              || this.get('name')
              || ''
              )
              + '-' + Shortid.generate())
      });
    }

    return next()
  });

  if (M.Instance.settings.environment !== 'production') M.post('save', function(){
    Instance.helpers.cache.throttled_LoadSets(function(){
      Instance.log.warn('Loaded ' + Instance.setmember_sets.length + ' set member sets...');
      Instance.log.warn('Loaded ' + Instance.brand_sets.length + ' brand sets...');
    });
  });

  M.static('SyncSets', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //old_set_id
      //new_set_id
    });

    Async.waterfall([
      function(cb){
        M.Instance.db.model('set').findOne({
          '_id': a.o.old_set_id
        }, Belt.cs(cb, gb, 'old_set', 1, 0));
      }
    , function(cb){
        if (!gb.old_set) return cb(new Error('Old set not found'));

        M.Instance.db.model('set').findOne({
          '_id': a.o.new_set_id
        }, Belt.cs(cb, gb, 'new_set', 1, 0));
      }
    , function(cb){
        if (!gb.new_set) return cb(new Error('New set not found'));

        _.each(gb.old_set.get('media'), function(m){
          if (_.some(gb.new_set.get('media'), function(m2){
            return m2.toString() === m.toString();
          })) return;

          gb.new_set.media.push(m);
        });

        _.each(gb.old_set.get('products'), function(m){
          if (_.some(gb.new_set.get('products'), function(m2){
            return m2.toString() === m.toString();
          })) return;

          gb.new_set.products.push(m);
        });

        gb.new_set.save(Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  });

  M.static('addProduct', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //set
    });

    return Async.waterfall([
      function(cb){
        return self.findOne({
          'slug': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1));
      }
    , function(cb){
        if (gb.doc) return cb();

        return self.findOne({
          '_id': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        var prod = _.find(gb.doc.products, function(p){
          return p.toString() === a.o.product.toString();
        });

        if (prod) return cb();

        gb.doc.products.unshift(a.o.product);

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!a.o.populate) return cb();

        gb.doc.populate('products media', Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  M.static('removeProduct', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //set
      //product
    });

    return Async.waterfall([
      function(cb){
        return self.findOne({
          'slug': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1));
      }
    , function(cb){
        if (gb.doc) return cb();

        return self.findOne({
          '_id': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.products.pull(a.o.product);

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!a.o.populate) return cb();

        gb.doc.populate('products media', Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  M.static('addMedia', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //set
      //media
    });

    return Async.waterfall([
      function(cb){
        return self.findOne({
          'slug': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1));
      }
    , function(cb){
        if (gb.doc) return cb();

        return self.findOne({
          '_id': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        var media = _.find(gb.doc.media, function(p){
          return p.toString() === a.o.media.toString();
        });

        if (media) return cb();

        gb.doc.media.unshift(a.o.media);

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!a.o.populate) return cb();

        gb.doc.populate('products media', Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  M.static('removeMedia', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //set
      //media
    });

    return Async.waterfall([
      function(cb){
        return self.findOne({
          'slug': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1));
      }
    , function(cb){
        if (gb.doc) return cb();

        return self.findOne({
          '_id': a.o.set
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('set not found'));

        gb.doc.media.pull(a.o.media);

        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!a.o.populate) return cb();

        gb.doc.populate('products media', Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  return M;
};
