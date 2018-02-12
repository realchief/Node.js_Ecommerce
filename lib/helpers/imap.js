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

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        Async.eachSeries(_.keys(S.settings.imap_mailboxes), function(e, cb2){
          var ocb = _.once(cb2);

          S.instance.imap_mailboxes[e] = new IMAP(S.settings.imap_mailboxes[e]);
          S.instance.imap_mailboxes[e].once('ready', function(){
            S.instance.imap_mailboxes[e].openBox('INBOX', function(){
              console.log('Opened IMAP mailbox "' + e + '"...');
              ocb();
            });
          });

          S.instance.imap_mailboxes[e].once('error', function(err){
            console.log('Error openeing IMAP mailbox "' + e + '!');
            console.log(err);
            ocb();
          });

          S.instance.imap_mailboxes[e].connect();
        }, Belt.cw(cb));
      }
    ], function(err){
      if (err) S.emit('error', err);

      S.emit('ready');
    });
  }, 0);

};
