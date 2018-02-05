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
  , Mime = require('mime')
  , Sentiment = require('sentiment')
;

module.exports = function(S){
  S['host'] = 'https://api.helpscout.net/v1';

  S['SearchOrderConversations'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'key': S.settings.helpscout.key
      //order_slug
      //vendor_order_ids
      //buyer_email
    });

    return Async.waterfall([
      function(cb){
        gb['query'] = [];
        if (a.o.order_slug){
          gb.query.push('body:"' + a.o.order_slug + '"');
          gb.query.push('subject:"' + a.o.order_slug + '"');
          gb.query.push('email:orders+' + a.o.order_slug + '@wanderset.com');
          gb.query.push('email:fulfillment+' + a.o.order_slug + '@wanderset.com');
        }
        if (a.o.buyer_email){
          gb.query.push('email:' + a.o.buyer_email);
        }
        _.each(a.o.vendor_order_ids, function(i){
          gb.query.push('body:"' + i + '"');
          gb.query.push('subject:"' + i + '"');
        });

        gb.query = '(' + gb.query.join(' OR ') + ')';

        Request({
          'url': self.host + '/search/conversations.json'
        , 'method': 'get'
        , 'qs': {
            'query': gb.query
          }
        , 'auth': {
            'user': a.o.key
          , 'password': 'x'
          }
        , 'json': true
        }, function(err, res, json){
          gb['conversations'] = Belt.get(json, 'items');
          gb.conversations = _.each(gb.conversations, function(c){
            c['url'] = 'https://secure.helpscout.net/conversation/' + c.id + '/' + c.number;
          });

          cb(err);
        });
      }
    ], function(err){
      a.cb(err, gb.conversations);
    });
  };

  S['IterateAllConversations'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'iterator': function(doc, cb){
        console.log(Belt.stringify(doc));
        cb();
      }
    , 'key': S.settings.helpscout.key
      //mailbox
    });

    Async.waterfall([
      function(cb){
        gb['page'] = 1;

        return Async.doWhilst(function(next){
          Request({
            'url': self.host + '/mailboxes/' + a.o.mailbox + '/conversations.json'
          , 'method': 'get'
          , 'qs': {
              'page': gb.page
            }
          , 'auth': {
              'user': a.o.key
            , 'password': 'x'
            }
          , 'json': true
          }, function(err, res, json){
            if (err) return cb(err);

            gb.page++;
            gb['total_pages'] = Belt.get(json, 'pages') || 0;

            gb['conversations'] = Belt.get(json, 'items');
            gb.conversations = _.each(gb.conversations, function(c){
              c['url'] = 'https://secure.helpscout.net/conversation/' + c.id + '/' + c.number;
            });

            Async.eachSeries(gb.conversations, function(c, cb2){
              a.o.iterator(c, cb2);
            }, Belt.cw(next, 0));
          });
        }, function(){ return gb.page <= gb.total_pages; }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err);
    });
  };

  S['TagCustomerEmail'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //conversation
      'reject_test': function(conv){
        var email = Belt.get(conv, 'createdBy.email');
        if (!email) return true;
        if (conv.subject && conv.subject === 'Notification of payment received') return true;
        return email.match(/wanderset\.com|selkoe/i) ? true : false;
      }
    , 'key': S.settings.helpscout.key
    });

    Async.waterfall([
      function(cb){
        if (a.o.reject_test(a.o.conversation)) return cb(new Error('conversation rejected'));

        gb['email'] = Belt.get(a.o.conversation, 'createdBy.email.toLowerCase()') || '';

        self.instance.db.model('order').find({
          'buyer.email': gb.email
        }, Belt.cs(cb, gb, 'orders', 1));
      }
    , function(cb){
        if (!_.any(gb.orders)) return cb(new Error('no orders found'));

        //gb['sentiment'] = Sentiment([a.o.conversation.subject || '', a.o.conversation.preview || ''].join('\n'));

        gb['tags'] = _.uniq((a.o.conversation.tags || []).concat([
          'real_customer'
        ]).concat(_.map(gb.orders, function(o){
          return 'order_' + o.slug;
        })));

        if (!_.any(_.difference(gb.tags, a.o.conversation.tags || []))) return cb();

        Request({
          'url': self.host + '/conversations/' + a.o.conversation.id + '.json'
        , 'method': 'put'
        , 'qs': {
            'reload': true
          }
        , 'body': {
            'tags': _.uniq((a.o.conversation.tags || []).concat([
              'real_customer'
            ]).concat(_.map(gb.orders, function(o){
              return 'order_' + o.slug;
            })))
          , 'mailbox': {
              'id': Belt.get(a.o.conversation, 'mailbox.id')
            }
          }
        , 'auth': {
            'user': a.o.key
          , 'password': 'x'
          }
        , 'json': true
        }, function(err, res, json){
          cb();
        });
      }
    ], function(err){
      a.cb(err);
    });
  };

  S['FindStreetammoShippingEmail'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //order_slug
      'key': S.settings.helpscout.key
    , 'from_email': 'tracking-noreply@webshipr.com'
    });

    return Async.waterfall([
      function(cb){
        gb['query'] = 'email:fulfillment+' + a.o.order_slug + '@wanderset.com';

        Request({
          'url': self.host + '/search/conversations.json'
        , 'method': 'get'
        , 'qs': {
            'query': gb.query
          }
        , 'auth': {
            'user': a.o.key
          , 'password': 'x'
          }
        , 'json': true
        }, function(err, res, json){
          if (Belt.get(json, 'message')) return cb(new Error(json, 'message'));

          gb['conversations'] = Belt.get(json, 'items');
          gb.conversations = _.each(gb.conversations, function(c){
            c['url'] = 'https://secure.helpscout.net/conversation/' + c.id + '/' + c.number;
          });

          gb['conversation'] = _.find(gb.conversations, function(c){
            return c.customerEmail === a.o.from_email;
          });

          cb(err);
        });
      }
    , function(cb){
        if (!gb.conversation) return cb();

        Request({
          'url': self.host + '/conversations/' + gb.conversation.id + '.json'
        , 'method': 'get'
        , 'auth': {
            'user': a.o.key
          , 'password': 'x'
          }
        , 'json': true
        }, function(err, res, json){
          if (Belt.get(json, 'message')) return cb(new Error(json, 'message'));

          _.extend(gb.conversation, json);

          gb.conversation.email_body = Belt.get(gb.conversation, 'item.threads.pop().body');
          if (!gb.conversation.email_body) return cb();

          gb.shipping_url = gb.conversation.email_body.split('<a href="').pop().split('"').shift();

          cb(err);
        });
      }
    ], function(err){
      if (err) console.log(err);
      a.cb(err, gb.shipping_url);
    });
  };

/*
  S.instance.express.all('/admin/helpscout/mailbox/:mailbox/conversations/tag.json', function(req, res){
    res.status(200).json({
      'data': 'OK'
    });

    S.IterateAllConversations({
      'mailbox': req.params.mailbox
    , 'iterator': function(c, cb){
        S.TagCustomerEmail({
          'conversation': c
        }, function(err){
          cb();
        });
      }
    });
  });
*/

/*
  S.instance.express.all('/admin/helpscout/streetammo.json', function(req, res){
    S.FindStreetammoShippingEmail({
      'order_slug': '86680401'
    }, function(err, data){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': data
      });
    });
  });
*/

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
