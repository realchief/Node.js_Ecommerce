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
  , Request = require('request')
  , SES = require('nodemailer-ses-transport')
  , CSV = require('fast-csv')
;

module.exports = function(S){

  S.instance['SES'] = Nodemailer.createTransport(SES(S.settings.aws));
  S.mailer = S.instance.SES;
  S.instance['mailer'] = S.mailer;

  S.instance.express.all('/email/subscribe.json', function(req, res){
    var email = Belt.get(req.data(), 'email');

    if (!email || !email.match || !email.match(Belt.email_regexp)) return res.status(200).end();

    S.instance.db.model('user').findOneAndUpdate({
      'email': email
    }, {
      '$set': {
        'email': email
      , 'roles.subscriber': true
      }
    }, {
      'upsert': true
    }, Belt.np)

    if (Belt.get(S, 'settings.notifications.email_subscription_slack')){
      Request({
        'url': S.settings.notifications.email_subscription_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': 'New email subscriber: ' + email
        , 'username': 'EMAIL-SUBSCRIPTION'
        , 'icon_emoji': ':email:'
        }
      }, Belt.np);
    };

    res.status(200).end();
  });

  S.instance.express.all('/admin/email/subscriber/list.json', function(req, res){
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
          , 'email': Belt.get(d, 'buyer.email').toLowerCase()
          , 'subscriber': Belt.get(d, 'buyer.subscriber') ? true : false
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

  S.instance.express.all('/admin/email/subscriber/list.csv', function(req, res){
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
          , 'email': Belt.get(d, 'buyer.email').toLowerCase()
          , 'subscriber': Belt.get(d, 'buyer.subscriber') ? true : false
          };
        }), 'email');

        cb();
      }
    ], function(err){
      if (err) return res.end(err.message);

      var csv = CSV.format({'headers': true});

      csv.pipe(res.status(200).type('text/csv'));

      _.each(gb.emails || [], function(d){
        csv.write(d);
      });

      csv.end();
    });
  });

  S.instance.express.all('/email/modal/viewed.json', function(req, res){
    req.session['viewed_subscribe_modal'] = true;

    res.status(200).json({'status': 'OK'});
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
