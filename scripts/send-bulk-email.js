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
  , CSV = require('fast-csv')
  , Natural = require('natural')
  , Str = require('underscore.string')
;

var O = new Optionall({
                       '__dirname': Path.resolve(module.filename + '/../..')
                     , 'file_priority': [
                         'package.json'
                       , 'environment.json'
                       , 'settings.json'
                       , 'config.json'
                       ]
                     });

var Log = new Winston.Logger();
Log.add(Winston.transports.Console, {'level': 'debug', 'colorize': true, 'timestamp': false});

var Spin = new Spinner(4);

var GB = _.defaults(O.argv, {
  'csv_infile': '/home/ben/Downloads/nike-apologies.csv'
, 'email': {

  }
, 'auth': {
    'user': _.keys(O.admin_users)[0]
  , 'pass': _.values(O.admin_users)[0]
  }
});

Spin.start();

Async.waterfall([
  function(cb){
    var fs = FS.createReadStream(GB.csv_infile);

    GB['records'] = [];

    CSV.fromStream(fs, {
          'headers': true
        })
       .on('data', function(d){
          GB.records.push(d);
        })
       .on('end', Belt.cw(cb));
  }
, function(cb){
    Async.eachSeries(GB.records, function(e, cb2){
      Request({
        'url': O.host + '/admin/email/send.json'
      , 'auth': GB.auth
      , 'body': _.extend({}, {
          'from': '"Greg Selkoe" <ges@wanderset.com>'
        , 'to': e.email
        , 'cc': 'orders@wanderset.com'
        , 'subject': 'Wanderset $50 FREE from CEO and Founder - Nike Dunks Update'
        , 'html': '<p>Hey ' + e.first_name + ',<br>Wanted to give you some good news and bad news!</p><p>The good news is we are literally giving you a $50 gift certificate you can use to get anything you want for $50 on wanderset.com or you can use to take $50 off a larger order!</p><p>Bad news is there was such a rush on the Nike SB Dunk High Ugly Sweaters that the system got overwhelmed and we over sold so your shoes are out stock...As you know we are brand new site and working through some tech glitches still we are super sorry!!!!  We have tons more heat on site! So please use your $50 and again accept our apologies!!!!</p><p>Here is your code: <strong>' + e.code.toUpperCase() + '</strong></p><p>If you need me get at me.<br><br>Greg Selkoe<br>Wanderset Founder & CEO</p>'
        , 'text': '<p>Hey ' + e.first_name + ',<br>Wanted to give you some good news and bad news!</p><p>The good news is we are literally giving you a $50 gift certificate you can use to get anything you want for $50 on wanderset.com or you can use to take $50 off a larger order!</p><p>Bad news is there was such a rush on the Nike SB Dunk High Ugly Sweaters that the system got overwhelmed and we over sold so your shoes are out stock...As you know we are brand new site and working through some tech glitches still we are super sorry!!!!  We have tons more heat on site! So please use your $50 and again accept our apologies!!!!</p><p>Here is your code: <strong>' + e.code.toUpperCase() + '</strong></p><p>If you need me get at me.<br><br>Greg Selkoe<br>Wanderset Founder & CEO</p>'
        })
      , 'method': 'post'
      , 'json': true
      }, function(err, res, json){
        console.log(json);
        cb2(Belt.get(json, 'error') || !Belt.get(json, 'data') ? new Error(Belt.get(json, 'error') || 'Error') : undefined);
      });
    }, Belt.cw(cb, 0));
  }
], function(err){
  Spin.stop();
  if (err) Log.error(err);
  return process.exit(err ? 1 : 0);
});
