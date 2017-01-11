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

  S.instance.on('error', function(err){
    S.log.error(err);

    if (Belt.get(S, 'settings.notifications.error')){
      Request({
        'url': S.settings.notifications.error
      , 'method': 'post'
      , 'form': {
          'event': 'server error'
        , 'message': Belt.get(err, 'message')
        }
      }, Belt.noop);
    }
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
