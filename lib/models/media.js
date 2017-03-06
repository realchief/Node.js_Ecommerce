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
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var M = new Mongoose.Schema({
    'url': {'type': String, 'required': true}
  , 'mime': {'type': String}
  , 'metadata': {
      'width': {'type': Number}
    , 'height': {'type': Number}
    }
  , 'label': Instance.helpers.internationalization.LocalitySchemaObject()
  , 'description': Instance.helpers.internationalization.LocalitySchemaObject()
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

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);

  M.index({
    'url': 1
  });

  M.method('uploadS3File', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'path': self.get('local_path')
    });
    a.o = _.defaults(a.o, {
      's3_path': '/media/' + self.get('_id').toString() + '.' + a.o.path.split('.').pop()
    });
    a.o = _.defaults(a.o, {
      'mime': Mime.lookup(a.o.s3_path)
    });

    return Async.waterfall([
      function(cb){
        return M.Instance.helpers.s3.uploadPath(a.o, Belt.cs(cb, gb, 'url', 1, 0));
      }
    , function(cb){
        self.set({
          'url': gb.url
        , 'mime': a.o.mime
        });

        return cb();
      }
    ], function(err){
      return a.cb(err, self);
    });
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
