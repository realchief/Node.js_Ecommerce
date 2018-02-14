#!/usr/bin/env node

var Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Request = require('request')
  , Querystring = require('querystring')
  , Str = require('underscore.string')
  , Natural = require('natural')
;

module.exports = function(S){
    S['api_urls'] = {
        'get_request_token': 'oauth/token/request/'
      , 'get_access_token': 'oauth/token/access/'
      , 'get_products': 'rest/V1/products?searchCriteria[page_size]=20&searchCriteria[current_page]='
      , 'guest_cart': 'rest/V1/guest-carts/'
      , 'products': 'rest/V1/products/'
      , 'orders': 'rest/V1/orders/'
      , 'media_prefix': 'pub/media/catalog/product/'
      , 'configurable_products': 'rest/V1/configurable-products/'
    };

    S['OptionsPermutation'] = function (availableOptions, passObject) {
        var returnArray = [];
        if (availableOptions.length === 0) return;
        else if (availableOptions.length === 1 && passObject === {}) return availableOptions[0].options;
        for (var i = 0; i < availableOptions[0].options.length; i++) {
            passObject[availableOptions[0].title] = Belt.copy(availableOptions[0].options[i][availableOptions[0].title]);
            if (availableOptions.length === 1) {
                returnArray.push(Belt.copy(passObject));
            } else {
                returnArray = returnArray.concat(S.OptionsPermutation(availableOptions.slice(1), Belt.copy(passObject), returnArray));
            }
        } return returnArray;
    };

    S['CreateOrder'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            //vendor
            //order
        });

        Async.waterfall([
            function (cb) {
                Request({
                  'url': a.o.vendor.url + S.api_urls.guest_cart
                , 'method': 'post'
                , 'json': true
                , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    gb.cart_id = data.body;
                    cb(err);
                });
            },
            function (cb) {
                Async.eachSeries(a.o.order.cart_items, function(ci, cb2){
                    ci.quote_id = gb.cart_id;
                    Request({
                            'url': a.o.vendor.url + S.api_urls.guest_cart + gb.cart_id + '/items'
                            , 'method': 'post'
                            , 'json': true
                            , 'body': {
                                // TODO set option if there are multiple items - Error handling
                                'cart_item': ci
                            }
                        , 'oauth': a.o.vendor.oauth
                    }, function (err, data) {
                        cb2(err);
                    });
                }, function(err, data){
                    if (err) {
                        console.log(err);
                        S.emit('error', err);
                    }

                    cb(err);
                });

            },
            function (cb) {
                Request({
                    'url': a.o.vendor.url + S.api_urls.guest_cart + gb.cart_id + '/shipping-information'
                    , 'method': 'post'
                    , 'json': true
                    ,
                    'body': a.o.order.billing_shipping_information
                    , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    // an error will be here because shipping method is not set yet but that's ok
                    // if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': a.o.vendor.url + S.api_urls.guest_cart + gb.cart_id + '/shipping-methods'
                    , 'method': 'get'
                    , 'json': true
                    , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    gb.shipping_methods = data.body;
                    cb(err);
                });
            },
            function (cb) {
                var cheapestShipping = _.min(gb.shipping_methods, function(m){ return m.price_incl_tax; });
                a.o.order.billing_shipping_information.addressInformation.shipping_method_code = cheapestShipping.method_code;
                a.o.order.billing_shipping_information.addressInformation.shipping_carrier_code = cheapestShipping.carrier_code;
                Request({
                    'url': a.o.vendor.url + S.api_urls.guest_cart + gb.cart_id + '/shipping-information'
                    , 'method': 'post'
                    , 'json': true
                    ,
                    'body': a.o.order.billing_shipping_information
                    , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': a.o.vendor.url + S.api_urls.guest_cart + gb.cart_id + '/payment-methods'
                    , 'method': 'get'
                    , 'json': true
                    , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    if (!data || !data.body || !data.body[0]) cb(new Error('No payment method available'));
                    gb.payment_method = data.body[0].code;
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': a.o.vendor.url + S.api_urls.guest_cart + gb.cart_id + '/order'
                    , 'method': 'put'
                    , 'json': true
                    ,
                    'body': {
                        'paymentMethod': {
                            "method": gb.payment_method
                        }
                    }
                    , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    gb.order_id = data.body;
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': a.o.vendor.url + S.api_urls.orders + gb.order_id + '/comments'
                    , 'method': 'post'
                    , 'json': true
                    , 'body': {
                        "statusHistory": {
                            "comment": a.o.order.comment
                        }
                    }
                    , 'oauth': a.o.vendor.oauth
                }, function (err, data) {
                    gb.orderId = data.body;
                    cb(err);
                });
            }
        ], function (err, data) {
            if (err) {
                console.log(err);
                S.emit('error', err);
            }

            a.cb(err, data);
        });
    };

    S['ReadOrder'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            //vendor
            //order
        });


        Request({
            'url': a.o.vendor.url + S.api_urls.orders + a.o.order.id
            , 'method': 'get'
            , 'json': true
            , 'oauth': a.o.vendor.oauth
        }, function (err, data) {
            if (err) {
                console.log(err);
                S.emit('error', err);
            }

            a.cb(err, data);
        });
    };

    S['UpdateProduct'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            //product
            //vendor
            //last_sync
            //synced_at
        });

        var SanitizeHTML = S.instance.SanitizeHTML;

        Async.waterfall([
            function(cb){
                if (!_.any(a.o.product.images)) return cb(new Error('Product does not have images'));

                gb['sku'] = Belt.cast(a.o.product.sku, 'string');

                S.instance.log.warn('Syncing "' + gb.sku + '"');

                self.instance.db.model('product').findOne({
                    'sku': gb.sku
                    , 'vendor': a.o.vendor.get('_id')
                }, Belt.cs(cb, gb, 'doc', 1, 0));
            }
            , function(cb){
                gb.doc = gb.doc || S.instance.db.model('product')({});

                _.each(a.o.product.options, function(o){
                    if (!o.title) return;
                    o.title = o.title.replace(/\./g, '');
                });

                a.o.product.description = _.find(a.o.product.custom_attributes, function(attr){ return attr.attribute_code === 'description'}) || {};
                a.o.product.short_description = _.find(a.o.product.custom_attributes, function(attr){ return attr.attribute_code === 'short_description'}) || {};

                gb.doc.set({
                    'sku': gb.sku
                    , 'name': gb.doc.get('name') || a.o.product.name
                    , 'label': {
                        'us': gb.doc.get('label.us') || Str.stripTags(a.o.product.name)
                    }
                    , 'description': {
                        'us': SanitizeHTML(gb.doc.get('description.us')) || gb.doc.get('description.us') || SanitizeHTML(a.o.product.short_description.value) || SanitizeHTML(a.o.product.description.value) || a.o.product.short_description.value || a.o.product.description.value
                    }
                    , 'vendor': a.o.vendor.get('_id')
                    , 'brands': [
                        a.o.vendor.get('name')
                      ]
                    , 'last_sync': a.o.last_sync
                    , 'synced_at': a.o.synced_at
                    , 'source': {
                        'platform': 'magento'
                      , 'record': Belt.parse(SanitizeHTML(Belt.stringify(a.o.product)))
                    }
                    , 'options': _.object(
                        _.pluck(a.o.product.options, 'title')
                        , _.map(a.o.product.options, function(o){
                            return {
                                'name': o.title.toLowerCase()
                                , 'label': {
                                    'us': o.title.toLowerCase()
                                }
                                , 'values': {
                                    'us': o.values
                                }
                            }
                        })
                    )
                });

                if (a.o.product.status !== 1){
                    gb.doc.set({
                      'sync_hide': true
                    , 'hide_note': 'sync - status not set to publish'
                    });
                } else {
                    gb.doc.set({
                        'sync_hide': false
                    });
                }

                gb.doc.media = _.filter(gb.doc.media, function(m){
                        return _.some(a.o.product.images, function(i){
                            return i.src === m.remote_url;
                        });
                    }) || [];

                _.each(a.o.product.images, function(i){
                    if (_.some(gb.doc.media, function(m){
                            return i.src === m.remote_url;
                        })) return;

                    var baseUrl = a.o.vendor.magento.url;
                    gb.doc.media.push({
                        'remote_url': baseUrl.substring(0,
                            baseUrl.indexOf('/') + 2 + baseUrl.substring(baseUrl.indexOf('/') + 2).indexOf('/')) +
                            '/' + i.src.substring(baseUrl.length)
                        , 'skip_processing': true
                    });
                });

                gb.doc.media = _.sortBy(gb.doc.media, function(m){
                    return _.indexOf(_.pluck(a.o.product.images, 'src'), m.remote_url);
                });

                _.each(gb.doc.media, function(m){
                    m['skip_processing'] = true;
                });

                gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
            }
            , function(cb){
                gb['stocks'] = [];
                gb['has_variations'] = true;

                if (!_.any(a.o.product.variations)){
                    gb['has_variations'] = false;
                    a.o.product.variations = [
                        Belt.copy(a.o.product)
                    ];
                }

                Async.eachSeries(a.o.product.variations, function(v, cb2){
                    var gb2 = {};
                    var allPossibleOptions = [];
                    var optionsPermutationsArray = [];

                    if (gb.has_variations) {
                        _.each(a.o.product.options || [], function (po, k) {
                            allPossibleOptions.push({
                                'title': po.title
                                , 'options': []
                            });
                            _.each(po.values || [], function (pov, k) {

                                var obj = {};
                                obj[po.title] = {
                                    'alias': po.title
                                    , 'value': pov.title
                                    , 'alias_value': pov.title
                                };
                                allPossibleOptions[allPossibleOptions.length - 1].options.push(obj);
                            });
                        });
                    }

                    _.each(v.options || [], function (vo, k) {
                        allPossibleOptions.push({
                            'title': vo.title
                            , 'options': []
                        });
                        _.each(vo.values || [], function (vov, k) {

                            var obj = {};
                            obj[vo.title] = {
                                'alias': vo.title
                                , 'value': vov.title
                                , 'alias_value': vov.title
                            };
                            allPossibleOptions[allPossibleOptions.length - 1].options.push(obj);
                        });
                    });
                    optionsPermutationsArray = S.OptionsPermutation(allPossibleOptions, {});

                    Async.eachSeries(optionsPermutationsArray || [null], function (opts, cb3) {

                        Async.waterfall([
                            function(cb4){
                                self.instance.db.model('stock').findOne({
                                    'sku': Belt.cast(v.id + '-' + _.map(opts, function(opt){ return opt.alias + opt.value }).join('-'), 'string')
                                    , 'product': gb.doc.get('_id')
                                }, Belt.cs(cb4, gb2, 'stock', 1, 0));
                            }
                            , function(cb4){
                                gb2.stock = gb2.stock || S.instance.db.model('stock')({});

                                gb2.stock.set({
                                    'product': gb.doc.get('_id')
                                    , 'vendor': a.o.vendor.get('_id')
                                    , 'sku': Belt.cast(v.id + '-' + _.map(opts, function(opt){ return opt.alias + opt.value }).join('-'), 'string')
                                    , 'source': {
                                        'platform': 'magento'
                                        , 'record': Belt.parse(SanitizeHTML(Belt.stringify(v)))
                                    }
                                    , 'last_sync': a.o.last_sync
                                    , 'synced_at': a.o.synced_at
                                    , 'options': opts
                                    , 'price': Math.ceil(v.price)
                                    , 'list_price': Math.ceil(v.price)
                                    , 'available_quantity': v.extension_attributes.stock_item.is_in_stock &&
                                        v.extension_attributes.stock_item.qty > 0 ? v.extension_attributes.stock_item.qty : 0

                                });

                                gb2.stock.save(Belt.cs(cb4, gb2, 'stock', 1, 0));
                            }
                            , function(cb4){
                                gb.stocks.push(gb2.stock.get('_id'));

                                cb4();
                            }
                        ], Belt.cw(cb3, 0));
                    }, Belt.cw(cb2, 0))
                }, Belt.cw(cb, 0));
            }
            , function(cb){
                gb.doc.set({
                    'stocks': gb.stocks
                });

                gb.doc.populate('stocks', Belt.cs(cb, gb, 'doc', 1, 0));
            }
            , function(cb){
                gb.doc.getConfigurations();

                gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0))
            }
        ], function(err){
            if (err) {
                console.log(err);
                S.emit('error', err);
            }

            a.cb(err, gb.doc);
        });
    };

    S['IterateProducts'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            // vendor
            'progress_cb': Belt.np
        });

        Async.waterfall([
            function(cb){

                gb['page'] = 1;

                Async.forever(function(next){

                    Request({
                        'url': a.o.vendor.url + S.api_urls.get_products + gb.page++
                        , 'oauth': a.o.vendor.oauth
                    }, function (err, data) {

                        var productsJSON = JSON.parse(data.body);
                        productsJSON.items = _.filter(productsJSON.items, function (i) { return i.type_id !== 'virtual'; });
                        gb['products'] = Belt.get(productsJSON, 'items') || [];
                        if (!_.any(gb.products) || gb.lastItemId === _.last(gb.products).id) {
                            cb();
                            return; // stops the forever loop
                        } else {
                            gb.lastItemId = _.last(gb.products).id;
                        }

                         Async.eachSeries(gb.products, function(p, cb2){
                             Async.waterfall([
                                 function (cb) {
                                     Request({
                                         'url': a.o.vendor.url + S.api_urls.products + p.sku
                                         , 'json': true
                                         , 'oauth': a.o.vendor.oauth
                                     }, function (err, data) {
                                         if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                                         p = data.body;
                                         p.images = _.each(_.filter(p.media_gallery_entries, function(media){
                                                 return media.media_type === 'image'
                                             }), function (media) {
                                                media.src = a.o.vendor.url + S.api_urls.media_prefix + media.file.replace('\\', '').substring(1);
                                            });
                                         cb(err)
                                     });
                                 },
                                 function (cb) {
                                     if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                                     Request({
                                         'url': a.o.vendor.url + S.api_urls.configurable_products + p.sku + '/children'
                                         , 'json': true
                                         , 'oauth': a.o.vendor.oauth
                                     }, function (err, data) {
                                         p.children = data.body;
                                         cb(err);
                                     });
                                 },
                                 function (cb) {
                                     if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                                     p.variations = [];
                                     Async.eachSeries(p.children || [], function(v, cb2) {
                                         Request({
                                             'url': a.o.vendor.url + S.api_urls.products + v.sku
                                             , 'json': true
                                             , 'oauth': a.o.vendor.oauth
                                         }, function (err, data) {
                                             if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                                             p.variations.push(data.body);
                                             cb2(err);
                                         });
                                     }, function (err, data) {
                                         a.o.progress_cb(p, cb2);
                                     });
                                 }
                             ]);

                         }, Belt.cw(next, 0));
                    });
                });
            }
        ], function(err){
            if (err) {
                console.log(err);
                S.emit('error', err);
            }

            a.cb(err);
        });
    };

    S['Authorization'] = function (options, callback) {
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            // consumer_key
            // consumer_secret
            // store_url
            // verifier
            'progress_cb': Belt.np
        });

        Async.waterfall([
            function(cb){

                Request({
                    'url': a.o.store_url + S.api_urls.get_request_token
                    , 'oauth': {
                        'consumer_key': a.o.consumer_key
                        , 'consumer_secret': a.o.consumer_secret
                    }
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    data = Querystring.parse(data.body);
                    gb.requestToken = data.oauth_token;
                    gb.requestSecret = data.oauth_token_secret;
                    cb(err);
                });
            },
            function (cb) {

                Request({
                    'url': a.o.store_url + S.api_urls.get_access_token
                    , 'oauth': {
                        'consumer_key': a.o.consumer_key
                        , 'consumer_secret': a.o.consumer_secret
                        , 'token': gb.requestToken
                        , 'token_secret': gb.requestSecret
                        , 'verifier': a.o.verifier
                    }
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(new Error(data.body.message));
                    data = Querystring.parse(data.body);
                    gb.accessToken = data.oauth_token;
                    gb.accessSecret = data.oauth_token_secret;
                    cb(err);
                });
            }
        ], function(err, data){
            if (err) {
                console.log(err);
                S.emit('error', err);
            }

            a.o.progress_cb(err, gb);
        });
    };

    S.instance.express.post('/magento/authorize', function(req, res){
        var gb = {
            'data': req.data()
        };

        var missing = _.find([
            'oauth_consumer_key'
            , 'oauth_consumer_secret'
            , 'store_base_url'
            , 'oauth_verifier'
        ], function(v){
            return !gb.data[v];
        });

        if (missing) return new Error(missing + ' is required');

        S.Authorization({
            'consumer_key': gb.data.oauth_consumer_key
            , 'consumer_secret': gb.data.oauth_consumer_secret
            , 'store_url': gb.data.store_base_url
            , 'verifier': gb.data.oauth_verifier
            , 'progress_cb': function (err, data) {
                if (err){
                    console.log(err);
                    S.emit('error', err);
                }
                Async.waterfall([
                    function (cb) {
                        var missing = _.find([
                            'accessToken'
                            , 'accessSecret'
                        ], function (v) {
                            return !data[v];
                        });

                        if (missing) return cb(new Error(missing + ' is required'));


                        S.instance.db.model('vendor').update(
                            {
                                'name': gb.data.oauth_consumer_key
                            }
                            , {
                                '$set': {
                                    'name': gb.data.oauth_consumer_key
                                    , 'locked': true
                                    , 'magento.url': gb.data.store_base_url
                                    , 'magento.consumer_key': gb.data.oauth_consumer_key
                                    , 'magento.consumer_secret': gb.data.oauth_consumer_secret
                                    , 'magento.verifier': gb.data.oauth_verifier
                                    , 'magento.access_token': data.accessToken
                                    , 'magento.access_secret': data.accessSecret
                                }
                            }
                            , {
                                'upsert': true
                            }
                            , Belt.cw(cb)
                        );
                    }
                ], function (err) {
                    if (err) {
                        console.log(err);
                        S.emit('error', err);
                    }

                    res.status(200).json({
                        'error': Belt.get(err, 'error')
                    });
                });
            }
        }, Belt.np);


    });

    S.instance.express.all('/magento/connect', function(req, res){
        var gb = {
            'data': req.data()
        };

        var missing = _.find([
            'oauth_consumer_key'
            , 'success_call_back'
        ], function(v){
            return !gb.data[v];
        });

        if (missing) return new Error(missing + ' is required');

        res.status(200).type('text/html').end(S.instance.renderView(req, 'magento_store_name', {
            consumer_key: gb.data.oauth_consumer_key,
            success_call_back: gb.data.success_call_back
        }));

    });

    S.instance.express.all('/magento', function(req, res){
        var a = {
            'o': _.extend({}, {
                'data': req.data()
                , 'session': req.session
            })
        }, self = S
            , gb = {};
        a.o = _.defaults(a.o, {

        });

        Async.waterfall([
            function(cb){
                cb();
            }
        ], function(err, data){
            if (err){
                return res.status(400).end(err.message);
            }

            try {
                res.status(200).type('text/html').end(S.instance.renderView(req, 'magento', {

                }));
            } catch(e){
                res.redirect('/');
            }
        });
    });

    S.instance.express.all('/magento/store-name', function(req, res){
        var gb = {
            'data': req.data()
        };

        Async.waterfall([
            function(cb){
                S.instance.db.model('vendor').find({
                    'name': gb.data.store_name
                }, Belt.cs(cb, gb, 'store_in_db', 1, 0));
            }
            , function(cb){
                if (gb.store_in_db.length > 0) cb(new Error('Store with this name already exists'));
                S.instance.db.model('vendor').update({
                    'name': gb.data.consumer_key
                }, {
                    'name': gb.data.store_name
                    , 'locked': false
                }, Belt.cw(cb));
            }
        ], function(err, data){
            if (err){
                return res.status(400).end(err.message);
            }

            res.redirect(gb.data.success_call_back);
        });
    });

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
