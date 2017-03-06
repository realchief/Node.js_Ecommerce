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
    'name': {'type': String, 'required': true}
  , 'label': Instance.helpers.internationalization.LocalitySchemaObject()
  , 'description': Instance.helpers.internationalization.LocalitySchemaObject()
  , 'options': {'type': Object, 'default': {}}
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor', 'required': true}
  , 'media': [
      {
        'url': {'type': String, 'required': true}
      , 'mime': {'type': String}
      , 'metadata': {
          'width': {'type': Number}
        , 'height': {'type': Number}
        }
      , 'options': {'type': Object}
      }
    ]
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);

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
