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
  , Paypal = require('paypal-rest-sdk')
;

module.exports = function(S){
  Paypal.configure({
    'mode': S.settings.environment.match(/^production/) ? 'live' : 'sandbox'
  , 'client_id': S.settings.paypal.client_id
  , 'client_secret': S.settings.paypal.secret
  });

  S.instance.paypal = Paypal;

////////////////////////////////////////////////////////////////////////////////
//// METHODS
////////////////////////////////////////////////////////////////////////////////

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
