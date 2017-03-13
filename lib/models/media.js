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

  var M = new Mongoose.Schema({
    'url': {'type': String}
  , 'mime': {'type': String}
  , 'metadata': {
      'width': {'type': Number}
    , 'height': {'type': Number}
    }
  , 'label': Instance.helpers.locality.LocalitySchemaObject()
  , 'description': Instance.helpers.locality.LocalitySchemaObject()
  , 'products': [
      {
        'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product', 'required': true}
      , 'options': {'type': Object}
      , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
      , 'x_percentage': {'type': Number, 'min': 0, 'max': 1}
      , 'y_percentage': {'type': Number, 'min': 0, 'max': 1}
      }
    ]
  , 'setmembers': [
      {
        'setmember': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'setmember', 'required': true}
      , 'x_percentage': {'type': Number, 'min': 0, 'max': 1}
      , 'y_percentage': {'type': Number, 'min': 0, 'max': 1}
      }
    ]
  });

  M.virtual('local_path').get(function(){
    return this._local_path;
  }).set(function(val){
    this['_local_path'] = val;
  });

  M.virtual('local_url').get(function(){
    return this._local_url;
  }).set(function(val){
    this['_local_url'] = val;
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'url': 1
  });

  M.method('uploadS3', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'path': self.get('local_path') ? self.get('local_path') : undefined
    , 'url': self.get('local_url') ? self.get('local_url') : undefined
    });
    a.o = _.defaults(a.o, {
      's3_path': O.name + '/' + self.get('_id').toString() + '.' + (a.o.path || a.o.url.replace(/(#|\?).*$/g, '')).split('.').pop()
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

  M.pre('validate', function(next){
    if (this.get('label') && this.isModified('label') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('label')
    })) return next(new Error('Label localities are invalid'));

    if (this.get('description') && this.isModified('description') && !Instance.helpers.locality.ValidateLocalitySchemaObject({
      'object': this.get('description')
    })) return next(new Error('Description localities are invalid'));

    return next();
  });

  M.pre('save', function(next){
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

    });

    _.omit(obj, [

    ]);

    return obj;
  });

  return M;
};
