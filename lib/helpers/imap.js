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
  , FS = require('fs')
  , IMAP = require('imap')
;

module.exports = function(S){
  S.instance['imap_mailboxes'] = {};

  S['OpenMailbox'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //email
    });

    var ocb = _.once(a.cb)
      , imap = new IMAP(self.settings.imap_mailboxes[a.o.email]);

    if (self.instance.imap_mailboxes[a.o.email]) self.instance.imap_mailboxes[a.o.email].destroy();

    imap.on('ready', function(){
      imap.openBox('INBOX', function(){
        console.log('Opened IMAP mailbox "' + a.o.email + '"...');
        ocb();
      });
    });

    imap.on('error', function(err){
      console.log('Error opening IMAP mailbox "' + a.o.email + '!');
      self.OpenMailbox(a.o, ocb);
    });

    imap.on('end', function(){
      console.log('Ended connection to IMAP mailbox "' + a.o.email + '!');
      self.OpenMailbox(a.o, ocb);
    });

    self.instance.imap_mailboxes[a.o.email] = imap;

    imap.connect();
  };

  S['SearchMailbox'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //email
      //criteria
    });

    Async.waterfall([
      function(cb){

      }
    , function(cb){

      }
    ], function(err){

    });
  };

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        Async.eachSeries(_.keys(S.settings.imap_mailboxes), function(e, cb2){
          S.OpenMailbox({
            'email': e
          }, cb2);
        }, Belt.cw(cb));
      }
    ], function(err){
      if (err) S.emit('error', err);

      S.emit('ready');
    });
  }, 0);

};
