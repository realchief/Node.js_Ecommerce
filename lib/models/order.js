var FS = require('fs')
  , Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Util = require('util')
  , Path = require('path')
  , Optionall = require('optionall')
  , Mongoose = require('mongoose')
  , Moment = require('moment-timezone')
  , CP = require('child_process')
  , OS = require('os')
  , Crypto = require('crypto')
  , Mime = require('mime')
  , Timestamps = require('../../node_modules/basecmd/lib/models/helpers/timestamps.js')
  , Join = require('../../node_modules/basecmd/lib/models/helpers/join.js')
  , Str = require('underscore.string')
  , Notify = require('../../node_modules/basecmd/lib/models/helpers/notify.js')
  , Shortid = require('shortid')
;

module.exports = function(Opts, Instance){
  var O = _.defaults(Belt.copy(Opts), {

  });

  var GB = {

  };

  var M = new Mongoose.Schema({
    'products': [
      {
        'product': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'product'}
      , 'stock': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'stock'}
      , 'options': {'type': Object}
      , 'unit_price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'quantity': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'price': {'type': Number, 'min': 0, 'required': true, 'default': 0}
      , 'status': {'type': String}
      , 'referring_list': {'type': String}
      , 'referring_media': {'type': String}
      , 'vendor_order_number': {'type': String}
      , 'source': {
          'product': {'type': Object}
        , 'stock': {'type': Object}
        , 'order': {'type': Object}
        }
      }
    ]
  , 'line_items': [
      {
        'label': {'type': String, 'required': true}
      , 'description': {'type': String, 'required': true}
      , 'type': {'type': String, 'required': true}
      , 'amount': {'type': Number, 'required': true, 'default': 0}
      }
    ]
  , 'buyer': {
      'user': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'user'}
    , 'first_name': {'type': String, 'required': true}
    , 'last_name': {'type': String, 'required': true}
    , 'street': {'type': String, 'required': true}
    , 'street_b': {'type': String}
    , 'city': {'type': String, 'required': true}
    , 'region': {'type': String, 'required': true}
    , 'country': {'type': String, 'required': true}
    , 'postal_code': {'type': String, 'required': true}
    , 'phone': {'type': String, 'required': true}
    , 'email': {'type': String, 'required': true}
    , 'subscriber': {'type': Boolean, 'default': false}
    , 'payment_method': {'type': String, 'required': true}
    , 'payment_customer_id': {'type': String, 'required': true}
    }
  , 'recipient': {
      'user': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'user'}
    , 'first_name': {'type': String, 'required': true}
    , 'last_name': {'type': String, 'required': true}
    , 'street': {'type': String, 'required': true}
    , 'street_b': {'type': String}
    , 'city': {'type': String, 'required': true}
    , 'region': {'type': String, 'required': true}
    , 'country': {'type': String, 'required': true}
    , 'postal_code': {'type': String, 'required': true}
    , 'phone': {'type': String, 'required': true}
    }
  , 'transactions': [
      {
        'id': {'type': String, 'required': true}
      , 'amount': {'type': Number, 'required': true}
      , 'created_at': {'type': Date, 'required': true}
      , 'type': {'type': String, 'required': true}
      , 'description': {'type': String}
      }
    ]
  , 'shipments': [
      {
        'created_at': {'type': Date}
      , 'id': {'type': String}
      , 'carrier': {'type': String}
      , 'label': {'type': String}
      , 'tracking_number': {'type': String}
      , 'tracking_url': {'type': String}
      , 'products': [
          {'type': Mongoose.Schema.Types.ObjectId}
        ]
      , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
      , 'source': {
          'shipment': {'type': Object}
        , 'platform': {'type': String}
        }
      , 'status': {'type': String}
      , 'sent_shipped_email': {'type': Boolean, 'default': false}
      , 'sent_delivered_email': {'type': Boolean, 'default': false}
      }
    ]
  , 'messages': [
      {
        'sender': {'type': String}
      , 'created_at': {'type': Date, 'required': true}
      , 'subject': {'type': String}
      , 'body': {'type': String}
      , 'status': {'type': String}
      }
    ]
  , 'total_paid': {'type': Number, 'required': true, 'min': 0}
  , 'total_outstanding': {'type': Number, 'required': true, 'min': 0}
  , 'total_refunded': {'type': Number, 'required': true, 'min': 0}
  , 'slug': {'type': String}
  , 'shipping_status': {'type': String}
  });

  M.virtual('total_price').get(function(){
    return this.getPrice({
      'products': this.get('products')
    , 'line_items': this.get('line_items')
    });
  });

  M.virtual('shipped_products').get(function(){
    var self = this;
    return Belt.get(_.filter(self.get('products'), function(p){
      return _.some(self.get('shipments'), function(s){
        return _.some(s.products, function(p2){
          return p2.toString() === p._id.toString();
        });
      });
    }), '[]._id.toString()');
  });

  M.virtual('unshipped_products').get(function(){
    var self = this;
    return Belt.get(_.reject(self.get('products'), function(p){
      return _.some(self.get('shipments'), function(s){
        return _.some(s.products, function(p2){
          return p2.toString() === p._id.toString();
        });
      });
    }), '[]._id.toString()');
  });

  M['Instance'] = Instance;

  M.plugin(Timestamps);
  M.plugin(Join);
  M.plugin(Notify);

  M.method('getPrice', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //products
      //line_items
    });

    return _.reduce(a.o.products, function(m, p){
      return m + (Belt.get(p, 'price') || 0);
    }, 0) + _.reduce(a.o.line_items, function(m, p){
      return m + (Belt.get(p, 'amount') || 0);
    }, 0);
  });

  M.method('productsByVendor', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'products': self.get('products')
    , 'omit_ordered': false
    });

    var vends = _.groupBy(a.o.products, function(p){
      return Belt.get(p, 'source.product.vendor');
    });

    if (a.o.omit_ordered){
      _.each(vends, function(v, k){
        vends[k] = _.filter(v, function(v2){
          return Belt.isNull(Belt.get(v2, 'source.order'));
        });
      });

      vends = _.pick(vends, function(v, k){
        return _.any(v);
      });
    }

    return vends;
  });

  M.method('ordersByVendor', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'products': self.get('products')
    });

    var orders = Belt.arrayDefalse(_.map(a.o.products, function(p){
      if (!Belt.get(p, 'source.order')) return;

      return _.extend({}, p.source.order, {
        '__vendor': Belt.get(p, 'source.product.vendor')
      });
    }));

    orders = _.uniq(orders, function(o){
      return Belt.stringify(o);
    });

    var vends = _.groupBy(orders, function(p){
      return Belt.get(p, '__vendor');
    });

    _.each(vends, function(v){
      _.each(v, function(v2){
        delete v2.__vendor;
      });
    });

    return vends;
  });

  M.method('orderProducts', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'products': self.get('products')
      //order
    });

    return _.filter(a.o.products, function(p){
      return Belt.equal(Belt.get(p, 'source.order'), a.o.order);
    });
  });

  M.method('getShipments', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'orders': self.ordersByVendor()
    });

    gb['fulfillments'] = [];

    _.each(a.o.orders, function(o, k){
      _.each(o, function(v){
        var f = Belt.get(v, 'order.fulfillments') || [];
        _.each(f, function(f2){
          f2['vendor'] = k;
        });

        gb.fulfillments = gb.fulfillments.concat(f);
      });
    });

    gb['shipments'] = [];

    _.each(gb.fulfillments, function(f){
      gb.shipments.push({
        'id': Belt.cast(f.id, 'string')
      , 'created_at': new Date()
      , 'carrier': f.tracking_company
      , 'label': f.service
      , 'tracking_number': f.tracking_number
      , 'tracking_url': f.tracking_url
      , 'products': _.chain(self.get('products'))
                     .filter(function(p){
                        return _.some(f.line_items, function(l){
                          return Belt.get(p, 'source.stock.source.record.id') === l.variant_id
                              && Belt.get(p, 'source.stock.source.record.product_id') === l.product_id;
                        });
                      })
                     .pluck('_id')
                     .value()
      , 'vendor': f.vendor
      , 'source': {
          'shipment': f
        , 'platform': 'shopify'
        }
      , 'status': f.shipment_status
      , 'sent_shipped_email': false
      , 'sent_delivered_email': false
      });
    });

    gb.shipments = _.filter(gb.shipments, function(s){
      var s2 = _.find(self.get('shipments'), function(s2){
        return s2.id === s.id;
      });

      if (s2) s2.status = s.status;

      return !s2;
    });

    _.each(gb.shipments, function(s){
      self.shipments.push(s);
    });

    return gb.shipments;
  });

  M.method('shopifyOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['shopify_vendors'] = _.pick(self.productsByVendor({
      'omit_ordered': true
    }), function(v, k){
      var vend = Instance.vendor_ids[k];

      return vend && Belt.get(vend, 'shopify.access_token');
    });

    if (!_.size(gb.shopify_vendors)) return null;

    gb['shopify_order'] = {
      'billing_address': {
        'first_name': self.get('buyer.first_name')
      , 'last_name': self.get('buyer.last_name')
      , 'address1': self.get('buyer.street')
      , 'address2': self.get('buyer.street_b')
      , 'city': self.get('buyer.city')
      , 'province': self.get('buyer.region')
      , 'country': self.get('buyer.country') || 'US'
      , 'zip': self.get('buyer.postal_code')
      , 'phone': self.get('buyer.phone')
      }
    , 'shipping_address': {
        'first_name': self.get('recipient.first_name')
      , 'last_name': self.get('recipient.last_name')
      , 'address1': self.get('recipient.street')
      , 'address2': self.get('recipient.street_b')
      , 'city': self.get('recipient.city')
      , 'province': self.get('recipient.region')
      , 'country': self.get('recipient.country') || 'US'
      , 'zip': self.get('recipient.postal_code')
      , 'phone': self.get('recipient.phone')
      }
    , 'note': 'wanderset dropship order #' + self.get('slug')
    , 'phone': '6173000585'
    , 'buyer_accepts_marketing': false
    , 'financial_status': 'paid'
    , 'tags': 'wanderset'
    , 'email': 'orders+' + self.get('slug') + '@wanderset.com'
    };

    gb.shopify_order = _.mapObject(gb.shopify_vendors, function(v, k){
      var price = 0
        , o = _.extend(Belt.copy(gb.shopify_order), {
                'line_items': _.map(v, function(v2){
                  price += (Belt.cast(Belt.get(v2, 'source.stock.source.record.price'), 'number') || 0);

                  return {
                    'product_id': Belt.get(v2, 'source.stock.source.record.product_id')
                  , 'quantity': v2.quantity
                  , 'price': Belt.get(v2, 'source.stock.source.record.price')
                  , 'variant_id': Belt.get(v2, 'source.stock.source.record.id')
                  };
                })
              });

      o['total_price'] = price.toFixed(2);

      return o;
    });

    return gb.shopify_order;
  });

  M.method('woocommerceOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['woocommerce_vendors'] = _.pick(self.productsByVendor({
      'omit_ordered': true
    }), function(v, k){
      var vend = Instance.vendor_ids[k];

      return vend && Belt.get(vend, 'woocommerce.secret');
    });

    if (!_.size(gb.woocommerce_vendors)) return null;

    gb['order'] = {
      'currency': 'USD'
    , 'payment_method': 'wanderset'
    , 'payment_method_title': 'wanderset dropship'
    , 'transaction_id': self.get('slug')
    , 'billing_address': {
        'first_name': self.get('buyer.first_name')
      , 'last_name': self.get('buyer.last_name')
      , 'address_1': self.get('buyer.street')
      , 'address_2': self.get('buyer.street_b')
      , 'city': self.get('buyer.city')
      , 'state': self.get('buyer.region')
      , 'country': self.get('buyer.country') || 'US'
      , 'postcode': self.get('buyer.postal_code')
      , 'phone': '6173000585'
      , 'email': 'orders+' + self.get('slug') + '@wanderset.com'
      }
    , 'shipping_address': {
        'first_name': self.get('recipient.first_name')
      , 'last_name': self.get('recipient.last_name')
      , 'address_1': self.get('recipient.street')
      , 'address_2': self.get('recipient.street_b')
      , 'city': self.get('recipient.city')
      , 'state': self.get('recipient.region')
      , 'country': self.get('recipient.country') || 'US'
      , 'postcode': self.get('recipient.postal_code')
      , 'phone': '6173000585'
      , 'email': 'orders+' + self.get('slug') + '@wanderset.com'
      }
    , 'note': 'wanderset dropship order #' + self.get('slug')
    };

    gb.order = _.mapObject(gb.woocommerce_vendors, function(v, k){
      var price = 0
        , o = _.extend(Belt.copy(gb.order), {
                'line_items': _.map(v, function(v2){
                  //price += (Belt.cast(Belt.get(v2, 'source.stock.source.record.price'), 'number') || 0);

                  return {
                    'name': Belt.get(v2, 'source.product.source.record.title')
                  , 'product_id': Belt.get(v2, 'source.product.source.record.id')
                  , 'variation_id': Belt.get(v2, 'source.stock.source.record.id')
                  , 'quantity': v2.quantity
                  , 'total': (Belt.cast(Belt.get(v2, 'source.stock.source.record.price'), 'number') * v2.quantity).toFixed()
                  , 'meta_data': _.map(Belt.get(v2, 'source.stock.options'), function(v3, k3){
                      return {
                        'key': k3
                      , 'value': v3.value
                      };
                    })
                  };
                })
              });

      //o['total_price'] = price.toFixed(2);

      return o;
    });

    return gb.order;
  });

  M.method('streetammoOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'vendor': _.find(Instance.vendors, function(v){
        return Belt.get(v, 'custom_sync.strategy') === 'streetammo';
      })
    });

    gb['order_lines'] = a.o.vendor ? _.map((self.productsByVendor({
      'omit_ordered': true
    }) || {})[a.o.vendor._id.toString()], function(o, i){
      return {
        'item_id': (i + 1)
      , 'quantity': o.quantity
      , 'productprice': o.source.stock.source.record.price
      , 'totalprice': o.source.stock.source.record.price
      , 'title': [o.source.stock.source.record.brand, o.source.stock.source.record.title].concat(_.values(o.options)).join(' / ')
      };
    }) : [];

    if (!_.any(gb.order_lines)) return null;

    gb['order'] = {
      'externalid': self.get('slug')
    , 'origin': 'wanderset'
    , 'comments': 'wanderset dropship order #' + self.get('slug')
    , 'email': 'orders+' + self.get('slug') + '@wanderset.com'
    , 'phone': '6173000585'
    , 'firstname': self.get('buyer.first_name')
    , 'surname': self.get('buyer.last_name')
    , 'address': Belt.arrayDefalse([self.get('buyer.street'), self.get('buyer.street_b')]).join(', ')
    , 'zip': self.get('buyer.postal_code')
    , 'city': self.get('buyer.city')
    , 'country': self.get('buyer.country') || 'US'
    , 'recipientfirstname': self.get('recipient.first_name')
    , 'recipientsurname': self.get('recipient.last_name')
    , 'recipientaddress': Belt.arrayDefalse([self.get('recipient.street'), self.get('recipient.street_b')]).join(', ')
    , 'recipientzip': self.get('recipient.postal_code')
    , 'recipientcity': self.get('recipient.city')
    , 'recipientcountry': self.get('recipient.country') || 'US'
    , 'orderlines': gb.order_lines
    };

    gb.order['total'] = _.reduce(gb.order.orderlines, function(m, o){
      return m + (o.totalprice || 0);
    }, 0);

    return gb.order;
  });

  M.method('streetammoCSVOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'vendor': _.find(Instance.vendors, function(v){
        return Belt.get(v, 'custom_sync.strategy') === 'streetammo';
      })
    });

    gb['order_lines'] = a.o.vendor ? _.map((self.productsByVendor({
      'omit_ordered': true
    }) || {})[a.o.vendor._id.toString()], function(o, i){
      return {
        'item_id': (i + 1)
      , 'quantity': o.quantity
      , 'productprice': o.source.stock.source.record.price
      , 'totalprice': o.source.stock.source.record.price
      , 'title': [o.source.stock.source.record.brand, o.source.stock.source.record.title].concat(_.values(o.options)).join(' / ')
      , 'url': o.source.product.source.record.url
      , 'options': _.map(o.options, function(v, k){
          return k + ': ' + v;
        }).join(', ')
      };
    }) : [];

    if (!_.any(gb.order_lines)) return null;

    gb['order'] = {
      'externalid': self.get('slug')
    , 'origin': 'wanderset'
    , 'comments': 'wanderset dropship order #' + self.get('slug')
    , 'email': 'orders+' + self.get('slug') + '@wanderset.com'
    , 'phone': '6173000585'
    , 'firstname': self.get('buyer.first_name')
    , 'surname': self.get('buyer.last_name')
    , 'address': Belt.arrayDefalse([self.get('buyer.street'), self.get('buyer.street_b')]).join(', ')
    , 'zip': self.get('buyer.postal_code')
    , 'city': self.get('buyer.city')
    , 'country': self.get('buyer.country') || 'US'
    , 'recipientfirstname': self.get('recipient.first_name')
    , 'recipientsurname': self.get('recipient.last_name')
    , 'recipientaddress': Belt.arrayDefalse([self.get('recipient.street'), self.get('recipient.street_b')]).join(', ')
    , 'recipientzip': self.get('recipient.postal_code')
    , 'recipientcity': self.get('recipient.city')
    , 'recipientcountry': self.get('recipient.country') || 'US'
    , 'orderlines': _.map(gb.order_lines, function(i){
        return _.map(i, function(v, k){
          return k.toUpperCase() + ': ' + v;
        }).join('\n')
      }).join('\n------------\n')
    };

    gb.order['total'] = _.reduce(gb.order.orderlines, function(m, o){
      return m + (o.totalprice || 0);
    }, 0);

    return gb.order;
  });

  M.method('createVendorOrders', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        gb['vendor_orders'] = self.productsByVendor();
        gb['shopify_orders'] = self.shopifyOrderData();
        gb['woocommerce_orders'] = self.woocommerceOrderData();
        gb['orders'] = [];

        Async.eachSeries(_.keys(gb.shopify_orders), function(k, cb2){
          Instance.helpers.shopify.CreateOrder({
            'vendor': Instance.vendor_ids[k]
          , 'order': gb.shopify_orders[k]
          }, function(err, ord){
            if (err) Instance.emit('error', err);

            if (ord) _.each(gb.vendor_orders[k], function(v){
              gb.orders.push(ord);

              var prod = _.find(self.get('products'), function(p){
                return p._id.toString() === v._id.toString();
              });

              prod.source.order = Belt.copy(ord);
            });

            cb2();
          });
        }, Belt.cw(cb));
      }
    , function(cb){
        Async.eachSeries(_.keys(gb.woocommerce_orders), function(k, cb2){
          Instance.helpers.woocommerce.CreateOrder({
            'vendor': Instance.vendor_ids[k]
          , 'order': gb.woocommerce_orders[k]
          }, function(err, ord){
            if (err) Instance.emit('error', err);

            if (ord) _.each(gb.vendor_orders[k], function(v){
              gb.orders.push(ord);

              var prod = _.find(self.get('products'), function(p){
                return p._id.toString() === v._id.toString();
              });

              prod.source.order = Belt.copy(ord);
            });

            cb2();
          });
        }, Belt.cw(cb));
      }
    ], function(err){
      a.cb(err, gb.orders);
    });
  });

  M.method('createCSVOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['info'] = _.extend({
      'order_id': self.get('slug')
    , 'order_date': Moment(self.get('created_at')).format('MM/DD/YYYY hh:mm a')
    }, _.object(_.map(self.get('buyer'), function(v, k){
      return 'buyer_' + k;
    }), _.values(self.get('buyer'))), _.object(_.map(self.get('recipient'), function(v, k){
      return 'recipient_' + k;
    }), _.values(self.get('recipient'))), {
      'stripe_order_id': Belt.get(self, 'transactions.0.id')
    });

    gb['orders'] = _.map(self.get('products'), function(p){
      var line = _.find(Belt.get(p, 'source.order.order.line_items'), function(l){
        return l.product_id === Belt.cast(Belt.get(p, 'source.product.sku'), 'number')
            && l.variant_id === Belt.cast(Belt.get(p, 'source.stock.sku'), 'number')
        ;
      });

      var shipment = _.find(Belt.get(p, 'source.order.order.fulfillments'), function(f){
        return _.some(f.line_items, function(l){
          return l.product_id === Belt.cast(Belt.get(p, 'source.product.sku'), 'number')
              && l.variant_id === Belt.cast(Belt.get(p, 'source.stock.sku'), 'number')
          ;
        });
      });

      return _.extend({}, gb.info, {
        'wanderset_product_label': Belt.get(p, 'source.product.label.us') || Belt.get(p, 'source.product.name')
      , 'wanderset_product_url': Instance.settings.host + '/product/' + p.product
      , 'wanderset_product_options': _.map(p.options, function(v, k){
          return k + ': ' + v;
        }).join(' | ')
      , 'quantity': p.quantity
      , 'wanderset_item_id': p._id
      , 'wanderset_unit_price': p.unit_price
      , 'wanderset_price': p.price
      , 'wanderset_ref_set': p.referring_list || ''
      , 'wanderset_ref_outfit': p.referring_media && !p.referring_media.match(/\.json/i) ? p.referring_media : ''
      , 'brand': Belt.get(p, 'source.product.brands.join(", ")')
      , 'vendor': Belt.get(Instance.vendor_ids[p.source.product.vendor], 'name')
      , 'vendor_product_sku': Belt.get(p, 'source.product.sku') || ''
      , 'vendor_stock_sku': Belt.get(p, 'source.stock.sku') || ''
      , 'vendor_product_label': Belt.get(p, 'source.product.source.record.url')
                              ? Belt.get(p, 'source.product.source.record.brand') + ' ' + Belt.get(p, 'source.product.source.record.title')
                              : Belt.get(p, 'source.product.source.record.title')
      , 'vendor_product_url': Belt.get(p, 'source.product.source.record.url') || ''
      , 'vendor_order_id': Belt.get(p, 'source.order.order.id') || ''
      , 'vendor_price': Belt.get(line, 'price')
      , 'shipped': shipment ? Moment(shipment.created_at).format('MM/DD/YYYY hh:mm a') : ''
      , 'shipper': Belt.get(shipment, 'tracking_company') || ''
      , 'tracking': Belt.get(shipment, 'tracking_number') || ''
      , 'shipment_status': Belt.get(shipment, 'shipment_status') || ''
      });
    });

    return gb.orders;
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
      'total_price': self.get('total_price')
    , 'shipped_products': self.get('shipped_products')
    , 'unshipped_products': self.get('unshipped_products')
    , 'shopify_order': self.shopifyOrderData()
    , 'woocommerce_order': self.woocommerceOrderData()
    , 'streetammo_order': self.streetammoOrderData()
    , 'streetammo_csv_order': self.streetammoCSVOrderData()
    , 'vendor_products': self.productsByVendor()
    , 'vendor_orders': self.ordersByVendor()
    });

    _.omit(obj, [

    ]);

    return obj;
  });

  M.method('toShortenedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    var obj = self.toSanitizedObject();
    _.extend(obj, {

    });

    _.each(obj.products, function(p){
      Belt.delete(p, 'source.product');
      Belt.delete(p, 'source.stock');
    });

    return obj;
  });

  M.pre('save', function(next){
    if (!this.get('slug')){
      this.set({
        'slug': _.times(8, function(i){
                  return _.sample('0123456789'.split(''));
                }).join('') //Shortid.generate().toUpperCase().replace(/\W|_|\-/g, '')
      });
    }
    return next()
  });

  M.pre('save', function(next){
    var self = this;

    self.set({
      'total_paid': _.reduce(self.get('transactions'), function(m, t){
        return (t.amount || 0) + m;
      }, 0)
    });

    var unshipped_products = _.filter(self.get('products'), function(p){
      //if (!Belt.get(Instance.vendor_ids[Belt.get(p, 'source.product.vendor.toString()')], 'shopify.access_token')) return false;

      //if (Moment(self.get('created_at')).isBefore(Moment('08/31/2017'), 'day')) return false;

      if (_.some(self.get('shipments'), function(s){
        return _.some(s.products, function(p2){
          return p2.toString() === p._id.toString();
        });
      })) return false;

      return true;
    });

    self.set({
      'shipping_status': _.any(unshipped_products) ? 'unshipped' : 'shipped'
    });

    next();
  });

  M.static('orderBreakdown', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'orders': []
    , 'vendor_breakdown': true
    });

    gb['total_product_sales'] = _.reduce(a.o.orders, function(m, o){
      return m + _.reduce(o.products, function(m2, t){
        return m2 + (t.price || 0);
      }, 0);
    }, 0).toFixed(2);

    gb['total_sales_tax'] = _.reduce(a.o.orders, function(m, o){
      return m + _.reduce(o.line_items, function(m2, t){
        return m2 + (t.amount || 0);
      }, 0);
    }, 0).toFixed(2);

    gb['total_revenue'] = _.reduce(a.o.orders, function(m, o){
      return m + _.reduce(o.transactions, function(m2, t){
        return m2 + (t.amount || 0);
      }, 0);
    }, 0).toFixed(2);

    gb['total_orders'] = a.o.orders.length;

    gb['total_items'] = _.reduce(a.o.orders, function(m, o){
      return m + o.products.length;
    }, 0);

    if (a.o.vendor_breakdown){
      gb['vendors'] = {};

      _.each(Belt.get(a.o.orders, '[].toSanitizedObject()'), function(o){
        _.each(o.vendor_products, function(v, k){
          if (!Instance.vendor_ids[k]) return;

          gb['vendors'][Instance.vendor_ids[k].name] = gb['vendors'][Instance.vendor_ids[k].name] || {
            'total_revenue': 0
          , 'total_orders': 0
          , 'total_items': 0
          };

          var obj = gb['vendors'][Instance.vendor_ids[k].name];

          _.each(v, function(v2){
            obj.total_orders++;
            obj.total_items += v2.quantity;
            obj.total_revenue += v2.price;
          });
        })
      });

      _.each(gb.vendors, function(v, k){
        v.total_revenue = v.total_revenue.toFixed(2);
      });
    }

    return gb;
  });

  return M;
};
