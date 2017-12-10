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
  , XML = require('xml')
;

module.exports = function(S){

  S['PostDailySalesTotals'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$gte': Moment().hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'today';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        cb();
      }
    , function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$lt': Moment().subtract(1, 'days').toDate()
          , '$gte': Moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'yesterday';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        cb();
      }
    , function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$lt': Moment().hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          , '$gte': Moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'yesterday_cum';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        cb();
      }
    , function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$lt': Moment().subtract(7, 'days').toDate()
          , '$gte': Moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'last_week';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        cb();
      }
    , function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$lt': Moment().subtract(6, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          , '$gte': Moment().subtract(7, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'last_week_cum';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        cb();
      }
    , function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$lt': Moment().subtract(1, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          , '$gte': Moment().subtract(2, 'days').hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'dby_cum';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        cb();
      }
    , function(cb){
        S.instance.db.model('order').find({
          'created_at': {
            '$gte': Moment().year(Moment().year()).month(Moment().month()).date(1).hours(0).minutes(0).seconds(0).milliseconds(0).toDate()
          }
        }, Belt.cs(cb, gb, 'docs', 1, 0));
      }
    , function(cb){
        var pfx = 'this_month';

        gb[pfx + '_total'] = _.reduce(gb.docs, function(m, n){
          return m + n.get('total_price');
        }, 0) || 0;

        gb[pfx + '_count'] = Belt.get(gb.docs, 'length') || 0;

        gb[pfx + '_aov'] = gb[pfx + '_total'] / gb[pfx + '_count'];

        gb[pfx + '_unit_count'] = _.reduce(gb.docs, function(m, n){
          return m + _.reduce(n.products, function(m2, n2){
            return m2 + n2.quantity;
          }, 0);
        }, 0) || 0;

        var pfx = 'avg_month';

        gb[pfx + '_total'] = gb.this_month_total / Moment().date();

        gb[pfx + '_count'] = gb.this_month_count / Moment().date();

        gb[pfx + '_unit_count'] = gb.this_month_unit_count / Moment().date();

        cb();
      }
    , function(cb){
        gb['month_days'] = Moment().add(1, 'months').date(1).subtract(1, 'days').date();

        gb['dby_avg'] = (gb.dby_cum_total * gb.month_days);
        gb['yesterday_avg'] = (gb.yesterday_cum_total * gb.month_days);
        gb['today_avg'] = (gb.today_total / ((Moment().valueOf() - Moment().hours(0).minutes(0).seconds(0).milliseconds(0).valueOf()) / (Moment().hours(23).minutes(59).seconds(59).milliseconds(999).valueOf() - Moment().hours(0).minutes(0).seconds(0).valueOf())) * gb.month_days);

        Request({
          'url': S.settings.notifications.new_order_slack
        , 'method': 'post'
        , 'json': true
        , 'body': {
            'text': '*SALES*\nToday: $'
                    + gb.today_total.toFixed(2)
                    + '\nvs. Yesterday this time: ' + (((gb.today_total / gb.yesterday_total) - 1) * 100).toFixed(0) + '% ($' + gb.yesterday_total.toFixed(2) + ')'
                    + '\nvs. Yesterday total: ' + (((gb.today_total / gb.yesterday_cum_total) - 1) * 100).toFixed(0) + '% ($' + gb.yesterday_cum_total.toFixed(2) + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' this time: ' + (((gb.today_total / gb.last_week_total) - 1) * 100).toFixed(0) + '% ($' + gb.last_week_total.toFixed(2) + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' total: ' + (((gb.today_total / gb.last_week_cum_total) - 1) * 100).toFixed(0) + '% ($' + gb.last_week_cum_total.toFixed(2) + ')'
                    + '\nvs. Average day this month: ' + (((gb.today_total / gb.avg_month_total) - 1) * 100).toFixed(0) + '% ($' + gb.avg_month_total.toFixed(2) + ')'
                    + '\nvs. Month-to-date: ' + (((gb.today_total / gb.this_month_total)) * 100).toFixed(0) + '% ($' + gb.this_month_total.toFixed(2) + ')'
                    + '\n***\n'
                    + '*ORDERS*\nToday: '
                    + gb.today_count
                    + '\nvs. Yesterday this time: ' + (((gb.today_count / gb.yesterday_count) - 1) * 100).toFixed(0) + '% (' + gb.yesterday_count + ')'
                    + '\nvs. Yesterday total: ' + (((gb.today_count / gb.yesterday_cum_count) - 1) * 100).toFixed(0) + '% (' + gb.yesterday_cum_count + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' this time: ' + (((gb.today_count / gb.last_week_count) - 1) * 100).toFixed(0) + '% (' + gb.last_week_count + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' total: ' + (((gb.today_count / gb.last_week_cum_count) - 1) * 100).toFixed(0) + '% (' + gb.last_week_cum_count + ')'
                    + '\nvs. Average day this month: ' + (((gb.today_count / gb.avg_month_count) - 1) * 100).toFixed(0) + '% (' + gb.avg_month_count + ')'
                    + '\nvs. Month-to-date: ' + (((gb.today_count / gb.this_month_count)) * 100).toFixed(0) + '% (' + gb.this_month_count + ')'
                    + '\n***\n'
                    + '*AOV*\nToday: $'
                    + gb.today_aov.toFixed(2)
                    + '\nvs. Yesterday this time: ' + (((gb.today_aov / gb.yesterday_aov) - 1) * 100).toFixed(0) + '% ($' + gb.yesterday_aov.toFixed(2) + ')'
                    + '\nvs. Yesterday total: ' + (((gb.today_aov / gb.yesterday_cum_aov) - 1) * 100).toFixed(0) + '% ($' + gb.yesterday_cum_aov.toFixed(2) + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' this time: ' + (((gb.today_aov / gb.last_week_aov) - 1) * 100).toFixed(0) + '% ($' + gb.last_week_aov.toFixed(2) + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' total: ' + (((gb.today_aov / gb.last_week_cum_aov) - 1) * 100).toFixed(0) + '% ($' + gb.last_week_cum_aov.toFixed(2) + ')'
                    + '\nvs. Month-to-date: ' + (((gb.today_aov / gb.this_month_aov) - 1) * 100).toFixed(0) + '% ($' + gb.this_month_aov.toFixed(2) + ')'
                    + '\n***\n'
                    + '*UNIT COUNT*\nToday: '
                    + gb.today_unit_count
                    + '\nvs. Yesterday this time: ' + (((gb.today_unit_count / gb.yesterday_unit_count) - 1) * 100).toFixed(0) + '% (' + gb.yesterday_unit_count + ')'
                    + '\nvs. Yesterday total: ' + (((gb.today_unit_count / gb.yesterday_cum_unit_count) - 1) * 100).toFixed(0) + '% (' + gb.yesterday_cum_unit_count + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' this time: ' + (((gb.today_unit_count / gb.last_week_unit_count) - 1) * 100).toFixed(0) + '% (' + gb.last_week_unit_count + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' total: ' + (((gb.today_unit_count / gb.last_week_cum_unit_count) - 1) * 100).toFixed(0) + '% (' + gb.last_week_cum_unit_count + ')'
                    + '\nvs. Average day this month: ' + (((gb.today_unit_count / gb.avg_month_unit_count) - 1) * 100).toFixed(0) + '% (' + gb.avg_month_unit_count + ')'
                    + '\nvs. Month-to-date: ' + (((gb.today_unit_count / gb.this_month_unit_count)) * 100).toFixed(0) + '% (' + gb.this_month_unit_count + ')'
                    + '\n***\n'
                    + '*IF YESTERDAY WAS AVERAGE, MONTHLY SALES WOULD BE: * $' + gb.yesterday_avg.toFixed(2)
                    + '\n*IF TODAY IS AVERAGE, MONTHLY SALES WOULD BE: * $' + gb.today_avg.toFixed(2)
                    + '\n*IF PAST 3 DAYS WERE AVERAGE, MONTHLY SALES WOULD BE: * $' + ((gb.today_avg + gb.yesterday_avg + gb.dby_avg) / 3).toFixed(2)
                    + '\n*IF SALES STAY CONSTANT, MONTHLY SALES ARE PROJECTED TO BE: * $' + (gb.avg_month_total * gb.month_days).toFixed(2)
                    + '\n***\nGet Latest Sales Stats: https://wanderset.com' + S.sales_stats_post_url
          , 'username': 'SALES-BOT'
          , 'icon_emoji': ':chart_with_upwards_trend:'
          , 'mrkdwn':true
          }
        }, Belt.cw(cb));

      }
    ], function(err){
      if (err) S.instance.ErrorNotification(err, 'SalesTotals', {

      });

      a.cb(err);
    });
  };

  S['url_nonce'] = 'xgZxXYA';
  S['sales_stats_post_url'] = '/' + S.name + '/' + S.url_nonce + '/get-latest-sales-stats';

  S.instance.express.all(S.sales_stats_post_url, function(req, res){
    res.status(200).end('OK, posting to Slack');
    S.PostDailySalesTotals();
  });

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
