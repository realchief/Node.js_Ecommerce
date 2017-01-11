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
;

module.exports = function(S){

////////////////////////////////////////////////////////////////////////////////
//// METHODS
////////////////////////////////////////////////////////////////////////////////

  S.instance.express.all('/', function(req, res){
    return res.status(200).type('text/html').end(S.instance.renderView(req, 'coming-soon'));
  });

  S.instance.express.all('/signup.json', function(req, res){
    var gb = req.data();

    return Async.waterfall([
      function(cb){
        if (!gb.email || !gb.email.match(Belt.email_regexp)) return cb(new Error('Email is invalid'));

        gb.email = gb.email.toLowerCase();

        Request({
          'url': S.settings.notifications.coming_soon
        , 'method': 'post'
        , 'form': {
            'email': gb.email
          }
        }, Belt.cw(cb));
      }
    , function(cb){
        S.instance.SES.sendMail({
          'to': gb.email
        , 'from': S.settings.email.from
        , 'subject': 'Thanks for Subscribing!'
        , 'html': '<p>Thank you for signing up for the Wanderset email list. Exciting things are in the works and we will keep you updated as we progress!</p><p>Please invite your friends to join.</p>'
        , 'text': Belt.strip_html('<p>Thank you for signing up for the Wanderset email list. Exciting things are in the works and we will keep you updated as we progress!</p><p>Please invite your friends to join.</p>')
        }, Belt.cw(cb, 0));
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
