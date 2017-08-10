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

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
