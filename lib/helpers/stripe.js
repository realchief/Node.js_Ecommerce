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
  , Stripe = require('stripe')
  , FS = require('fs')
;

module.exports = function(S){

  S.instance['stripe'] = Stripe(S.settings.stripe.secret_key);

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
