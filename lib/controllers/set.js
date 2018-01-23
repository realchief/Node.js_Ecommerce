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
  , CRUD = require('./helpers/crud.js')
  , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
;

module.exports = function(S){
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  /**
   * @api {post} /set/create.json Create Set
   * @apiName CreateSet
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */
    S.instance.express.post('/' + S.name + '/create.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          _.each([
            ''
          , 'mobile_'
          , 'logo_'
          , 'landing_'
          ], function(p){
            if (Belt.get(a.o, 'files.' + p + 'file')){
              Belt.set(a.o.data, p + 'local_path', a.o.files[p + 'file'].path);
            }
          });

          self.model.create(a.o.data, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /set/:_id/read.json Read Set
   * @apiName ReadSet
   * @apiGroup Set
   * @apiPermission public
   *
   */
    S.instance.express.get('/' + S.name + '/:_id/read.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            'slug': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      , function(cb){
          if (gb.doc) return cb();

          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
/*
      , function(cb){
          if (!gb.doc) return cb(new Error('set not found'));

          gb.doc.populate('media', Belt.cw(cb, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('set not found'));

          gb.doc.populateProducts(Belt.cw(cb, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('set not found'));

          gb.doc.populateMediaProducts(Belt.cw(cb, 0));
        }
*/
      , function(cb){
          if (!gb.doc) return cb();

          gb.doc = Belt.get(gb, 'doc.toSanitizedObject()');

          gb.doc.media = _.map(gb.doc.media, function(m){
            return {
              '_id': m
            };
          });

          gb.doc.products = _.map(gb.doc.products, function(m){
            return {
              '_id': m
            };
          });

          cb();
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': gb.doc
        });
      });
    });

  /**
   * @api {put} /set/:_id/update.json Update Set
   * @apiName UpdateSet
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/update.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            'slug': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      , function(cb){
          if (gb.doc) return cb();

          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('set not found'));

          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          _.each([
            ''
          , 'mobile_'
          , 'logo_'
          , 'landing_'
          ], function(p){
            if (Belt.get(a.o, 'files.' + p + 'file')){
              Belt.set(a.o.data, p + 'local_path', a.o.files[p + 'file'].path);
              gb['invalidate_cdn'] = true;
            }
          });

          if (a.o.data.products) a.o.data.products = Belt.arrayDefalse(a.o.data.products);
          if (a.o.data.media) a.o.data.media = Belt.arrayDefalse(a.o.data.media);
          if (a.o.data.sync_from_sets) a.o.data.sync_from_sets = Belt.arrayDefalse(a.o.data.sync_from_sets);

          gb.doc.set(_.omit(a.o.data, [
            '_id'
          ]));

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('products media', Belt.cw(cb, 0));
        }
      ], function(err){
        setTimeout(function(){
          S.instance.helpers.cloudfront.InvalidateSetMedia();
        }, 1000 * 60 * 2);

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {delete} /set/:_id/delete.json Delete Set
   * @apiName DeleteSet
   * @apiGroup Set
   * @apiPermission admin, current setmember user
   *
   */
    S.instance.express.delete('/' + S.name + '/:_id/delete.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.findOne({
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error(S.name + ' not found'));

          gb.doc.remove(Belt.cw(cb, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /set/list.json List Sets
   * @apiName ListSet
   * @apiGroup Set
   * @apiPermission admin, public
   *
   */
    S.instance.express.all('/' + S.name + '/list.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          //a.o.data.populate = 'products media';

          self.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'docs.[].toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /set/count.json Count Set
   * @apiName CountSet
   * @apiGroup Set
   * @apiPermission admin, public
   *
   */
    S.instance.express.all('/' + S.name + '/count.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          self.count(a.o.data, Belt.cs(cb, gb, 'count', 1, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'count')
        });
      });
    });

    S.instance.express.all('/' + S.name + '/:_id/product/:product/add.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      Async.waterfall([
        function(cb){
          return self.model.addProduct({
            'set': req.params._id
          , 'product': req.params.product
          , 'populate': true
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/' + S.name + '/:_id/product/:product/remove.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.removeProduct({
            'set': req.params._id
          , 'product': req.params.product
          , 'populate': true
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/' + S.name + '/:_id/media/:media/add.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.addMedia({
            'set': req.params._id
          , 'media': req.params.media
          , 'populate': true
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/' + S.name + '/:_id/media/:media/remove.json', function(req, res){
      var a = {
        'o': _.extend({}, {
               'data': req.data()
             , 'session': req.session
             , 'files': req.files
             })
      }, self = S
       , gb = {};
      a.o = _.defaults(a.o, {

      });

      return Async.waterfall([
        function(cb){
          return self.model.removeProduct({
            'set': req.params._id
          , 'media': req.params.media
          , 'populate': true
          }, Belt.cs(cb, gb, 'doc', 1));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err) S.emit('error', err);
      return S.emit('ready');
    });
  }, 0);
};
