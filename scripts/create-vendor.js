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
  , Assert = require('assert')
  , CSV = require('fast-csv')
  , Cheerio = require('cheerio')
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
"name": "BOY London",
"locked": false,
"shipping_options": [],
"magento": {
"url": "http://magento-22497-48619-205988.cloudwaysapps.com/",
"consumer_key": "b1vih6ptednb02cw55c6tjor3udm763l",
"consumer_secret": "s7svm35fj28bb98qnbidc3eb6ng7t55c",
"verifier": "c69krn30sjckv4pxpxs0etiluq176sul",
"access_token": "ioxlaoun6xclovnw3d54m9ic3xaa6cqb",
"access_secret": "57435tufxkjb3qnb52ow0s9d9jg9bwl0",
"version": 2
},
"contact_emails": [],
"setmembers": []
  }
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    Request({
      'url': O.host + '/vendor/create.json'
    , 'auth': GB.auth
    , 'qs': GB.query
    , 'method': 'post'
    , 'json': true
    }, function(err, res, json){
      console.log(Belt.stringify(json));

      cb();
    });
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
