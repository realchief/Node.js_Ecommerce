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
  , Str = require('underscore.string')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Shortid = require('shortid')
  , Request = require('request')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var MediaSchema = new Mongoose.Schema({
    'url': {'type': String}
  , 'mime': {'type': String}
  , 'remote_url': {'type': String}
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
  , 'downloaded': {'type': Boolean}
  , 'downsampled': {'type': Boolean}
  , 'super_downsampled': {'type': Boolean}
  , 'options': {'type': Object}
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  });

  MediaSchema.plugin(Timestamps);

  MediaSchema.virtual('local_path').get(function(){
    return this._local_path;
  }).set(function(val){
    this['_local_path'] = val;
  });

  MediaSchema.virtual('filename').get(function(){
    return this._filename;
  }).set(function(val){
    this['_filename'] = val;
  });

  MediaSchema.virtual('skip_processing').get(function(){
    return this._skip_processing;
  }).set(function(val){
    this['_skip_processing'] = val;
    return;
  });

  MediaSchema.method('uploadS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'path': self.get('local_path') ? self.get('local_path') : undefined
    , 'url': self.get('remote_url') ? self.get('remote_url') : (self.get('url') || undefined)
    , 'filename': self.get('filename') ? self.get('filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + (Belt.get(self.parent(), 'slug') ? self.parent().slug + '-' : '') + 'media-' + self.get('_id').toString() + '.jpg' //+ (a.o.filename || a.o.path || a.o.url.replace(/(\?|#).*$/g, '')).split('.').pop()
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
        self.set({
          'url': gb.upload.url
        , 'mime': a.o.mime
        , 'metadata': gb.upload.metadata
        , 'downloaded': true
        , 'downsampled': false
        , 'super_downsampled': false
        });

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  MediaSchema.method('uploadDownsampleS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'url': self.get('url')
    , 'filename': self.get('filename') ? self.get('filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/media-' + self.get('_id').toString() + '.downsample.jpg'
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
        self.set({
          'downsample_url': gb.upload.url
        , 'downsample_metadata': gb.upload.metadata
        , 'downsampled': true
        });

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  MediaSchema.method('uploadSuperDownsampleS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'url': self.get('url')
    , 'filename': self.get('filename') ? self.get('filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/media-' + self.get('_id').toString() + '.super.downsample.jpg'
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
        self.set({
          'super_downsample_url': gb.upload.url
        , 'super_downsample_metadata': gb.upload.metadata
        , 'super_downsampled': true
        });

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
  });

  MediaSchema.pre('save', function(next){
    if (!this.get('local_path') && !this.get('remote_url')) return next();
    if (this.get('url') && !this.get('url').match(/\.jpg$/)){
      this.set({
        'downloaded': false
      });
    }

    if (M.Instance.settings.no_media_processing || this.parent().get('skip_media_processing') || this.get('skip_processing') || this.get('downloaded')) return next();

    var self = this
      , is_local = self.get('local_path') ? true : false;

    console.log('Uploading product media "' + self.get('_id').toString() + '" to S3...');

    self.uploadS3(function(err){
      self.set({
        'local_path': undefined
      , 'downsampled': false
      , 'super_downsampled': true
      , 'downloaded': err ? false : true
      });

      next(is_local && err ? err : null);
    });
  });

  MediaSchema.pre('save', function(next){
    if (M.Instance.settings.no_media_processing || this.parent().get('skip_media_processing') || this.get('skip_processing') || this.get('downsampled')) return next();

    var self = this;

    console.log('Uploading downsampled product media "' + self.get('_id').toString() + '" to S3...');

    self.uploadDownsampleS3(function(err){
      self.set({
        'downsampled': err ? false : true
      });
      next();
    });
  });

  MediaSchema.pre('save', function(next){
    if (M.Instance.settings.no_media_processing || this.parent().get('skip_media_processing') || this.get('skip_processing') || this.get('super_downsampled')) return next();

    var self = this;

    console.log('Uploading super downsampled product media "' + self.get('_id').toString() + '" to S3...');

    self.uploadSuperDownsampleS3(function(err){
      self.set({
        'super_downsampled': err ? false : true
      });
      next();
    });
  });

  MediaSchema.pre('save', function(next){
    if (!this.get('url') && !this.get('remote_url')) return next(new Error('URL is required'));
    return next();
  });

  var M = new Mongoose.Schema({
    'name': {'type': String, 'required': true}
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'editorial_notes': Instance.helpers.locality.LocalitySchemaObject()
  , 'shipping_returns': Instance.helpers.locality.LocalitySchemaObject()
  , 'sizing_guide': Instance.helpers.locality.LocalitySchemaObject()
  , 'slug': {'type': String}
  , 'options': {'type': Object, 'default': {}}
  , 'media': [MediaSchema]
  , 'stocks': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'stock'}
    ]
  , 'sets': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'set'}
    ]
  , 'categories': [
      {'type': String}
    ]
  , 'auto_category': {'type': String}
  , 'brands': [
      {'type': String}
    ]
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'sku': {'type': String}
  , 'source': {
      'platform': {'type': String}
    , 'record': {'type': Mongoose.Schema.Types.Mixed}
    }
  , 'last_sync': {'type': String}
  , 'synced_at': {'type': Date}
  , 'low_price': {'type': Number}
  , 'compare_at_price': {'type': Number}
  , 'high_price': {'type': Number}
  , 'hide': {'type': Boolean, 'default': false}
  , 'show': {'type': Boolean, 'default': false}
  , 'sync_hide': {'type': Boolean, 'default': false}
  , 'hide_note': {'type': String}
  });

  M.path('sync_hide').set(function(val){
    this['o_sync_hide'] = this.sync_hide;
    return val;
  });

  M.virtual('skip_media_processing').get(function(){
    return this._skip_media_processing;
  }).set(function(val){
    this['_skip_media_processing'] = val;
    return;
  });

  M.virtual('refresh_media').get(function(){
    return this._refresh_media;
  }).set(function(val){
    this['_refresh_media'] = val;
    return;
  });

  M.virtual('downsample_media').get(function(){
    return this._downsample_media;
  }).set(function(val){
    this['_downsample_media'] = val;
    return;
  });

  M.virtual('super_downsample_media').get(function(){
    return this._super_downsample_media;
  }).set(function(val){
    this['_super_downsample_media'] = val;
    return;
  });

  M.virtual('target_color').get(function(){
    var self = this
      , cats = self.get('categories').join('\n');

    if (cats.match(/hat|head/i)){
      return O.target_colors.headwear;
    }

    if (cats.match(/pant|jeans|short/i)){
      return O.target_colors.pants;
    }

    if (cats.match(/shoe|foot|sock/i)){
      return O.target_colors.footwear;
    }

    if (cats.match(/shirt|sweater|top|coat/i)){
      return O.target_colors.tops;
    }

    return O.target_colors.accessories;
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'name': 1
  });

  M.index({
    'sku': 1
  });

  M.index({
    'slug': 1
  }, {
    'unique': true
  });

  M.index({
    'label.us': 'text'
  //, 'description.us': 'text'
  , 'categories': 'text'
  , 'brands': 'text'
  }, {
    'name': 'product_text_search'
  , 'weights': {
      'brands': 10
    , 'categories': 10
    , 'label.us': 5
    //, 'description.us': 1
    }
  });

  M['MediaSchema'] = MediaSchema;

  M.method('createStock', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'product': self.get('_id')
    });

    Async.waterfall([
      function(cb){
        M.Instance.db.model('stock').create(a.o, function(err, doc){
          if (err) return cb(err);

          self.stocks.addToSet(doc.get('_id'));

          self.save(Belt.cw(cb));
        });
      }
    , function(cb){
        self.populate('stocks', Belt.cw(cb));
      }
    , function(cb){
        self.getConfigurations(Belt.cw(cb));

        self.save(Belt.cs(cb, gb, 'doc', 1, 0));
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  M.method('getConfigurations', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    if (!self.populated('stocks')) return {};

    var obj = {}
      , size_opts = _.size(self.get('options') || {});

    _.each(self.get('stocks'), function(s){
      //if (_.size(s.options) !== size_opts) return;

      var o_string = _.map(s.options, function(v, k){
        return k + ':' + v.value;
      }).join(';') || '';

      obj[o_string] = obj[o_string] || {
        'stocks': []
      , 'price': 0
      , 'compare_at_price': 0
      , 'available_quantity': 0
      , 'options': Belt.copy(s.options)
      };

      if (s.price > obj[o_string].price) obj[o_string].price = s.price;
      if (s.compare_at_price > obj[o_string].compare_at_price) obj[o_string].compare_at_price = s.compare_at_price;

      obj[o_string].available_quantity += (s.available_quantity || 0)

      obj[o_string].stocks.push(s._id.toString());
    });

    var pobj = _.pick(obj, function(v){
      return v.price && v.price > 0 && v.available_quantity > 0;
    });

    self.set({
      'low_price': Belt.get(_.min(pobj, function(p){
        return p.price;
      }), 'price') || undefined
    , 'compare_at_price': Belt.get(_.max(pobj, function(p){
        return p.compare_at_price;
      }), 'price') || undefined
    , 'high_price': Belt.get(_.max(pobj, function(p){
        return p.price;
      }), 'price') || undefined
    });

    gb['options'] = {};

    _.each(obj, function(v, k){
      var sku = Crypto.createHash('md5');
      sku.update(self._id.toString() + '::' + k);
      sku = sku.digest('hex');

      v['sku'] = sku;

      _.each(v.options, function(v, k){
        if (!gb.options[k]) gb.options[k] = {
          'name': k
        , 'label': {
            'us': k
          }
        , 'values': {
            'us': []
          }
        };

        gb.options[k].values.us.push(v.value);
      });
    });

    _.each(gb.options, function(v, k){
      v.values.us = _.uniq(v.values.us);
    });

    self.set({
      'options': gb.options
    });

    return obj;
  });

  M.method('getBaseConfiguration', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    var conf = self.getConfigurations();

    return _.find(conf, function(c){
      return c.price && c.available_quantity;
    });
  });

  M.method('getOptionConfigurations', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    var obj = {};
    _.each(self.get('options'), function(s, k){
      obj[k] = _.map(Belt.get(s, 'values.us') || [], function(v){
        return [k, v];
      });
    });

    obj = Instance.arrayCombinations(_.values(obj));
    obj = _.map(obj, function(o){
      o = Belt.splitArray(o, 2);
      return _.object(o);
    });

    return obj;
  });

  M.static('getStock', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'options': {}
    , 'available_quantity': 1
      //product
    });

    return Async.waterfall([
      function(cb){
        gb['options'] = {};

        _.each(a.o.options, function(v, k){
          gb.options['options.' + k + '.value'] = v;
        });

        self.findOne({
          '_id': a.o.product
        }, Belt.cs(cb, gb, 'product', 1, 0));
      }
    , function(cb){
        if (!gb.product) return cb(new Error('product not found'));

        M.Instance.db.model('stock').findOne(_.extend({
          'product': a.o.product
        , 'available_quantity': {
            '$gte': a.o.available_quantity
          }
        , '_id': {
            '$in': gb.product.get('stocks')
          }
        }, gb.options || {}), Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Stock not available'));

        cb();
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  M.static('changeStockQuantity', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'options': {}
      //product
      //stock
      //quantity
    , 'reserve': true
    });

    return Async.waterfall([
      function(cb){
        gb['options'] = {};

        _.each(a.o.options, function(v, k){
          gb.options['options.' + k + '.value'] = v;
        });

        M.Instance.db.model('stock').findOneAndUpdate(_.extend({
          'available_quantity': {
            '$gte': a.o.quantity
          }
        }, gb.options || {}, a.o.stock ? {
          '_id': a.o.stock
        } : {}, gb.options || {}, a.o.product ? {
          'product': a.o.product
        } : {}), {
          '$inc': _.extend({
            'available_quantity': a.o.quantity
          }, a.o.reserve ? {
            'reserve_quantity': (-1 * a.o.quantity)
          } : {})
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error('Stock not available'));

        cb();
      }
    ], function(err){
      a.cb(err, gb.doc);
    });
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    self.getConfigurations();
    var obj = self.toObject();

    _.extend(obj, {
//      'vendor': self.populated('vendor') ? self.get('vendor').toSanitizedObject(a.o) : obj.vendor
      'stocks': self.populated('stocks') ? _.map(self.get('stocks'), function(s){
        return s.toSanitizedObject(a.o);
      }) : obj.stocks
    , 'configurations': self.getConfigurations()
    , 'base_configuration': self.getBaseConfiguration()
    , 'option_configurations': self.getOptionConfigurations()
    , 'target_color': self.get('target_color')
    });

    obj.media = _.map(obj.media, function(m){
      if (m.url) m.url = M.Instance.SanitizeURL(m.url);
      if (m.downsample_url) m.downsample_url = M.Instance.SanitizeURL(m.downsample_url);
      if (m.super_downsample_url) m.super_downsample_url = M.Instance.SanitizeURL(m.super_downsample_url);

      return m;
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  M.method('toCSVObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    var obj = self.toSanitizedObject();

    _.each([
      'label'
    , 'description'
    , 'listing_label'
    , 'landing_label'
    , 'editorial_notes'
    , 'shipping_returns'
    , 'sizing_guide'
    ], function(e){
      _.each(obj[e], function(v, k){
        obj[e + '.' + k] = Str.stripTags(v || '').replace(/,/g, ';').replace(/\W+/g, ' ');
        delete obj[e][k];
      });
    });

    var cats = (Belt.get(obj, 'categories.0') || '').split(/\s*>\s*/);

    obj['category_1'] = cats[0] || '';
    obj['category_2'] = cats[1] || '';
    obj['category_3'] = cats[2] || '';

    _.each([
      'vendors'
    , 'brands'
    , 'categories'
    , 'sets'
    ], function(e){
      obj[e] = (obj[e] || []).join('\n');
    });

    obj['media'] = (_.pluck(obj.media, 'url') || []).join('\n');

    var opts = [];
    _.each(obj.options, function(v, k){
      _.each(Belt.get(v, 'values.us') || [], function(v2){
        opts.push(k + '=' + v2);
      });
    });
    obj['options'] = opts.join('\n');

    var fconf = (_.values(obj.configurations) || [])[0];
    obj['price'] = fconf.price || '';
    obj['available_quantity'] = fconf.available_quantity || '';

    obj['source.product_type'] = Belt.get(obj, 'source.record.product_type') || '';
    obj['source.tags'] = Belt.get(obj, 'source.record.tags') || '';
    obj['source'] = JSON.stringify(obj.source);

    delete obj.configurations;
    delete obj.base_configuration;
    delete obj.label;
    delete obj.description;
    delete obj.stocks;
    delete obj.option_configurations;

    return obj;
  });

  M.post('remove', function(doc){
    Async.waterfall([
      function(cb){
        Instance.db.model('stock').find({
          'product': doc._id
        }, function(err, docs){
          Async.eachSeries(docs, function(d, cb2){
            d.remove(Belt.cw(cb2, 0));
          }, Belt.cw(cb, 0));
        });
      }
    , function(cb){
        Instance.db.model('media').find({
          'products.product': doc._id
        }, function(err, docs){
          Async.eachSeries(docs, function(d, cb2){
            d.products = _.reject(d.products, function(p){
              return p.product.toString() === doc._id.toString();
            });

            d.save(Belt.cw(cb2, 0));
          }, Belt.cw(cb, 0));
        });
      }
    , function(cb){
        Instance.db.model('set').find({
          'products': doc._id
        }, function(err, docs){
          Async.eachSeries(docs, function(d, cb2){
            d.products.pull(doc._id);

            d.save(Belt.cw(cb2, 0));
          }, Belt.cw(cb, 0));
        });
      }
    ], function(err){
      if (err) Instance.emit('error', err);
    });
  });

  M.pre('save', function(next){
    if (!this.get('slug')){
      var brand = (this.get('brands') || []).join('-');
      this.set({
        'slug': Str.slugify((brand ? brand + '-' : '')
              + (this.get('label.us') || this.get('name') || '')
              + '-' + Shortid.generate())
      });
    }
    return next()
  });

  M.pre('save', function(next){
    if (this.get('show')){
      this.set({
        'hide': false
      , 'sync_hide': false
      });
    }
    return next()
  });

  M.pre('save', function(next){
    if (this.get('categories.0')){
      this.set({
        'auto_category': undefined
      });
    }
    return next()
  });

  M.pre('save', function(next){
    var self = this;

    Async.waterfall([
      function(cb){
        if (self.populated('stocks')) return cb();

        self.populate('stocks', Belt.cw(cb));
      }
    , function(cb){
        self.getConfigurations();
        cb();
      }
    ], function(err){
      return next();
    });
  });

/*
  M.pre('save', function(next){
    var self = this
      , gb = {};

    Async.waterfall([
      function(cb){
        Instance.db.model('set').find({
          'products': self.get('_id')
        }, Belt.cs(cb, gb, 'sets', 1, 0));
      }
    , function(cb){
        self.set({
          'sets': _.map(gb.sets, function(s){
            return s.get('_id');
          }) || []
        });
        cb();
      }
    ], function(err){
      next(err);
    });
  });
*/

  if (Belt.get(Instance.settings, 'notifications.new_product_slack')){
    M.pre('save', function(next){
      if (!this.isNew) return next();

      Request({
        'url': Instance.settings.notifications.platform_new_products_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': 'New product: '
                + this.get('brands.0')
                + ' ' + this.get('label.us')
                + ' <https://wanderset.com/product/' + this.get('slug') + '>'
        , 'username': 'INVENTORY-BOT'
        , 'icon_emoji': ':shirt:'
        , 'attachments': this.get('media.0.remote_url') ? [
            {
              'image_url': this.get('media.0.remote_url')
            , 'fallback': this.get('media.0.remote_url')
            }
          ] : []
        }
      }, Belt.noop);

      next();
    });

    M.pre('save', function(next){
      if (!this.isModified('sync_hide') || this.get('sync_hide') === this.o_sync_hide) return next();

      if (this.get('sync_hide')){
        Request({
          'url': Instance.settings.notifications.platform_products_slack
        , 'method': 'post'
        , 'json': true
        , 'body': {
            'text': 'Product hidden: '
                  + this.get('brands.0')
                  + ' ' + this.get('label.us') + ' - ' + this.get('hide_note')
                  + ' <https://wanderset.com/product/' + this.get('slug') + '>'
          , 'username': 'INVENTORY-BOT'
          , 'icon_emoji': ':x:'
          , 'attachments': this.get('media.0.remote_url') ? [
              {
                'image_url': this.get('media.0.remote_url')
              , 'fallback': this.get('media.0.remote_url')
              }
            ] : []
          }
        }, Belt.np);
      } else {
        Request({
          'url': Instance.settings.notifications.platform_products_slack
        , 'method': 'post'
        , 'json': true
        , 'body': {
            'text': 'Product UNHIDDEN: '
                  + this.get('brands.0')
                  + ' ' + this.get('label.us')
                  + ' <https://wanderset.com/product/' + this.get('slug') + '>'
          , 'username': 'INVENTORY-BOT'
          , 'icon_emoji': ':fire:'
          , 'attachments': this.get('media.0.remote_url') ? [
              {
                'image_url': this.get('media.0.remote_url')
              , 'fallback': this.get('media.0.remote_url')
              }
            ] : []
          }
        }, Belt.np);
      }

      next();
    });
  }

  if (M.Instance.settings.environment !== 'production') M.post('save', function(){
    Instance.helpers.cache.throttled_LoadProductCategories(function(){
      Instance.log.warn('CATEGORIES: \n\n' + Belt.stringify(Instance.categories));
    });
  });

  M.pre('save', function(next){
    if (!this.get('refresh_media')) return next();

    Async.eachSeries(this.get('media') || [], function(e, cb2){
      if (!e.get('remote_url')) return cb2();

      console.log('Refreshing media for "' + e.get('_id').toString() + '"')
      e.uploadS3(function(){
        setTimeout(function(){
          cb2();
        }, 3000);
      })
    }, Belt.cw(next));
  });

  M.pre('save', function(next){
    if (!_.any(this.get('categories'))) return next();

    this.set({
      'categories': _.map(this.get('categories'), function(c){
        return c.toLowerCase();
      })
    });

    next();
  });

  M.pre('save', function(next){
    if (!this.get('downsample_media')) return next();

    Async.eachSeries(this.get('media') || [], function(e, cb2){
      if (!e.get('url')) return cb2();

      e.uploadDownsampleS3(function(){
        setTimeout(function(){
          cb2();
        }, 3000);
      })
    }, Belt.cw(next));
  });

  M.pre('save', function(next){
    if (!this.get('super_downsample_media')) return next();

    Async.eachSeries(this.get('media') || [], function(e, cb2){
      if (!e.get('url')) return cb2();

      e.uploadSuperDownsampleS3(function(){
        setTimeout(function(){
          cb2();
        }, 3000);
      })
    }, Belt.cw(next));
  });

  M.static('replaceProduct', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //old_product
      //new_product
    });

    Async.waterfall([
      function(cb){
        M.Instance.db.model('product').findOne({
          '_id': a.o.old_product
        }, Belt.cs(cb, gb, 'old_product', 1, 0));
      }
    , function(cb){
        if (!gb.old_product) return cb(new Error('Old product not found'));

        M.Instance.db.model('product').findOne({
          '_id': a.o.new_product
        }, Belt.cs(cb, gb, 'new_product', 1, 0));
      }
    , function(cb){
        if (!gb.new_product) return cb(new Error('New product not found'));

        M.Instance.db.model('media').find({
          'products.product': a.o.old_product
        }, Belt.cs(cb, gb, 'old_media', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.old_media || [], function(m, cb2){
          _.each(m.products, function(p){
            if (p.product.toString() === gb.old_product.get('_id').toString()){
              p.product = gb.new_product.get('_id');
            }
          });

          m.save(Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        M.Instance.db.model('set').find({
          'products': a.o.old_product
        }, Belt.cs(cb, gb, 'old_sets', 1, 0));
      }
    , function(cb){
        Async.eachSeries(gb.old_sets || [], function(m, cb2){
          m.products.pull(gb.old_product.get('_id'));
          m.products.push(gb.new_product.get('_id'));

          m.save(Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        gb.old_product.remove(Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  });

  M.method('syncProduct', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'strategy': M.Instance.controllers.vendor.sync_strategies.streetammo
    });

    Async.waterfall([
      function(cb){
        if (Belt.get(M.Instance.vendor_ids[Belt.get(self, 'vendor.toString()')], 'name') !== 'Streetammo')
          return cb(new Error('Cannot sync non-streetammo product'));

        a.o.strategy.SyncProduct({
          'vendor': self
        , 'url': Belt.get(self, 'source.record.url')
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  });

  return M;
};
