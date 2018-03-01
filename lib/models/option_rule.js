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
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Request = require('request')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var log = Instance.log;

  var GB = {

  };

  var M = new Mongoose.Schema({
    'value': {'type': String}
  , 'name': {'type': String}
  , 'category': {'type': String}
  , 'brand': {'type': String}
  , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
  , 'active': {'type': Boolean, 'default': true}
  , 'new_value': {'type': String}
  , 'new_name': {'type': String}
  , 'option_hide': {'type': Boolean, 'default': false}
  , 'value_hide': {'type': Boolean, 'default': false}
  , 'details': {'type': Object}
  });

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.index({
    'value': 1
  , 'name': 1
  , 'category': 1
  , 'active': 1
  , 'brand': 1
  , 'vendor': 1
  }, {
    'unique': 1
  });

  M.virtual('query').get(function(){
    var self = this
      , gb = {};

    gb['query'] = {};

    if (self.get('brand')) gb.brand = new RegExp(M.Instance.escapeRegExp(self.get('brand')), 'i');
    if (self.get('category')) gb.category = new RegExp(M.Instance.escapeRegExp('^' + self.get('category')), 'i');
    if (self.get('name')) gb.name = new RegExp(M.Instance.escapeRegExp('^' + self.get('name') + '$'), 'i');
    if (self.get('value')) gb.value = new RegExp(M.Instance.escapeRegExp('^' + self.get('value') + '$'), 'i');



    if (self.get('term')){
      gb['term'] = new RegExp(M.Instance.escapeRegExp(self.get('term')), 'i');

      gb.query['$or'] = [];

      _.each(self.get('term_fields'), function(f){
        if (gb.brand){
          gb.query.$or.push(_.object([
            f
          , 'brands'
          ], [
            gb.term
          , gb.brand
          ]));

          gb.query.$or.push(_.object([
            f
          , 'manual_brand'
          ], [
            gb.term
          , gb.brand
          ]));

        } else {
          gb.query.$or.push(_.object([
            f
          ], [
            gb.term
          ]));
        }
      });

    } else if (gb.brand) {
      gb.query['$or'] = [
        {
          'brands': gb.brand
        }
      , {
          'manual_brand': gb.brand
        }
      ];
    }

    if (self.get('vendor')) gb.query['vendor'] = self.get('vendor');

    return gb.query;
  });

  M['Instance'] = Instance;

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    if (!a.o.is_admin){

    }

    return obj;
  });

  M.method('toCSVObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {

    });

    if (!a.o.is_admin){

    }

    return obj;
  });

  return M;
};
