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
  , OS = require('os')
  , Request = require('request')
;

module.exports = function(S){

  if (S.settings.environment === 'production-worker'){
    S.instance.on('ready', function(){
      Async.forever(function(next){
        S.instance.helpers.kpis.PostDailySalesTotals(function(){
          setTimeout(next, 60 * 1000 * 30);
        });
      }, Belt.np);
    });
  }

  if (S.settings.environment === 'production-worker') S.instance.on('ready', function(){
    Async.forever(function(next){
      S.instance.helpers.kpis.PostVendorProductStats(function(){
        setTimeout(next, 1000 * 60 * 30);
      });
    });
  });

  if (S.settings.environment === 'production-worker-3') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('media').count({
            'url': {
              '$exists': true
            }
          , '$or': [
              {
                'downsample_url': {
                  '$exists': false
                }
              }
            , {
                'super_downsample_url': {
                  '$exists': false
                }
              }
            , {
                'url': {
                  '$not': /\.jpg$/
                }
              }
            ]
          }, Belt.cs(cb, gb, 'count', 1, 0));
        }
      , function(cb){
          S.log.warn(gb.count + ' MEDIA TO JPG, DOWNLOAD, AND DOWNSAMPLE');

          S.instance.db.model('media').find({
            'url': {
              '$exists': true
            }
          , '$or': [
              {
                'downsample_url': {
                  '$exists': false
                }
              }
            , {
                'super_downsample_url': {
                  '$exists': false
                }
              }
            , {
                'url': {
                  '$not': /\.jpg$/
                }
              }
            ]
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(gb.docs, OS.cpus().length, function(d, cb2){
            S.log.warn('JPGing, downloading, and downsampling media "' + d.get('slug')
            + '" [' + d.get('_id').toString() + ']');

            d.set({
              'downsample': true
            , 'super_downsample': true
            });

            var ocb = _.once(cb2);

            setTimeout(ocb, 1000 * 60 * 5);

            d.save(function(err){
              if (err) S.instance.ErrorNotification(err, 'DownloadMedia', {
                '_id': Belt.get(d, '_id')
              });

              ocb();
            });
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 1000 * 60 * 60);
      });
    });
  });

  if ((S.settings.environment === 'production-worker') && Belt.get(S.settings, 'notifications.unshipped_order_slack')){
    S.instance.on('ready', function(){
      Async.forever(function(next){
        var gb = {};

        Async.waterfall([
          function(cb){
            S.instance.db.model('order').find({
              'shipping_status': 'unshipped'
            , 'support_status': {
                '$ne': 'refunded'
              }
            , 'updated_at': {
                '$lt': Moment().subtract(24, 'hours').toDate()
              }
            }, Belt.cs(cb, gb, 'docs', 1, 0));
          }
        , function(cb){
            Async.eachSeries(gb.docs, function(d, cb2){
              Request({
                'url': S.settings.notifications.unshipped_order_slack
              , 'method': 'post'
              , 'json': true
              , 'body': {
                  'text': 'Order #'
                        + d.get('slug') + ' has unshipped items and has not been updated in the last 24 hours!'
                        + ' <https://wanderset.com/admin/order/' + d.get('_id').toString() + '/read'
                , 'username': 'ORDER-BOT'
                , 'icon_emoji': ':interrobang:'
                }
              }, Belt.np);

              d.set({
                'notes': Moment().format('MM/DD/YY hh:mm a') + ' - Inactivity Alarm' + (d.get('notes') ? '\n' + d.get('notes') : '')
              });

              d.save(Belt.cw(cb2, 0));
            }, Belt.cw(cb));
          }
        ], function(err){
          if (err) S.instance.ErrorNotification(err, 'UnshippedOrderNotification', {

          });

          setTimeout(next, 60 * 1000);
        });
      }, Belt.np);
    });
  }

  if (S.settings.environment === 'production-worker-3')  S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('product').count({
            'media.0': {
              '$exists': true
            }
          , '$or': [
              {
                'media.downloaded': {
                  '$ne': true
                }
              }
            , {
                'media.downsampled': {
                  '$ne': true
                }
              }
            , {
                'media.super_downsampled': {
                  '$ne': true
                }
              }
            , {
                'media.url': {
                  '$not': /\.jpg$/
                }
              }
            ]
          }, Belt.cs(cb, gb, 'count', 1, 0));
        }
      , function(cb){
          S.log.warn(gb.count + ' PRODUCTS TO JPG, DOWNLOAD, AND DOWNSAMPLE');

          S.instance.db.model('product').find({
            'media.0': {
              '$exists': true
            }
          , '$or': [
              {
                'media.downloaded': {
                  '$ne': true
                }
              }
            , {
                'media.downsampled': {
                  '$ne': true
                }
              }
            , {
                'media.super_downsampled': {
                  '$ne': true
                }
              }
            , {
                'media.url': {
                  '$not': /\.jpg$/
                }
              }
            ]
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(gb.docs, OS.cpus().length, function(d, cb2){
            S.log.warn('JPGing, downloading, and downsampling product "' + d.get('name')
            + '" [' + d.get('_id').toString() + ']');

            var ocb = _.once(cb2);

            setTimeout(ocb, 1000 * 60 * 5);

            d.save(function(err){
              if (err) S.instance.ErrorNotification(err, 'DownloadProductMedia', {
                '_id': Belt.get(d, '_id')
              });

              ocb();
            });
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 1000 * 60 * 60);
      });
    });
  });

