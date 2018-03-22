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
  , Languages = require('../../resources/assets/languages.json')
  , Countries = require('../../resources/assets/countries.json')
  , CountryRegions = require('../../resources/assets/countries.regions.json')
  , FS = require('fs')
;

module.exports = function(S){
  S['languages'] = Languages;
  S['countries'] = Countries;
  S.instance.settings['us_regions'] = require(Path.join(S.settings.__dirname, './resources/assets/us.regions.json'));
  S.instance.settings['countries'] = Countries;
  S.instance.settings['countries_regions'] = CountryRegions;

  S.instance.settings['localities'] = [
    _.find(CountryRegions, function(r){ return r.countryName === 'United States'; })
  , _.find(CountryRegions, function(r){ return r.countryName === 'Canada'; })
  ].concat(_.sortBy(Belt.arrayDefalse([
  , _.find(CountryRegions, function(r){ return r.countryName === 'United Kingdom'; }) //GB
  , _.find(CountryRegions, function(r){ return r.countryName === 'United Arab Emirates'; })
  , _.find(CountryRegions, function(r){ return r.countryName === 'Austria'; }) //AT
  , _.find(CountryRegions, function(r){ return r.countryName === 'Belgium'; }) //BE
  , _.find(CountryRegions, function(r){ return r.countryName === 'Cyprus'; }) //CY
  , _.find(CountryRegions, function(r){ return r.countryName === 'Czech Republic'; }) //CZ
  , _.find(CountryRegions, function(r){ return r.countryName === 'Denmark'; }) //DK
  , _.find(CountryRegions, function(r){ return r.countryName === 'Finland'; }) //FI
  , _.find(CountryRegions, function(r){ return r.countryName === 'France'; }) //FR
  , _.find(CountryRegions, function(r){ return r.countryName === 'Germany'; }) //DE
  , _.find(CountryRegions, function(r){ return r.countryName === 'Greece'; }) //GR
  , _.find(CountryRegions, function(r){ return r.countryName === 'Hungary'; }) //HU
  , _.find(CountryRegions, function(r){ return r.countryName === 'Ireland'; }) //IE
  , _.find(CountryRegions, function(r){ return r.countryName === 'Italy'; }) //IT
  , _.find(CountryRegions, function(r){ return r.countryName === 'Luxembourg'; }) //LU
  , _.find(CountryRegions, function(r){ return r.countryName === 'Malta'; }) //MT
  , _.find(CountryRegions, function(r){ return r.countryName === 'Netherlands'; }) //NL
  , _.find(CountryRegions, function(r){ return r.countryName === 'Poland'; }) //PL
  , _.find(CountryRegions, function(r){ return r.countryName === 'Portugal'; }) //PT
  , _.find(CountryRegions, function(r){ return r.countryName === 'Spain'; }) //ES
  , _.find(CountryRegions, function(r){ return r.countryName === 'Sweden'; }) //SE
  , _.find(CountryRegions, function(r){ return r.countryName === 'Australia'; }) //AU
  , _.find(CountryRegions, function(r){ return r.countryName === 'New Zealand'; }) //NZ
  , _.find(CountryRegions, function(r){ return r.countryName === 'Japan'; }) //JP
  , _.find(CountryRegions, function(r){ return r.countryName === 'Korea, Republic of'; }) //KR
  , _.find(CountryRegions, function(r){ return r.countryName === 'Bermuda'; }) //BM
  , _.find(CountryRegions, function(r){ return r.countryName === 'Monaco'; }) //MC
  , _.find(CountryRegions, function(r){ return r.countryName === 'Israel'; }) //IL
  , _.find(CountryRegions, function(r){ return r.countryName === 'Singapore'; }) //SG
  , _.find(CountryRegions, function(r){ return r.countryName === 'Mexico'; }) //MX
  , _.find(CountryRegions, function(r){ return r.countryName === 'Chile'; }) //CL
  , _.find(CountryRegions, function(r){ return r.countryName === 'Switzerland'; }) //CH
  , _.find(CountryRegions, function(r){ return r.countryName === 'Iceland'; }) //IS
  , _.find(CountryRegions, function(r){ return r.countryName === 'Norway'; }) //NO
  ]), function(r){
    return r.countryName;
  }));

  S.instance.settings.localities = _.object(_.pluck(S.instance.settings.localities, 'countryShortCode')
                                           , S.instance.settings.localities);

  S.instance.settings.localities.KR.countryName = 'South Korea';

  _.each(S.instance.settings.localities, function(l){
    l.regions = _.sortBy(l.regions, 'name');
  });

  S['LocalitySchemaObject'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'spec': {'type': String}
    });

    return _.mapObject(self.localities_obj, function(v, k){
      return a.o.spec;
    });
  };

  S['ValidateLocalitySchemaObject'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'test': function(v){
        return _.isString(v);
      }
      //object
    });

    if (!_.every(a.o.object, function(v, k){
      return self.localities_obj[k];
    }) || !_.every(a.o.object, function(v, k){
      return a.o.test(v);
    })) return false;

    return true;
  };

  S['GetCountryRegion'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'country': ''
    , 'region': ''
    });

    a.o.region = a.o.region.toUpperCase();

    var country = self.instance.localities[a.o.country.toUpperCase()];

    if (!country) return a.o.region;

    var region = _.find(country.regions, function(r){
      return r.shortCode === a.o.region;
    });

    if (!region) return a.o.region;

    return region.name;
  };

  S.instance.express.all('/locality/all/list.json', function(req, res){
    res.status(200).json(CountryRegions);
  });

  S.instance.express.all('/locality/list.json', function(req, res){
    res.status(200).json(S.instance.settings.localities);
  });

/*
  S.instance.express.all('/locality/object.json', function(req, res){
    res.status(200).json(S.LocalitySchemaObject());
  });
*/

  setTimeout(function(){
    Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      if (err) S.emit('error', err);

      return S.emit('ready');
    });
  }, 0);
};
