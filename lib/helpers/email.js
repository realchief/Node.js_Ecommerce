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
  , Nodemailer = require('nodemailer')
  , SES = require('nodemailer-ses-transport')
;

module.exports = function(S){

  S.instance['SES'] = Nodemailer.createTransport(SES(S.settings.aws));
  S.mailer = S.instance.SES;
  S.instance['mailer'] = S.mailer;

  S.instance.express.all('/email/subscriber/list.json', function(req, res){
    var a = {
      'o': _.extend({}, {
             'data': req.data()
           , 'session': req.session
           })
    }, self = S
     , gb = {};
    a.o = _.defaults(a.o, {

    });
    a.o.data['query'] = {
      'buyer.subscriber': true
    };

    return Async.waterfall([
      function(cb){
        self.instance.controllers.order.list(a.o.data, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        gb['emails'] = _.uniq(_.map(Belt.get(gb, 'docs.[].toSanitizedObject()'), function(d){
          return {
            'first_name': Belt.get(d, 'buyer.first_name')
          , 'last_name': Belt.get(d, 'buyer.last_name')
          , 'email': Belt.get(d, 'buyer.email')
          };
        }), 'email');

        cb();
      }
    ], function(err){
      return res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': gb.emails
      });
    });
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
