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
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var ProductSchema = new Mongoose.Schema({
    'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
  , 'options': {'type': Object}
  //, 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'x_coordinate': {'type': Number, 'min': 0}
  , 'y_coordinate': {'type': Number, 'min': 0}
  });

  ProductSchema.virtual('x_percentage').get(function(){
    return (this.get('x_coordinate') || 0) / (Belt.get(this.parent(), 'metadata.width') || 0);
  }).set(function(val){
    return;
  });

  ProductSchema.virtual('y_percentage').get(function(){
    return (this.get('y_coordinate') || 0) / (Belt.get(this.parent(), 'metadata.height') || 0);
  }).set(function(val){
    return;
  });

  var M = new Mongoose.Schema({
    'url': {'type': String}
  , 'mime': {'type': String}
  , 'remote_url': {'type': String}
  , 'slug': {'type': String}
  , 'metadata': {
      'width': {'type': Number}
    , 'height': {'type': Number}
    }
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'products': [ProductSchema]
  , 'setmembers': [
      {
        'setmember': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'setmember', 'required': true}
      , 'x_coordinate': {'type': Number, 'min': 0}
      , 'y_coordinate': {'type': Number, 'min': 0}
      }
    ]
  });

  M.virtual('local_path').get(function(){
    return this._local_path;
  }).set(function(val){
    this['_local_path'] = val;
  });

/*
  M.virtual('remote_url').get(function(){
    return this._remote_url;
  }).set(function(val){
    this['_remote_url'] = val;
  });
*/

  M.virtual('filename').get(function(){
    return this._filename;
  }).set(function(val){
    this['_filename'] = val;
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'url': 1
  });

  M.index({
    'slug': 1
  }, {
    'unique': true
  });

  M.method('uploadS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'path': self.get('local_path') ? self.get('local_path') : undefined
    , 'url': self.get('remote_url') ? self.get('remote_url') : undefined
    , 'filename': self.get('filename') ? self.get('filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + self.get('_id').toString() + '.' + (a.o.filename || a.o.path || a.o.url.replace(/(\?|#).*$/g, '')).split('.').pop()
    });
    a.o = _.defaults(a.o, {
      'mime': Mime.lookup(a.o.s3_path)
    });

    if (a.o.mime.match(/image/)) a.o['image_metadata'] = true;

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
        });

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
        self.populate('products.product', Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        Async.each(gb.doc.get('products'), function(p, cb2){
          p.get('product').populate('stocks', Belt.cw(cb2, 0));
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return a.cb(err, gb.doc);
    });
  });

  M.method('getMetadata', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        Instance.helpers.images.GetURLImageMetadata({
          'url': self.get('url')
        }, Belt.cs(cb, gb, 'geometry', 1, 0));
      }
    , function(cb){
        if (Belt.get(gb, 'geometry.width')) self.set({
          'metadata': gb.geometry
        });

        cb();
      }
    , function(cb){
        self.save(Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, self);
    });
  });

/*
  M.pre('validate', function(next){
    if (this.get('label') && this.isModified('label') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('label')
    })) return next(new Error('Label localities are invalid'));

    if (this.get('description') && this.isModified('description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('description')
    })) return next(new Error('Description localities are invalid'));

    return next();
  });
*/

  M.pre('save', function(next){
    if (!this.get('local_path') && !this.get('remote_url')) return next();

    var self = this;

    self.uploadS3(function(err){
      self.set({
        //'remote_url': undefined
        'local_path': undefined
      });

      next(err);
    });
  });

  M.pre('save', function(next){
    if (!this.get('slug')) this.set({
      'slug': Shortid.generate()
    });
    return next()
  });

  M.pre('save', function(next){
    if (!this.get('url')) return next(new Error('URL is required'));
    return next()
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();

    _.extend(obj, {
      'products': _.map(self.get('products'), function(s){
        var o = s.toObject();
        o['product'] = Belt.get(s, '.product.toSanitizedObject()') || o.product;
        o['x_percentage'] = s.get('x_percentage');
        o['y_percentage'] = s.get('y_percentage');

        return o;
      })
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  M.post('remove', function(doc){
    Async.waterfall([
      function(cb){
        Instance.db.model('stock').find({
          'media': doc._id
        }, function(err, docs){
          Async.eachSeries(docs, function(d, cb2){
            d.remove(Belt.cw(cb2, 0));
          }, Belt.cw(cb, 0));
        });
      }
    ], function(err){
      if (err) Instance.emit('error', err);
    });
  });

  return M;
};
