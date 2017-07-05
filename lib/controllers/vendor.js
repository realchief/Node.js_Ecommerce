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
  S = CRUD(S, {
    'create_routes': S.settings.create_rest_routes ? true : false
  });
  S = Validate(S);

  S.instance.express.all('/' + S.name + '/:name/iterate.json', function(req, res){
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
        self.model.findOne({
          'name': req.params.name
        }, Belt.cs(cb, gb, 'doc', 1, 0));
      }
    , function(cb){
        gb['products'] = [];

        self.instance.helpers.hub.IterateProducts({
          'shop': gb.doc.get('shopify.shop')
        , 'access_token': gb.doc.get('shopify.access_token')
        , 'progress_cb': function(p, cb2){
            console.log(Belt.stringify(p));
            gb.products.push(p);
            cb2();
          }
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': Belt.get(gb, 'products')
      });
    });
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);
};
