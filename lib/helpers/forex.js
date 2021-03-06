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
  , Forex = require('forex-quotes')
;

module.exports = function(S){
  S.instance['forex'] = new Forex(S.settings.forex.key);

  S.instance['forex_quotes'] = {};

  S.instance['DKKtoUSD'] = function(){
    return (1 * (!Belt.isNull(S.instance.forex_quotes.DKKUSD) ? S.instance.forex_quotes.DKKUSD : 0.17));
  };

  S.instance['GBPtoUSD'] = function(){
    return (1 * (!Belt.isNull(S.instance.forex_quotes.GBPUSD) ? S.instance.forex_quotes.GBPUSD : 1.42));
  };

  S.instance['EURtoUSD'] = function(){
    return (1 * (!Belt.isNull(S.instance.forex_quotes.EURUSD) ? S.instance.forex_quotes.EURUSD : 1.24));
  };

  S.instance['GetForexQuote'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //from
      //to
    });

    a.o.from = a.o.from.toUpperCase();
    a.o.to = a.o.to.toUpperCase();

    Request({
      'url': 'https://api.fixer.io/latest'
    , 'qs': {
        'base': a.o.from
      }
    , 'method': 'get'
    , 'json': true
    }, function(err, res, json){
      gb['quote'] = Belt.get(json, 'rates.' + a.o.to);
      if (!Belt.isNull(gb.quote)){
        console.log('Setting FOREX "' + a.o.from + a.o.to + '" to ' + gb.quote);
        S.instance.forex_quotes[a.o.from + a.o.to] = gb.quote;
      }

      a.cb(err, gb.quote);
    });
  };

  S.instance.express.all('/admin/forex/from/:from/to/:to/read.json', function(req, res){
    S.instance.GetForexQuote({
      'from': req.params.from
    , 'to': req.params.to
    }, function(err, data){
      res.status(200).json({
        'error': Belt.get(err, 'message')
      , 'data': data
      });
    });
  });

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        var ocb = _.once(cb);

        Async.forever(function(next){
          S.instance.GetForexQuote({
            'from': 'DKK'
          , 'to': 'USD'
          }, function(){
            ocb();
            setTimeout(next, 1000 * 60);
          });
        }, Belt.np);
      }
    , function(cb){
        var ocb = _.once(cb);

        Async.forever(function(next){
          S.instance.GetForexQuote({
            'from': 'GBP'
          , 'to': 'USD'
          }, function(){
            ocb();
            setTimeout(next, 1000 * 60);
          });
        }, Belt.np);
      }
    , function(cb){
        var ocb = _.once(cb);

        Async.forever(function(next){
          S.instance.GetForexQuote({
            'from': 'EUR'
          , 'to': 'USD'
          }, function(){
            ocb();
            setTimeout(next, 1000 * 60);
          });
        }, Belt.np);
      }
    ], function(err){
      S.emit('ready');
    });
  }, 0);

};
