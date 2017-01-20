#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Winston = require('winston')
  , Events = require('events')
  , Moment = require('moment')
  , Str = require('underscore.string')
  , Request = require('request')
  , CRUD = require('../../node_modules/basecmd/lib/controllers/helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
;

module.exports = function(S){
  S = CRUD(S);
  S = Validate(S);

  S.instance.express.all('/' + S.name + '/count.json', function(req, res){
    var a = {
      'o': _.extend({}, req.data(), req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        return self.count(a.o, Belt.cs(cb, gb, 'count', 1, 0));
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': gb.count || 0
      });
    });
  });

  S.instance.express.all('/' + S.name + '/list.json', function(req, res){
    var a = {
      'o': _.extend({}, req.data(), req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        return self.list(a.o, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': Belt.get(gb, 'docs.[].toSanitizedObject()')
      });
    });
  });

  S.instance.express.all('/' + S.name + '/create.json', function(req, res){
    var a = {
      'o': _.extend({
        'data': req.data()
      }, req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        return self.create(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error(self.name + ' not found'));

        self.instance.io.to(self.name + ':list')
                        .emit(self.name + ':create', gb.doc.toSanitizedObject());

        return cb();
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
      });
    });
  });

  S.instance.express.all('/' + S.name + '/:_id/read.json', function(req, res){
    var a = {
      'o': _.extend({}, req.data(), req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        return self.read({
          'query': {
            '_id': req.params._id
          }
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error(self.name + ' not found'));
        return cb();
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
      });
    });
  });

  S.instance.express.all('/' + S.name + '/read.json', function(req, res){
    var a = {
      'o': _.extend({}, req.data(), req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        return self.read(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error(self.name + ' not found'));
        return cb();
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
      });
    });
  });

  S.instance.express.all('/' + S.name + '/:_id/update.json', function(req, res){
    var a = {
      'o': _.extend({}, req.data(), req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {
      'query': {
        '_id': req.params._id
      }
    });

    return Async.waterfall([
      function(cb){
        return self.update(a.o, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        if (!gb.doc) return cb(new Error(self.name + ' not found'));

        self.instance.io.to(self.name + ':' + req.params._id)
                        .emit(self.name + ':' + req.params._id + ':update', gb.doc.toSanitizedObject());

        return cb();
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
      });
    });
  });

  S.instance.express.all('/' + S.name + '/:_id/delete.json', function(req, res){
    var a = {
      'o': _.extend({}, req.data(), req.session)
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {
      'query': {
        '_id': req.params._id
      }
    });

    return Async.waterfall([
      function(cb){
        return self.delete(a.o, Belt.cw(cb, 0));
      }
    , function(cb){
        self.instance.io.to(self.name + ':' + req.params._id)
                        .emit(self.name + ':' + req.params._id + ':delete');

        return cb();
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      });
    });
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
