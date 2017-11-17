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
  , AWS = require('aws-sdk')
  , FS = require('fs')
  , Mime = require('mime')
;

module.exports = function(S){

  S['cloudfront'] = new AWS.CloudFront(S.settings.aws);

  S['InvalidateSetMedia'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'cloudfront_distribution': 'ENJF03R2I4Z08'
    });

    S.cloudfront.createInvalidation({
      'DistributionId': a.o.cloudfront_distribution
    , 'InvalidationBatch': {
        'CallerReference': Belt.uuid()
      , 'Paths': {
          'Quantity': 1
        , 'Items': [
            '/set/*'
          ]
        }
      }
    }, Belt.cw(a.cb, 0));
  };

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
