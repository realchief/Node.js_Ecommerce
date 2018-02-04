var _ = require('underscore')
  , Belt = require('jsbelt')
  , Mongoose = require('mongoose')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'page': {'type': String, 'required': true}
  , 'data': {'type': Object}
  });

  M['Instance'] = Instance;

  return M;
};
