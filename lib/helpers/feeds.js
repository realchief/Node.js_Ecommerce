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
  , Auth = require('basic-auth')
  , XML = require('xml')
;

module.exports = function(S){

  S.instance.express.all('/wanderset-google-shopping-feed.xml', function(req, res){
    return res.sendFile(Path.join(S.settings.__dirname, '/tmp/wanderset-google-shopping-feed.xml'));
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
