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
  , CSV = require('fast-csv')
  , OS = require('os')
;

module.exports = function(S){
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  /**
   * @api {post} /product/create.json Create Product
   * @apiName Create Product
   * @apiGroup Product
   * @apiPermission admin, current setmember user
   *
   */
    S.instance.express.post('/' + S.name + '/create.json', function(req, res){
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
          return self.model.create(a.o.data
          , Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateProduct', {
          'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /product/:_id/read.json Read Product
   * @apiName ReadProduct
   * @apiGroup Product
   * @apiPermission admin, public
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
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'ReadProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {put} /product/:_id/update.json Update Product
   * @apiName UpdateProduct
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/update.json', function(req, res){
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
      , function(cb) {
        if (!gb.doc) return cb(new Error('product not found'));
        if (!a.o.data.parent_id || !gb.doc.get('parent_id')) {
          a.o.data = _.omit(a.o.data, ['parent_id']);
          return cb();
        }

        S.instance.db.model('product').findOne({
          '_id': a.o.data.parent_id
        }, function(err, doc) {
          if (!doc) return cb(new Error('Parent with this ID not found'));
          a.o.data.media = doc.get('media');
          cb();
        })
      }
      , function(cb){

          gb.doc.set(_.omit(a.o.data, [
            '_id'
          ]));

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'UpdateProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {delete} /product/:_id/delete.json Delete Product
   * @apiName DeleteProduct
   * @apiGroup Product
   * @apiPermission admin
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
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.remove(Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'DeleteProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /product/list.json List Products
   * @apiName ListProduct
   * @apiGroup Product
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
          a.o.data.populate = 'stocks';

          self.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'ListProduct', {
          'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'docs.[].toSanitizedObject()')
        });

        /*
        gb.docs = _.map(Belt.get(gb, 'docs.[].toSanitizedObject()'), function(m){
          return _.omit(m, [
            'sets'
          ]);
        });
        return res.status(200).json(gb.docs);
        */
      });
    });

  /**
   * @api {get} /product/export.csv Export Products CSV
   * @apiName ExportProduct
   * @apiGroup Product
   * @apiPermission admin, public
   *
   */
    S.instance.express.all('/' + S.name + '/export.csv', function(req, res){
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
          a.o.data.populate = 'stocks';
          //a.o.data.limit = Infinity;

          self.listAll(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          gb['objs'] = Belt.get(gb, 'docs.[].toCSVObject()');
          gb['fields'] = {};
          _.each(gb.objs, function(v, k){
            _.each(v, function(v2, k2){
              gb.fields[k2] = '';
            });
          });

          cb();
        }
      ], function(err){
        if (err){
          S.instance.ErrorNotification(err, 'ProductCSVExport', {
            'data': a.o.data
          });

          return res.end(err.message);
        }

        var csv = CSV.format({'headers': true})
                     .transform(function(doc, next){
                       next(null, _.extend({}, gb.fields, doc));
                     });

        csv.pipe(res.status(200).type('text/csv'));

        _.each(gb.objs || [], function(d){
          csv.write(d);
        });

        csv.end();
      });
    });

  /**
   * @api {get} /product/count.json Count Products
   * @apiName CountProduct
   * @apiGroup Product
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
        if (err) S.instance.ErrorNotification(err, 'CountProduct', {
          'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'count')
        });
      });
    });

  /**
   * @api {post} /product/:_id/media/create.json Create Product Media
   * @apiName CreateProductMedia
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.post('/' + S.name + '/:_id/media/create.json', function(req, res){
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
          if (!gb.doc) return cb(new Error('product not found'));

          if (a.o.data.json){
            _.extend(a.o.data, JSON.parse(a.o.data.json));
            delete a.o.data.json
          }

          delete a.o.data._id;

          if (a.o.files.file){
            a.o.data['local_path'] = a.o.files.file.path;
          }

          gb.doc.media.push(a.o.data);

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateProductMedia', {
          '_id': Belt.get(gb, 'doc._id')
        , 'files': a.o.files
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {put} /product/:_id/media/:media/update.json Update Product Media
   * @apiName UpdateProductMedia
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/media/:subdoc/update.json', function(req, res){
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
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb['subdoc'] = _.find(gb.doc.media, function(s){
            return s.get('_id').toString() === req.params.subdoc;
          });

          if (!gb.subdoc) return cb(new Error('media not found'));

          gb.subdoc.set(_.omit(a.o.data, [
            '_id'
          , 'subdoc'
          ]));

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateProductMedia', {
          '_id': Belt.get(gb, 'doc._id')
        , 'files': a.o.files
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {delete} /product/:_id/media/:media/delete.json Delete Product Media
   * @apiName DeleteProductMedia
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/media/:subdoc/delete.json', function(req, res){
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
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.media.pull(req.params.subdoc);

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'DeleteProductMedia', {
          '_id': Belt.get(gb, 'doc._id')
        , 'files': a.o.files
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {post} /product/:_id/stock/create.json Create Product Stock
   * @apiName Create Product Stock
   * @apiGroup Product
   * @apiPermission admin, current setmember user
   *
   */
    S.instance.express.post('/' + S.name + '/:_id/stock/create.json', function(req, res){
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
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.createStock(_.omit(a.o.data, [
            '_id'
          ]), Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'CreateProductStock', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {put} /product/:_id/stock/:stock/update.json Update Product Stock
   * @apiName UpdateProductStock
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.post('/' + S.name + '/:_id/stock/:subdoc/update.json', function(req, res){
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
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb['subdoc'] = _.find(gb.doc.stocks, function(s){
            return s.toString() === req.params.subdoc;
          });

          if (!gb.subdoc) return cb(new Error('stock not found'));

          return self.db.model('stock').findOne({
            '_id': req.params.subdoc
          }, Belt.cs(cb, gb, 'subdoc', 1, 0));
        }
      , function(cb){
          if (!gb.subdoc) return cb(new Error('stock not found'));

          gb.subdoc.set(_.omit(a.o.data, [
            '_id'
          , 'subdoc'
          ]));

          gb.subdoc.save(Belt.cw(cb, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'UpdateProductStock', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {delete} /product/:_id/stock/:stock/delete.json Delete Product Stock
   * @apiName DeleteProductStock
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/stock/:subdoc/delete.json', function(req, res){
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
            '_id': req.params._id
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          return self.db.model('stock').findOne({
            '_id': req.params.subdoc
          }, Belt.cs(cb, gb, 'subdoc', 1, 0));
        }
      , function(cb){
          if (!gb.subdoc) return cb(new Error('stock not found'));

          gb.subdoc.remove(Belt.cw(cb, 0));
        }
      , function(cb){
          gb.doc.stocks.pull(req.params.subdoc);

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      , function(cb){
          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'DeleteProductStock', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {get} /product/:_id/availability.json Get Product Availability
   * @apiName ProductAvailability
   * @apiGroup Product
   * @apiPermission public
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/availability.json', function(req, res){
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
          return self.model.getStock({
            'product': req.params._id
          , 'available_quantity': a.o.data.available_quantity || 1
          , 'options': a.o.data.options || {}
          }, Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'ProductAvailability', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

  /**
   * @api {post} /product/old/:old_product/new/:new_product/replace.json Replace Product
   * @apiName ProductReplace
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/old/:old_product/new/:new_product/replace.json', function(req, res){
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
          return self.model.replaceProduct({
            'old_product': req.params.old_product
          , 'new_product': req.params.new_product
          }, Belt.cw(cb, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'ProductReplace', {
          'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        });
      });
    });

  /**
   * @api {put} /product/:_id/configurations/update.json Update Product Configurations
   * @apiName UpdateConfigurationsProduct
   * @apiGroup Product
   * @apiPermission admin
   *
   */
    S.instance.express.all('/' + S.name + '/:_id/configurations/update.json', function(req, res){
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
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.populate('stocks', Belt.cw(cb, 0));
        }
      , function(cb){
          gb.doc.getConfigurations();

          gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
        }
      ], function(err){
        if (err) S.instance.ErrorNotification(err, 'UpdateConfigurationsProduct', {
          '_id': Belt.get(gb, 'doc._id')
        , 'data': a.o.data
        });

        return res.status(200).json({
          'error': Belt.get(err, 'message')
        , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
        });
      });
    });

    S.instance.express.all('/admin/' + S.name + '/:_id/sync.json', function(req, res){
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
      , function(cb){
          if (!gb.doc) return cb(new Error('product not found'));

          gb.doc.syncProduct(Belt.cw(cb, 0));
        }
      ], function(err){
        return res.status(200).json({
          'error': Belt.get(err, 'message')
        });
      });
    });

  setTimeout(function(){
    return Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err) S.instance.ErrorNotification(err, 'SetupProductController', {

      });

      return S.emit('ready');
    });
  }, 0);
};
