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
  , 'featured_media': {
      'url': {'type': String}
    , 'mime': {'type': String}
    , 'metadata': {
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
    }
  , 'logo_media': {
      'url': {'type': String}
    , 'mime': {'type': String}
    , 'metadata': {
        'width': {'type': Number}
      , 'height': {'type': Number}
      }
    }
  , 'products': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
    ]
  , 'setmembers': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'setmember', 'required': true}
    ]
  , 'media': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'media', 'required': true}
    ]
  , 'brand': {'type': Boolean, 'default': false}
  , 'hide': {'type': Boolean, 'default': false}
  , 'homepage': {'type': Boolean, 'default': false}
  });

  _.each([
    ''
  , 'mobile_'
  , 'logo_'
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
    , 'url': self.get(a.o.prefix + 'remote_url') ? self.get(a.o.prefix + 'remote_url') : undefined
    , 'filename': self.get(a.o.prefix + 'filename') ? self.get(a.o.prefix + 'filename') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + a.o.prefix + self.get('_id').toString() + '.' + (a.o.filename || a.o.path || a.o.url.replace(/(\?|#).*$/g, '')).split('.').pop()
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
        var obj = {};
        obj[a.o.dest_path] = {
          'url': gb.upload.url
        , 'mime': a.o.mime
        , 'metadata': gb.upload.metadata
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
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
