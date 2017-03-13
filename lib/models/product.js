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
  });

  MediaSchema.plugin(Timestamps);

  MediaSchema.virtual('local_path').get(function(){
    return this._local_path;
  }).set(function(val){
    this['_local_path'] = val;
  });

  MediaSchema.virtual('local_url').get(function(){
    return this._local_url;
  }).set(function(val){
    this['_local_url'] = val;
  });

  MediaSchema.method('uploadS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'path': self.get('local_path') ? self.get('local_path') : undefined
    , 'url': self.get('local_url') ? self.get('local_url') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': '/' + O.name + '/media-' + self.get('_id').toString() + '.' + (a.o.path || a.o.url).split('.').pop()
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

  MediaSchema.pre('save', function(next){
    if (!this.get('local_path') && !this.get('local_url')) return next();

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
  , 'option_names': {'type': Object, 'default': {}}
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'media': [MediaSchema]
  , 'stocks': [
      {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'stock'}
    ]
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M['MediaSchema'] = MediaSchema;

  M.method('createStock', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    M.Instance.db.model('stock').create(a.o, function(err, doc){
      if (err) return a.cb(err);

      self.stocks.addToSet(doc.get('_id'));

      self.save(a.cb);
    });
  });

  M.pre('validate', function(next){
    if (this.get('label') && this.isModified('label') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('label')
    })) return next(new Error('Label localities are invalid'));

    if (this.get('description') && this.isModified('description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('description')
    })) return next(new Error('Description localities are invalid'));

    return next();
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
      'vendor': self.isPopulated('vendor') ? self.get('vendor').toSanitizedObject(a.o) : obj.vendor
    , 'stocks': self.isPopulated('stocks') ? _.map(self.get('stocks'), function(s){
        return s.toSanitizedObject(a.o);
      }) : obj.stocks
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
