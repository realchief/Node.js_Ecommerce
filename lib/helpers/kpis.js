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

  S['GetOrderMetrics'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //docs
      //product_filter
      //transaction_filter
      //shipment_filter
      //order_filter
      //vendor_filter
      //line_item_filter
    });

    _.each(a.o.docs, function(d){
      if (a.o.shipment_filter) d.shipments = _.filter(d.shipments, a.o.shipment_filter);
      if (a.o.transaction_filter) d.transactions = _.filter(d.transactions, a.o.transaction_filter);
      if (a.o.line_item_filter) d.line_items = _.filter(d.line_items, a.o.line_item_filter);

      if (a.o.vendor_filter){
        d.products = _.filter(d.products, function(p){
          return a.o.vendor_filter(Belt.get(p, 'source.product.vendor'));
        });

        d.vendor_products = _.pick(d.vendor_products, function(v, k){
          return a.o.vendor_filter(k);
        });

        d.vendor_orders = _.pick(d.vendor_orders, function(v, k){
          return a.o.vendor_filter(k);
        });
      }

      if (a.o.order_filter){
        d.products = _.filter(d.products, function(p){
          return a.o.order_filter(Belt.get(p, 'source.order'));
        });

        _.each(d.vendor_products, function(v, k){
          d.vendor_products[k] = _.filter(v, function(p){
            return a.o.order_filter(Belt.get(p, 'source.order'));
          });
        });

        _.each(d.vendor_orders, function(v, k){
          d.vendor_orders[k] = _.filter(v, a.o.order_filter);
        });
      }

      if (a.o.product_filter){
        d.products = _.filter(d.products, a.o.product_filter);

        _.each(d.vendor_products, function(v, k){
          d.vendor_products[k] = _.filter(v, a.o.product_filter);
        });
      }
    });

    a.o.docs = _.filter(a.o.docs, function(d){
      return _.any(d.products);
    });

    gb['data'] = {
      'sales': Belt.get(a.o.docs, 'length') || 0
    , 'revenue': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.transactions, function(m2, t){
          return m2 + (t.amount || 0);
        }, 0);
      }, 0)
    , 'refunded_revenue': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.transactions, function(m2, t){
          return m2 + (t.amount_refunded || 0);
        }, 0);
      }, 0)
    , 'fully_refunded_sales': Belt.get(_.filter(a.o.docs, function(d){
        return _.reduce(d.transactions, function(m2, t){
          return m2 + (t.amount_refunded || 0);
        }, 0) >= _.reduce(d.transactions, function(m2, t){
          return m2 + (t.amount || 0);
        }, 0);
      }), 'length') || 0
    , 'partially_refunded_sales': Belt.get(_.filter(a.o.docs, function(d){
        return _.reduce(d.transactions, function(m2, t){
          return m2 + (t.amount_refunded || 0);
        }, 0) > 0;
      }), 'length') || 0
    , 'product_revenue': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.products, function(m2, p){
          return m2 + (p.price || 0);
        }, 0);
      }, 0)
    , 'order_payments': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.vendor_orders, function(m2, v){
          return m2 + _.reduce(v, function(m3, v2){
            return m3 + Belt.cast(Belt.get(v2, 'order.total_price') || Belt.get(v2, 'order.total') || 0, 'number');
          }, 0);
        }, 0);
      }, 0)
    , 'units': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.products, function(m2, p){
          return m2 + (p.quantity || 0);
        }, 0);
      }, 0)
    , 'discounts': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.line_items, function(m2, l){
          return m2 + (Belt.get(l, 'details.promo_code') ? l.amount : 0);
        }, 0);
      }, 0)
    , 'tax': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.line_items, function(m2, l){
          return m2 + (Belt.get(l, 'type') === 'tax' ? l.amount : 0);
        }, 0);
      }, 0)
    , 'shipping': _.reduce(a.o.docs, function(m, d){
        return m + _.reduce(d.line_items, function(m2, l){
          return m2 + (Belt.get(l, 'type') === 'shipping' ? l.amount : 0);
        }, 0);
      }, 0)
    };

    _.extend(gb.data, {
      'aov': gb.data.revenue / gb.data.sales
    , 'aou': gb.data.units / gb.data.sales
    });

    return gb.data;
  };

  S['SummarizeOrders'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'query': {}
    });

    Async.waterfall([
      function(cb){
        S.instance.db.model('order').find(a.o.query, Belt.cs(cb, gb, 'odocs', 1, 0));
      }
    , function(cb){
        gb.docs = Belt.get(gb, 'odocs.[].toSanitizedObject()');

        gb['data'] = {};

        gb.data['total'] = self.GetOrderMetrics({
          'docs': gb.docs
        });

        gb['vendors'] = _.chain(gb.docs)
                         .pluck('products')
                         .flatten()
                         .map(function(p){ return Belt.get(p, 'source.product.vendor'); })
                         .compact()
                         .uniq(function(v){ return v.toString(); })
                         .sortBy(function(v){ return Belt.get(self.instance.vendor_ids[v.toString()], 'name') || '(no vendor)'; })
                         .value();

        gb['vendors'] = _.object(gb.vendors, _.map(gb.vendors, function(v){
          var docs = Belt.get(gb, 'odocs.[].toSanitizedObject()');

          return self.GetOrderMetrics({
            'docs': docs
          , 'vendor_filter': function(v2){ return Belt.get(v2, 'toString()') === v.toString(); }
          });
        }));

        gb.data['vendors'] = _.object(_.map(gb.vendors, function(v, k){
          return Belt.get(self.instance.vendor_ids[k], 'name') || '(no vendor)';
        }), _.values(gb.vendors));

        gb['brands'] = _.chain(gb.docs)
                        .pluck('products')
                        .flatten()
                        .map(function(p){ return Belt.get(p, 'source.product.brands.0.toLowerCase()'); })
                        .compact()
                        .map(function(v){ return v.replace(/\W/g, ' '); })
                        .uniq(function(v){ return v; })
                        .sortBy(function(v){ return v; })
                        .value();

        gb['brands'] = _.object(gb.brands, _.map(gb.brands, function(v){
          var docs = Belt.get(gb, 'odocs.[].toSanitizedObject()');

          return self.GetOrderMetrics({
            'docs': docs
          , 'product_filter': function(v2){
              var brand = Belt.get(v2, 'source.product.brands.0.toLowerCase()');
              if (!brand) return false;
              brand = brand.replace(/\W/g, ' ');
              return brand === v;
            }
          });
        }));

        gb.data['brands'] = gb.brands;

        gb['categories'] = _.chain(gb.docs)
                            .pluck('products')
                            .flatten()
                            .map(function(p){ return Belt.get(p, 'source.product.categories.0') || Belt.get(p, 'source.product.auto_category'); })
                            .compact()
                            .map(function(c){
                              var cats = [];
                              cats.push(c);
                              c = c.split(' > ');
                              c.pop();
                              while (_.any(c)){
                                cats.push(c.join(' > '));
                                c.pop();
                              }

                              return cats;
                            })
                            .flatten()
                            .uniq(function(v){ return v; })
                            .sortBy(function(v){ return v; })
                            .value();

        gb['categories'] = _.object(gb.categories, _.map(gb.categories, function(v){
          var docs = Belt.get(gb, 'odocs.[].toSanitizedObject()');

          var re = new RegExp('^' + self.instance.escapeRegExp(v));

          return self.GetOrderMetrics({
            'docs': docs
          , 'product_filter': function(v2){
              var cat = Belt.get(v2, 'source.product.categories.0') || Belt.get(v2, 'source.product.auto_category');
              if (!cat) return false;
              return cat.match(re);
            }
          });
        }));

        gb.data['categories'] = gb.categories;

        gb['product_options'] = _.chain(gb.docs)
                            .pluck('products')
                            .flatten()
                            .map(function(p){
                               return _.values(_.pick(p.options, function(v, k){
                                 return k.match(/size/i);
                               })) || [];
                             })
                            .flatten()
                            .compact()
                            .map(function(c){
                              return c.toLowerCase().replace(/\W/g, ' ');
                            })
                            .uniq(function(v){ return v; })
                            .sortBy(function(v){ return v; })
                            .value();

        gb['product_options'] = _.object(gb.product_options, _.map(gb.product_options, function(v){
          var docs = Belt.get(gb, 'odocs.[].toSanitizedObject()');

          return self.GetOrderMetrics({
            'docs': docs
          , 'product_filter': function(v2){
              return _.some(v2.options, function(v3){
                return v3.toLowerCase().replace(/\W/g, ' ') === v;
              });
            }
          });
        }));

        gb.data['sizes'] = gb.product_options;

        gb['statuses'] = _.groupBy(gb.docs, function(d){
          return (d.support_status || 'no status').toLowerCase().replace(/\W/, ' ');
        });

        gb.statuses = _.mapObject(gb.statuses, function(v, k){
          return self.GetOrderMetrics({
            'docs': v
          });
        });

        gb.data['statuses'] = gb.statuses;

        gb['promo_codes'] = _.groupBy(gb.docs, function(d){
          var pc = _.find(d.line_items, function(l){
            return Belt.get(l, 'details.promo_code')
          });

          if (!pc) return '(no promo code)';

          return pc.details.promo_code.toUpperCase();
        });

        gb.promo_codes = _.mapObject(gb.promo_codes, function(v, k){
          return self.GetOrderMetrics({
            'docs': v
          });
        });

        gb.data['promo_codes'] = gb.promo_codes;

        gb['products'] = _.chain(gb.docs)
                          .pluck('products')
                          .flatten()
                          .map(function(p){ return Belt.get(p, 'source.product'); })
                          .compact()
                          .uniq(function(v){ return v.slug; })
                          .value();

        gb['products'] = _.object(_.map(gb.products, function(p){
          return Belt.arrayDefalse([Belt.get(p, 'brands.0'), Belt.get(p, 'label.us')]).join(' ')
               + ' | ' + p.slug;
        }), _.map(gb.products, function(v){
          var docs = Belt.get(gb, 'odocs.[].toSanitizedObject()');

          return self.GetOrderMetrics({
            'docs': docs
          , 'product_filter': function(v2){
              return Belt.get(v2, 'source.product.slug') === v.slug;
            }
          });
        }));

        gb.data['products'] = gb.products;

        cb();
      }
    ], function(err){
      a.cb(err, gb.data);
    });
  };

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
          'url': S.instance.settings.slack.kpis
        , 'method': 'post'
        , 'json': true
        , 'body': {
            'text': '*SALES*\nToday: $'
                    + gb.today_total.toFixed(2)
                    /*+ '\nvs. Yesterday this time: ' + (((gb.today_total / gb.yesterday_total) - 1) * 100).toFixed(0) + '% ($' + gb.yesterday_total.toFixed(2) + ')'
                    + '\nvs. Yesterday total: ' + (((gb.today_total / gb.yesterday_cum_total) - 1) * 100).toFixed(0) + '% ($' + gb.yesterday_cum_total.toFixed(2) + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' this time: ' + (((gb.today_total / gb.last_week_total) - 1) * 100).toFixed(0) + '% ($' + gb.last_week_total.toFixed(2) + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' total: ' + (((gb.today_total / gb.last_week_cum_total) - 1) * 100).toFixed(0) + '% ($' + gb.last_week_cum_total.toFixed(2) + ')'
                    + '\nvs. Average day this month: ' + (((gb.today_total / gb.avg_month_total) - 1) * 100).toFixed(0) + '% ($' + gb.avg_month_total.toFixed(2) + ')'*/
                    + '\nMonth-to-date: ' + (((gb.today_total / gb.this_month_total)) * 100).toFixed(0) + '% ($' + gb.this_month_total.toFixed(2) + ')'
                    //+ '\n***\n'
                    + '\n*ORDERS*\nToday: '
                    + gb.today_count
                    /*+ '\nvs. Yesterday this time: ' + (((gb.today_count / gb.yesterday_count) - 1) * 100).toFixed(0) + '% (' + gb.yesterday_count + ')'
                    + '\nvs. Yesterday total: ' + (((gb.today_count / gb.yesterday_cum_count) - 1) * 100).toFixed(0) + '% (' + gb.yesterday_cum_count + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' this time: ' + (((gb.today_count / gb.last_week_count) - 1) * 100).toFixed(0) + '% (' + gb.last_week_count + ')'
                    + '\nvs. Last ' + Moment().format('dddd') + ' total: ' + (((gb.today_count / gb.last_week_cum_count) - 1) * 100).toFixed(0) + '% (' + gb.last_week_cum_count + ')'
                    + '\nvs. Average day this month: ' + (((gb.today_count / gb.avg_month_count) - 1) * 100).toFixed(0) + '% (' + gb.avg_month_count.toFixed(0) + ')'*/
                    + '\nMonth-to-date: ' + (((gb.today_count / gb.this_month_count)) * 100).toFixed(0) + '% (' + gb.this_month_count + ')'
                    /*+ '\n***\n'
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
                    + '\nvs. Average day this month: ' + (((gb.today_unit_count / gb.avg_month_unit_count) - 1) * 100).toFixed(0) + '% (' + gb.avg_month_unit_count.toFixed(0) + ')'
                    + '\nvs. Month-to-date: ' + (((gb.today_unit_count / gb.this_month_unit_count)) * 100).toFixed(0) + '% (' + gb.this_month_unit_count + ')'
                    + '\n***\n'
                    + '*IF YESTERDAY WAS AVERAGE, MONTHLY SALES WOULD BE: * $' + gb.yesterday_avg.toFixed(2)
                    + '\n*IF TODAY IS AVERAGE, MONTHLY SALES WOULD BE: * $' + gb.today_avg.toFixed(2)
                    + '\n*IF PAST 3 DAYS WERE AVERAGE, MONTHLY SALES WOULD BE: * $' + ((gb.today_avg + gb.yesterday_avg + gb.dby_avg) / 3).toFixed(2)
                    + '\n*IF SALES STAY CONSTANT, MONTHLY SALES ARE PROJECTED TO BE: * $' + (gb.avg_month_total * gb.month_days).toFixed(2)
                    + '\n***\n*TOTAL SALES THIS MONTH: $' + gb.this_month_total.toFixed(2) + '*'*/
                    + '\nGet Latest Sales Stats: https://wanderset.com' + S.sales_stats_post_url + '\n***'
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

  S['PostVendorProductStats'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        Async.mapSeries(_.keys(S.instance.vendor_ids) || [], function(e, cb2){
          if (S.instance.vendor_ids[e].name === 'wanderset_dev') return cb2();

          S.instance.db.model('product').count({
            'vendor': e
          , 'hide': {
              '$ne': true
            }
          , 'sync_hide': {
              '$ne': true
            }
          , 'low_price': {
              '$gt': 0
            }
          }, function(err, count){
            return cb2(null, count || 0);
          });
        }, Belt.cs(cb, gb, 'vendor_products', 1, 0));
      }
    , function(cb){
        gb.vendor_products = _.compact(gb.vendor_products);

        S.instance.db.model('product').count({
          'hide': {
            '$ne': true
          }
        , 'sync_hide': {
            '$ne': true
          }
        , 'low_price': {
            '$gt': 0
          }
        }, function(err, count){
          gb['total_count'] = count || 0;
          cb();
        });
      }
    , function(cb){
        gb['vendor_products'] = _.object(_.keys(S.instance.vendor_ids), gb.vendor_products);

        Request({
          'url': S.instance.settings.slack.kpis
        , 'method': 'post'
        , 'json': true
        , 'body': {
            'text': '*TOTAL SKUS*: ' + gb.total_count + ' available'
                  /*+ (_.size(S.instance.vendor_ids) ? ('\n***\n' + _.sortBy(_.map(S.instance.vendor_ids, function(v, k){
                      return '*' + v.name + '*: ' + gb.vendor_products[k] + ' SKUs available'
                           + (!gb.vendor_products[k] ? ' [ALERT - ZERO PRODUCTS!]' : '');
                    }), function(s){ return s; }).join('\n')) : '')*/
                  + '\nGet Latest Vendor Product Stats: https://wanderset.com' + S.vendor_stats_post_url + '\n***'
          , 'username': 'INVENTORY-BOT'
          , 'icon_emoji': ':chart_with_upwards_trend:'
          }
        }, Belt.cw(cb));
      }
    ], function(err){
      a.cb(err);
    });
  };

  S['vendor_stats_post_url'] = '/' + S.name + '/' + S.url_nonce + '/get-latest-vendor-product-stats';

  S.instance.express.all(S.vendor_stats_post_url, function(req, res){
    res.status(200).end('OK, posting to Slack');
    S.PostVendorProductStats();
  });

  S['PostBrandProductStats'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        Request({
          'url': S.instance.settings.slack.kpis
        , 'method': 'post'
        , 'json': true
        , 'body': {
            'text': '***\nBRAND PRODUCTS\n'
                  + (_.size(S.instance.brand_sets) ? ('\n***\n' + _.sortBy(_.map(S.instance.brand_sets, function(v, k){
                      return '*' + v.name + '*: ' + Belt.get(v, 'filtered_products.length') + ' SKUs available'
                           + (!Belt.get(v, 'filtered_products.length') ? ' [ALERT - ZERO PRODUCTS!]' : '');
                    }), function(s){ return s; }).join('\n')) : '')
                  + '\n***\nGet Latest Brand Product Stats: https://wanderset.com' + S.brand_stats_post_url
          , 'username': 'INVENTORY-BOT'
          , 'icon_emoji': ':chart_with_upwards_trend:'
          }
        }, Belt.cw(cb));
      }
    ], function(err){
      a.cb(err);
    });
  };

  S['brand_stats_post_url'] = '/' + S.name + '/' + S.url_nonce + '/get-latest-brand-product-stats';

  S.instance.express.all(S.brand_stats_post_url, function(req, res){
    res.status(200).end('OK, posting to Slack');
    S.PostBrandProductStats();
  });

  if (S.settings.environment === 'sdevelopment' || S.settings.environment === 'production-worker'){
    S.instance.on('ready', function(){
      Async.forever(function(next){
        S.PostDailySalesTotals(function(){
          setTimeout(next, 60 * 1000 * 60);
        });
      }, Belt.np);
    });
  }

  if (S.settings.environment === 'sdevelopment' || S.settings.environment === 'production-worker') S.instance.on('ready', function(){
    Async.forever(function(next){
      S.PostVendorProductStats(function(){
        setTimeout(next, 1000 * 60 * 30);
      });
    });
  });

/*
  if (true || S.settings.environment === 'production-worker') S.instance.on('ready', function(){
    Async.forever(function(next){
      S.PostBrandProductStats(function(){
        setTimeout(next, 1000 * 60 * 30);
      });
    });
  });
*/

  setTimeout(function(){
    return S.emit('ready');
  }, 0);

};
