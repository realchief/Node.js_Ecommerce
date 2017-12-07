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

  S.instance.on('error', function(err, label, data){
    S.log.error(err);

    if (Belt.get(S, 'settings.notifications.error')){
      Request({
        'url': S.settings.notifications.error
      , 'method': 'post'
      , 'form': {
          'event': 'server error'
        , 'message': Belt.get(err, 'message')
        }
      }, Belt.np);
    }

    if (Belt.get(S, 'settings.notifications.platform_errors_slack')){
      Request({
        'url': S.settings.notifications.platform_errors_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': err.message + '\n'
                + (label ? ' [' + label + ']\n' : '')
                + (data ? Belt.stringify(data) + '\n' : '')
                + err.stack
        , 'username': S.settings.environment.toUpperCase() + '-ERROR'
        , 'icon_emoji': ':rotating_light:'
        }
      }, Belt.np);
    }

  });

  S.instance['ErrorNotification'] = function(err, method, data){
    S.instance.emit('error', err, method, data);
  };

  S.instance.on('ready', function(){
    if (Belt.get(S, 'settings.notifications.development_slack')){
      Request({
        'url': S.settings.notifications.development_slack
      , 'method': 'post'
      , 'json': true
      , 'body': {
          'text': S.settings.environment.toUpperCase() + ' server started!'
        , 'username': 'STATUS-BOT'
        , 'icon_emoji': ':rocket:'
        }
      }, Belt.np);
    }
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
