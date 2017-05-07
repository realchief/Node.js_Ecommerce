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
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var MediaSchema = new Mongoose.Schema({
    'url': {'type': String}
  , 'mime': {'type': String}
  , 'metadata': {
      'width': {'type': Number}
    , 'height': {'type': Number}
    }
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

  MediaSchema.virtual('remote_url').get(function(){
    return this._remote_url;
  }).set(function(val){
    this['_remote_url'] = val;
  });

  MediaSchema.virtual('filename').get(function(){
    return this._filename;
  }).set(function(val){
    this['_filename'] = val;
  });

  MediaSchema.method('uploadS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'path': self.get('local_path') ? self.get('local_path') : undefined
    , 'url': self.get('remote_url') ? self.get('remote_url') : undefined
    , 'filename': self.get('filename') ? self.get('filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/media-' + self.get('_id').toString() + '.' + (a.o.filename || a.o.path || a.o.url.replace(/(\?|#).*$/g, '')).split('.').pop()
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

  /*MediaSchema.pre('validate', function(next){
    if (this.get('label') && this.isModified('label') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('label')
    })) return next(new Error('Label localities are invalid'));

    if (this.get('description') && this.isModified('description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('description')
    })) return next(new Error('Description localities are invalid'));

    return next();
  });*/

  MediaSchema.pre('save', function(next){
    if (!this.get('local_path') && !this.get('remote_url')) return next();

    var self = this;

    self.uploadS3(function(err){
      self.set({
        'local_url': undefined
      , 'local_path': undefined
      });

      next(err);
    });
  });

  MediaSchema.pre('save', function(next){
    if (!this.get('url')) return next(new Error('URL is required'));
    return next();
  });

  var M = new Mongoose.Schema({
    'name': {'type': String, 'required': true}
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'options': {'type': Object, 'default': {}}
  , 'media': [MediaSchema]
  , 'stocks': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'stock'}
    ]
  , 'categories': [
      {'type': String}
//      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'category'}
    ]
  , 'brands': [
      {'type': String}
    ]
  , 'vendors': [
      {'type': String}
//      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
    ]
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'name': 1
  });

  M['MediaSchema'] = MediaSchema;

  M.method('createStock', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'product': self.get('_id')
    });

    M.Instance.db.model('stock').create(a.o, function(err, doc){
      if (err) return a.cb(err);

      self.stocks.addToSet(doc.get('_id'));

      self.save(a.cb);
    });
  });

  M.method('getConfigurations', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    if (!self.populated('stocks')) return {};

    var obj = {};
    _.each(self.get('stocks'), function(s){
      var o_string = _.map(s.options, function(v, k){
        return k + ':' + v.value;
      }).join(';') || '';

      obj[o_string] = obj[o_string] || {
        'stocks': []
      , 'price': 0
      , 'available_quantity': 0
      , 'options': Belt.copy(s.options)
      };

      if (s.price > obj[o_string].price) obj[o_string].price = s.price;
      obj[o_string].available_quantity += (s.available_quantity || 0)

      obj[o_string].stocks.push(s._id.toString());
    });

    return obj;
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

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
//      'vendor': self.populated('vendor') ? self.get('vendor').toSanitizedObject(a.o) : obj.vendor
      'stocks': self.populated('stocks') ? _.map(self.get('stocks'), function(s){
        return s.toSanitizedObject(a.o);
      }) : obj.stocks
    , 'configurations': self.getConfigurations()
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
