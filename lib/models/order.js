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
        'id': {'type': String}
      , 'created_at': {'type': Date}
      , 'carrier': {'type': String}
      , 'label': {'type': String}
      , 'vendor': {'type': Mongoose.Schema.Types.ObjectId, 'ref': 'vendor'}
      , 'shipping_option': {'type': Mongoose.Schema.Types.ObjectId}
      , 'source': {
          'shipping_option': {'type': Object}
        }
      , 'status': {'type': String}
      , 'items': [
          {'type': Mongoose.Schema.Types.ObjectId}
        ]
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
  , 'status': {'type': String}
  });

  M.virtual('total_price').get(function(){
    return this.getPrice({
      'products': this.get('products')
    , 'line_items': this.get('line_items')
    });
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
    });

    return _.groupBy(a.o.products, function(p){
      return Belt.get(p, 'source.product.vendor');
    });
  });

  M.method('shopifyOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

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
    , 'financial_status': 'authorized'
    , 'tags': 'wanderset'
    , 'email': 'orders@wanderset.com'
    };

    gb.shopify_order = _.mapObject(self.productsByVendor(), function(v, k){
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

  M.method('streetammoOrderData', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'vendor': _.find(Instance.vendors, function(v){
        return Belt.get(v, 'custom_sync.strategy') === 'streetammo';
      })
    });

    gb['order'] = {
      'externalid': self.get('slug')
    , 'origin': 'wanderset'
    , 'comments': 'wanderset dropship order #' + self.get('slug')
    , 'email': 'orders@wanderset.com'
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
    , 'orderlines': a.o.vendor ? _.map((self.productsByVendor() || {})[a.o.vendor._id.toString()], function(o, i){
        return {
          'item_id': (i + 1)
        , 'quanity': o.quantity
        , 'productprice': o.source.stock.source.record.price
        , 'totalprice': o.source.stock.source.record.price
        , 'title': [o.source.stock.source.record.brand, o.source.stock.source.record.title].concat(_.values(o.options)).join(' / ')
        };
      }) : []
    };

    gb.order['total'] = _.reduce(gb.order.orderlines, function(m, o){
      return m + (o.totalprice || 0);
    }, 0);

    return gb.order;
  });

  M.method('toSanitizedObject', function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this;
    a.o = _.defaults(a.o, {

    });

    var obj = self.toObject();
    _.extend(obj, {
      'total_price': self.get('total_price')
    , 'shopify_order': self.shopifyOrderData()
    , 'streetammo_order': self.streetammoOrderData()
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
      delete p.source;
    });

    return obj;
  });

  M.pre('save', function(next){
    if (!this.get('slug')){
      this.set({
        'slug': Shortid.generate().toUpperCase().replace(/\W|_|\-/g, '')
      });
    }
    return next()
  });

  return M;
};
