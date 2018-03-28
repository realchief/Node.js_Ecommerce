#!/usr/bin/env node

var Path = require('path')
  , Optionall = require('optionall')
  , FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Util = require('util')
  , Winston = require('winston')
  , Events = require('events')
  , Spinner = require('its-thinking')
  , CP = require('child_process')
  , Request = require('request')
  , Moment = require('moment')
  , CSV = require('fast-csv')
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'assets.json'
                       , 'settings.json'
                       , 'environment.json'
                       , 'config.json'
                       , 'credentials.json'
                       , 'users.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'query': {

  }
, 'skip': 0
, 'limit': 200
, 'count': 0
, 'total': 0
, 'output_path': '/home/ben/Downloads/wset-fraudulent-orders.csv'
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
, 'model': 'order'
, 'iterator': function(o, cb){
    if (
      //!(Belt.get(o, 'recipient.city') || '').match(/bro+klyn/i)
      o.recipient.postal_code === o.buyer.postal_code
      //|| o.recipient.last_name.toLowerCase() === o.buyer.last_name.toLowerCase()
      //|| Moment(o.created_at).isBefore(Moment().subtract(72, 'hours'))
    ) return cb();

    GB.total += o.total_price;
    console.log(++GB.count);
    console.log(GB.total);

    var obj = _.pick(o, [
      'buyer'
    , 'recipient'
    , 'total_price'
    , 'slug'
    , 'created_at'
    , 'shipping_status'
    , 'support_status'
    ]);

    obj['transaction_id'] = Belt.get(o, 'transactions.0.id') || '';

    var o2 = {
      'order': obj.slug
    , 'date': obj.created_at
    , 'total_price': obj.total_price
    , 'shipping_status': obj.shipping_status || ''
    , 'support_status': obj.support_status || ''
    , 'buyer_name': [obj.buyer.first_name, obj.buyer.last_name].join(' ')
    , 'recipient_name': [obj.recipient.first_name, obj.recipient.last_name].join(' ')
    , 'buyer_address': Belt.arrayDefalse([obj.buyer.street, obj.buyer.street_b]).join(', ')
    , 'recipient_address': Belt.arrayDefalse([obj.recipient.street, obj.recipient.street_b]).join(', ')
    , 'buyer_location': Belt.arrayDefalse([obj.buyer.city, obj.buyer.region, obj.buyer.country, obj.buyer.postal_code]).join(', ')
    , 'recipient_location': Belt.arrayDefalse([obj.recipient.city, obj.recipient.region, obj.recipient.country, obj.recipient.postal_code]).join(', ')
    , 'buyer_phone': obj.buyer.phone
    , 'recipient_phone': obj.buyer.phone
    , 'email': obj.buyer.email || ''
    , 'ip_address': obj.buyer.ip_address || ''
    , 'stripe_transaction': obj.transaction_id
    , 'order_url': 'https://wanderset.com/admin/order/' + obj.slug + '/read'
    };

    GB.csv.write(o2);

    cb();
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var cont;

    GB['fs'] = FS.createWriteStream(GB.output_path);
    GB['csv'] = CSV.createWriteStream({'headers': true});
    GB.csv.pipe(GB.fs);

    return Async.doWhilst(function(next){
      Request({
        'url': O.host + '/' + GB.model + '/list.json'
      , 'auth': GB.auth
      , 'qs': {
          'query': GB.query
        , 'skip': GB.skip
        , 'limit': GB.limit
        }
      , 'method': 'get'
      , 'json': true
      }, function(err, res, json){
        cont = _.any(Belt.get(json, 'data')) ? true : false;
        GB.skip += GB.limit;
        console.log(GB.skip);

        Async.eachLimit(Belt.get(json, 'data') || [], 6, function(d, cb2){
          GB.iterator(d, cb2);
        }, Belt.cw(next, 0));
      })
    }, function(){ return cont; }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  //return process.exit(err ? 1 : 0);
});