/*
  if (S.settings.environment === 'production-worker-2') S.instance.on('ready', function(){
    Async.forever(function(next){
      Async.eachSeries(S.settings.sync_sets, function(s, cb2){
        S.log.warn('Syncing set "' + s.old_set_slug + '" with "' + s.new_set_slug + '"...');
        S.instance.db.model('set').SyncSets({
          'old_set_id': s.old_set_id
        , 'new_set_id': s.new_set_id
        }, function(err){
          if (err) S.emit('error', err);

          cb2();
        });
      }, function(err){
        if (err) S.emit('error', err);

        setTimeout(next, 60 * 1000);
      });
    });
  });
*/

  if (S.settings.environment === 'production-worker-2') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('set').find({
            'sync_from_sets.0': {
              '$exists': true
            }
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachSeries(gb.docs || [], function(ns, cb2){
            Async.eachSeries(ns.get('sync_from_sets'), function(os, cb3){
              S.log.warn('Syncing set "' + os + '" with "' + ns.get('slug') + '"...');
              S.instance.db.model('set').SyncSets({
                'old_set_id': os
              , 'new_set_id': ns.get('_id')
              }, function(err){
                if (err) S.emit('error', err);

                cb3();
              })
            }, Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        if (err) S.emit('error', err);

        setTimeout(next, 60 * 1000);
      });
    });
  });

  if (false && S.settings.environment === 'production-worker-3') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.eachSeries([
        {
          'dest_path': 'featured_media'
        , 'prefix': ''
        }
      , {
          'dest_path': 'mobile_featured_media'
        , 'prefix': 'mobile_'
        }
      , {
          'dest_path': 'logo_media'
        , 'prefix': 'logo_'
        }
      , {
          'dest_path': 'landing_media'
        , 'prefix': 'landing_'
        }
      ], function(e, cb){
        Async.waterfall([
          function(cb2){
            var q = {};
            q[e.dest_path + '.url'] = {
              '$exists': true
            };

            S.instance.db.model('set').find(q, Belt.cs(cb2, gb, 'docs', 1, 0));
          }
        , function(cb2){
            gb.docs = _.filter(gb.docs, function(d){
              return !(Belt.get(d, e.dest_path + '.url') || '').match(/\.jpg$/) ;
            });

            S.log.warn(gb.docs.length + ' SETS NEEDING "' + e.dest_path + '" JPGING');

            Async.eachSeries(gb.docs, function(d, cb3){
              S.log.warn('JPGing SET [' + e.dest_path + '] "' + d.get('name')
              + '" [' + d.get('_id').toString() + ']');

              d.uploadS3(Belt.copy(e), function(){
                d.save(Belt.cw(cb3));
              });
            }, Belt.cw(cb2));
          }
        ], function(err){
          cb();
        });
      }, function(err){
        setTimeout(next, 1000 * 60 * 5);
      });
    });
  });

  if (S.settings.environment === 'production-worker-3') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.eachSeries([
        {
          'dest_path': 'featured_media'
        , 'prefix': ''
        }
      , {
          'dest_path': 'mobile_featured_media'
        , 'prefix': 'mobile_'
        }
      , {
          'dest_path': 'logo_media'
        , 'prefix': 'logo_'
        }
      , {
          'dest_path': 'landing_media'
        , 'prefix': 'landing_'
        }
      ], function(e, cb){
        Async.waterfall([
          function(cb2){
            var q = {};
            q[e.dest_path + '.url'] = {
              '$exists': true
            };

            S.instance.db.model('set').find(q, Belt.cs(cb2, gb, 'docs', 1, 0));
          }
        , function(cb2){
            gb.docs = _.filter(gb.docs, function(d){
              return !Belt.get(d, e.dest_path + '.downsample_url');
            });

            S.log.warn(gb.docs.length + ' SETS NEEDING "' + e.dest_path + '" DOWNSAMPLE');

            Async.eachSeries(gb.docs, function(d, cb3){
              S.log.warn('Downloading and downsampling SET [' + e.dest_path + '] "' + d.get('name')
              + '" [' + d.get('_id').toString() + ']');

              var ocb = _.once(cb3);

              setTimeout(ocb, 1000 * 60 * 5);

              d.uploadDownsampleS3(Belt.copy(e), function(){
                d.save(Belt.cw(ocb));
              });
            }, Belt.cw(cb2));
          }
        ], function(err){
          cb();
        });
      }, function(err){
        setTimeout(next, 1000 * 60 * 5);
      });
    });
  });

  if (S.settings.environment === 'production-worker-3') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.eachSeries([
        {
          'dest_path': 'featured_media'
        , 'prefix': ''
        }
      , {
          'dest_path': 'mobile_featured_media'
        , 'prefix': 'mobile_'
        }
      , {
          'dest_path': 'logo_media'
        , 'prefix': 'logo_'
        }
      , {
          'dest_path': 'landing_media'
        , 'prefix': 'landing_'
        }
      ], function(e, cb){
        Async.waterfall([
          function(cb2){
            var q = {};
            q[e.dest_path + '.url'] = {
              '$exists': true
            };

            S.instance.db.model('set').find(q, Belt.cs(cb2, gb, 'docs', 1, 0));
          }
        , function(cb2){
            gb.docs = _.filter(gb.docs, function(d){
              return !Belt.get(d, e.dest_path + '.downsample_url');
            });

            S.log.warn(gb.docs.length + ' SETS NEEDING "' + e.dest_path + '" DOWNSAMPLE');

            Async.eachSeries(gb.docs, function(d, cb3){
              S.log.warn('Downloading and downsampling SET [' + e.dest_path + '] "' + d.get('name')
              + '" [' + d.get('_id').toString() + ']');

              var ocb = _.once(cb3);

              setTimeout(ocb, 1000 * 60 * 5);

              d.uploadDownsampleS3(Belt.copy(e), function(){
                d.save(Belt.cw(ocb));
              });
            }, Belt.cw(cb2));
          }
        ], function(err){
          cb();
        });
      }, function(err){
        setTimeout(next, 1000 * 60 * 5);
      });
    });
  });

  if (S.settings.environment === 'production-worker-3') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.eachSeries([
        {
          'dest_path': 'featured_media'
        , 'prefix': ''
        }
      , {
          'dest_path': 'mobile_featured_media'
        , 'prefix': 'mobile_'
        }
      , {
          'dest_path': 'logo_media'
        , 'prefix': 'logo_'
        }
      , {
          'dest_path': 'landing_media'
        , 'prefix': 'landing_'
        }
      ], function(e, cb){
        Async.waterfall([
          function(cb2){
            var q = {};
            q[e.dest_path + '.url'] = {
              '$exists': true
            };

            S.instance.db.model('set').find(q, Belt.cs(cb2, gb, 'docs', 1, 0));
          }
        , function(cb2){
            gb.docs = _.filter(gb.docs, function(d){
              return !Belt.get(d, e.dest_path + '.super_downsample_url');
            });

            S.log.warn(gb.docs.length + ' SETS NEEDING "' + e.dest_path + '" SUPER DOWNSAMPLE');

            Async.eachSeries(gb.docs, function(d, cb3){
              S.log.warn('Downloading and super downsampling SET [' + e.dest_path + '] "' + d.get('name')
              + '" [' + d.get('_id').toString() + ']');

              var ocb = _.once(cb3);

              setTimeout(ocb, 1000 * 60 * 5);

              d.uploadSuperDownsampleS3(Belt.copy(e), function(){
                d.save(Belt.cw(ocb));
              });
            }, Belt.cw(cb2));
          }
        ], function(err){
          cb();
        });
      }, function(err){
        setTimeout(next, 1000 * 60 * 5);
      });
    });
  });

  if (S.settings.environment === 'production-worker-9') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('vendor').find({
            'name': {
              '$in': [
                'Active Ride Shop'
              ]
            }
          , 'shopify.access_token': {
              '$exists': true
            }
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(_.shuffle(gb.docs), OS.cpus().length, function(d, cb2){
            d.syncShopifyInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 0);
      });
    });
  });

  if (S.settings.environment === 'production-worker-10') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('vendor').find({
            'name': {
              '$nin': [
                'la-familia-mmxiv'
              , 'Active Ride Shop'
              ]
            }
          , 'shopify.access_token': {
              '$exists': true
            }
          }).skip(0).limit(30).exec(Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(_.shuffle(gb.docs), OS.cpus().length, function(d, cb2){
            d.syncShopifyInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 0);
      });
    });
  });

  if (S.settings.environment === 'production-worker-11') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('vendor').find({
            'name': {
              '$nin': [
                'la-familia-mmxiv'
              , 'Active Ride Shop'
              ]
            }
          , 'shopify.access_token': {
              '$exists': true
            }
          }).skip(30).limit(30).exec(Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(_.shuffle(gb.docs), OS.cpus().length, function(d, cb2){
            d.syncShopifyInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 0);
      });
    });
  });

  if (S.settings.environment === 'production-worker-12') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('vendor').find({
            'name': {
              '$nin': [
                'la-familia-mmxiv'
              , 'Active Ride Shop'
              ]
            }
          , 'shopify.access_token': {
              '$exists': true
            }
          }).skip(60).exec(Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(_.shuffle(gb.docs), OS.cpus().length, function(d, cb2){
            d.syncShopifyInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 0);
      });
    });
  });

  if (S.settings.environment === 'production-worker-2') S.instance.on('ready', function(){
    Async.forever(function(next){
      var gb = {};

      Async.waterfall([
        function(cb){
          S.instance.db.model('vendor').find({
            'woocommerce.consumer_key': {
              '$exists': true
            }
          }, Belt.cs(cb, gb, 'docs', 1, 0));
        }
      , function(cb){
          Async.eachLimit(_.shuffle(gb.docs), OS.cpus().length, function(d, cb2){
            d.syncWoocommerceInventory(Belt.cw(cb2));
          }, Belt.cw(cb));
        }
      ], function(err){
        setTimeout(next, 0);
      });
    });
  });

  if (S.settings.environment === 'production-worker-4' || S.settings.environment === 'production-worker-5') S.instance.on('ready', function(){
    var gb = {};
    Async.waterfall([
      function(cb){
        S.instance.db.model('vendor').find({
          'custom_sync.strategy': {
            '$exists': true
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        _.each(gb.docs, function(d){
          Async.forever(function(next){
            S.log.info('Syncing custom inventory "' + d.get('name') + '"');

            d.syncCustomInventory(function(){
              setTimeout(next, 0);
            });
          });
        });
        cb();
      }
    ], function(err){

    });
  });

  if (S.settings.environment !== 'development' && S.settings.environment !== 'production') S.instance.on('ready', function(){
    Async.forever(function(next){
      return Async.waterfall([
        function(cb){
          S.instance.helpers.cache.LoadProductCategories(function(){
            S.log.warn('PRODUCT CATEGORIES LOADED');

            cb();
          });
        }
      , function(cb){
          S.instance.helpers.cache.LoadSets(function(){
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'setmember_sets.length') || 0) + ' set member sets...');
            S.log.warn('Loaded ' + _.filter(S.instance.setmember_sets || [], function(s){
              return Belt.get(s, 'products.0') ? true : false;
            }).length + ' set member sets with products...');
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'brand_sets.length') || 0)  + ' brand sets...');
            S.log.warn('Loaded ' + _.filter(S.instance.brand_sets || [], function(s){
              return Belt.get(s, 'products.0') ? true : false;
            }).length + ' brand sets with products...');

            cb();
          });
        }
      , function(cb){
          S.instance.helpers.cache.LoadVendorShipping(function(){
            S.log.warn('VENDOR SHIPPING OPTIONS LOADED');

            cb();
          });
        }
      , function(cb){
          S.instance.helpers.cache.LoadVendorTaxes(function(){
            S.log.warn('VENDOR TAXES LOADED');

            cb();
          });
        }
      , function(cb){
          S.instance.helpers.cache.LoadProductOptions(function(){
            S.log.warn('PRODUCT OPTIONS LOADED');

            cb();
          });
        }
      ], function(err){
        setTimeout(next, 60 * 5 * 1000);
      });
    });
  });

  if (S.settings.environment === 'production-worker-8') S.instance.on('ready', function(){

    Async.forever(function(next){
      var from = Moment().toDate()
        , to = Moment().toDate()
        , key = 'kpis:orders:today'
        , gb = {}
        , interval = 60 * 1000 * 5;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().subtract(1, 'days').toDate()
        , to = Moment().subtract(1, 'days').toDate()
        , key = 'kpis:orders:yesterday'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().subtract(2, 'days').toDate()
        , to = Moment().subtract(2, 'days').toDate()
        , key = 'kpis:orders:today-2'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().subtract(3, 'days').toDate()
        , to = Moment().subtract(3, 'days').toDate()
        , key = 'kpis:orders:today-3'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);


    Async.forever(function(next){
      var from = Moment().subtract(4, 'days').toDate()
        , to = Moment().subtract(4, 'days').toDate()
        , key = 'kpis:orders:today-4'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);


    Async.forever(function(next){
      var from = Moment().subtract(5, 'days').toDate()
        , to = Moment().subtract(5, 'days').toDate()
        , key = 'kpis:orders:today-5'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);


    Async.forever(function(next){
      var from = Moment().subtract(6, 'days').toDate()
        , to = Moment().subtract(6, 'days').toDate()
        , key = 'kpis:orders:today-6'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().subtract(7, 'days').toDate()
        , to = Moment().subtract(7, 'days').toDate()
        , key = 'kpis:orders:today-7'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().day('Sunday').toDate()
        , to = Moment().toDate()
        , key = 'kpis:orders:this-week'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().subtract(7, 'days').day('Sunday').toDate()
        , to = Moment().subtract(7, 'days').day('Saturday').toDate()
        , key = 'kpis:orders:last-week'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().date(1).toDate()
        , to = Moment().toDate()
        , key = 'kpis:orders:this-month'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

    Async.forever(function(next){
      var from = Moment().subtract(1, 'month').date(1).toDate()
        , to = Moment().date(1).subtract(1, 'days').toDate()
        , key = 'kpis:orders:last-month'
        , gb = {}
        , interval = 60 * 1000 * 60 * 12;

      Async.waterfall([
        function(cb){
          console.log('Setting "' + key + '" in Redis...');

          S.instance.helpers.kpis.SummarizeOrders({
            'query': _.extend({}, {
              'created_at': {
                '$gte': Moment(from).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
              , '$lte': Moment(to).hours(23).minutes(59).seconds(59).milliseconds(999).toDate()
              }
            })
          }, Belt.cs(cb, gb, 'data', 1, 0));
        }
      , function(cb){
          if (!gb.data) return cb();

          S.instance.redis.set(key, Belt.stringify(gb.data), Belt.cw(cb));
        }
      ], function(err){

        setTimeout(next, interval);

      });
    }, Belt.np);

  });

  if (true) S.instance.on('ready', function(){
    Async.forever(function(next){
      return Async.waterfall([
        function(cb){
          S.instance.helpers.cache.LoadVendors(function(){
            S.log.warn('Loaded ' + (Belt.get(S.instance, 'vendors.length') || 0)  + ' vendors...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'shopify.access_token') ? true : false;
            }).length + ' vendors with Shopify sync...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'woocommerce.consumer_key') ? true : false;
            }).length + ' vendors with Woocommerce sync...');
            S.log.warn('Loaded ' + _.filter(S.instance.vendors || [], function(s){
              return Belt.get(s, 'custom_sync.strategy') ? true : false;
            }).length + ' vendors with custom sync strategy...');

            cb();
          });
        }
      ], function(err){
        setTimeout(next, 60 * 5 * 1000);
      });
    });
  });

  if (true) S.instance.on('ready', function(){
    Async.forever(function(next){
      return Async.eachSeries([
        'categories'
      , 'all_categories'
      , 'product_options'
      , 'set_categories'
      , 'setmember_sets'
      , 'setmember_logo_sets'
      , 'brand_sets'
      , 'brand_logo_sets'
      , 'brand_slugs'
      , 'vendor_shipping'
      , 'vendor_shipping_ids'
      , 'vendor_shipping_names'
      , 'vendor_taxes'
      , 'vendor_taxes_ids'
      , 'vendor_taxes_names'
      ], function(e, cb2){
        if (!S.instance.helpers.cache.redis) return cb2();

        S.log.warn('Reading from Redis "' + S.instance.helpers.cache.redis_prefix + e + '"...');

        S.instance.helpers.cache.redis.get(S.instance.helpers.cache.redis_prefix + e, function(err, val){
          var obj;

          try {
            obj = Belt.parse(val);
            if (obj) S.instance[e] = obj;
          } catch(e) {

          }

          cb2();
        });
      }, function(err){
        setTimeout(next, 60 * 1 * 1000);
      });
    });
  });

  setTimeout(function(){
    return Async.waterfall([
      function(cb){
        cb();
      }
    ], function(err){
      S.emit('ready');
    });
  }, 0);
};
