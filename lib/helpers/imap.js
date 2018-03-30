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
      //process.exit(1);
      setTimeout(function(){
        self.OpenMailbox(a.o, ocb);
      }, 30 * 1000);
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
      'email': _.keys(S.settings.imap_mailboxes)[0]
      //criteria
    });

    Async.waterfall([
      function(cb){
        gb['imap'] = self.instance.imap_mailboxes[a.o.email];

        gb.imap.search(a.o.criteria, Belt.cs(cb, gb, 'res', 1, 0));
      }
    , function(cb){
        var ocb = _.once(cb);

        if (!gb.res) return ocb();

        try {
          gb['messages'] = gb.imap.fetch(gb.res, {
            'bodies': ''
          });
        } catch(e){
          return ocb(e);
        }

        gb['msg'] = [];

        gb.messages.on('message', function(msg, seq){
          var m = {
            'seq': seq
          };

          msg.on('body', function(stream, info){
            m['body'] = '';
            stream.on('data', function(c){
              m.body += c.toString();
            });
          });

          msg.on('attributes', function(attrs){
            m['attributes'] = attrs;
          });

          msg.on('end', function(){
            gb.msg.push(m);
          })
        });

        gb.messages.once('error', ocb);

        gb.messages.once('end', Belt.cw(ocb));
      }
    ], function(err){
      a.cb(err, gb.msg)
    });
  };

  S['FindStreetammoShippingEmail'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //order_slug
      'criteria': [
        ['FROM', 'tracking-noreply@webshipr.com']
      , ['TO', 'fulfillment+' + a.o.order_slug + '@wanderset.com']
      , ['SUBJECT', 'and is ready to be shipped']
      ]
    });

    return Async.waterfall([
      function(cb){
        S.SearchMailbox({
          'criteria': a.o.criteria
        }, Belt.cs(cb, gb, 'messages', 1, 0));
      }
    , function(cb){
        if (!Belt.get(gb, 'messages.0.body')) return cb(new Error('Message not found'));

        try {
          gb.shipping_url = gb.messages[0].body.split('<a href="').pop().split('"').shift();
        } catch (e){
          return cb(err);
        }

        cb(!gb.shipping_url ? new Error('URL not found') : null);
      }
    ], function(err){
      if (err) console.log(err);
      a.cb(err, gb.shipping_url);
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
