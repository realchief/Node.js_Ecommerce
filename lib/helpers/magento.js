#!/usr/bin/env node

var Async = require('async')
  , _ = require('underscore')
  , Belt = require('jsbelt')
  , Request = require('request')
  , Querystring = require('querystring')
  , Str = require('underscore.string')
  , Natural = require('natural')
  , Soap = require('soap')
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
        , 'product_attributes': 'rest/V1/products/attributes/'
        , 'soap_api': '/api/v2_soap?wsdl=1'

    };

    S['FormatDate'] = function(date) {
        var d = date.getDate();
        var m = date.getMonth() + 1;
        var y = date.getFullYear();

        if(d < 10) {
            d = '0' + d
        }

        if(m < 10) {
            m = '0' + m
        }

        return y + '-' + m + '-' + d + ' 00:00:00';
    }

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

    S['Error'] = function (data) {
        return new Error(!data || !data.body ? 'Error connecting to Magento store' : data.body.message ? data.body.message : 'Unknown error');
    };

    S['LoginV1'] = function(vendor_url, cb) {
        Soap.createClient(vendor_url + S.api_urls.soap_api, function(err, client) {
            if (!client) {
                vendor_url = vendor_url.indexOf('/index.php') != -1 ?
                    vendor_url.substring(0, vendor_url.indexOf('/index.php')) :
                    vendor_url + '/index.php';
                Soap.createClient(vendor_url + S.api_urls.soap_api, function(err, client) {
                    cb(err, client);
                });
            } else {
                cb(err, client);
            }
        });
    }

    S['CreateOrderV1'] = function(options, callback) {
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            //vendor
            //order
        });

        return;
        S.LoginV1(a.o.vendor.magento.url, function(err, client) {
            if (!client) return a.cb(new Error('Cannot connect to Magento 1 store'));
            client.login({'user': a.o.vendor.magento.username, 'key': a.o.vendor.magento.api_key}, function(err, result) {
                if (err || !result.loginReturn) return a.cb(new Error('Cannot login to Magento 1'));

                gb.session = result.loginReturn.$value;

                Async.waterfall([
                    function(cb){
                        client.shoppingCartCreate({
                            'sessionId': gb.session
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                            gb.cart_id = data.quoteId.$value;
                            cb(err);
                        });
                    }
                    , function(cb) {
                        Async.eachSeries(a.o.order.cart_items, function(ci, cb2){
                            ci.quote_id = gb.cart_id;
                            client.shoppingCartProductAdd({
                                'sessionId': gb.session
                                , 'quoteId': gb.cart_id
                                , 'products': [{
                                    'product_id': ci.product_id
                                    , 'sku': ci.sku
                                    , 'qty': ci.qty
                                    // TODO not working correctly
                                    , 'options': _.reduce(ci.product_option.extension_attributes.custom_options, function (m, o) {
                                        return m.concat([{
                                            'key': 'option_id'
                                            , 'value': o.option_id
                                        }
                                        , {
                                            'key': 'value_id'
                                            , 'value': o.option_value
                                        }]);
                                    }, [])
                                }]
                            }, function(err, data) {
                                if (err || !data || data.body) return cb2(new Error(err || data.body || 'No data returned from catalogProductList'));
                                if (data.result.$value != true) return cb2(new Error('Cannot add product to cart'));
                                cb2(err);
                            });
                        }, function(err, data){
                            cb(err);
                        });
                    }
                    , function (cb) {
                        var billingInfo = a.o.order.billing_shipping_information.addressInformation.billingAddress;
                        var shippingInfo = a.o.order.billing_shipping_information.addressInformation.shippingAddress;
                        client.shoppingCartCustomerAddresses({
                                'quoteId': gb.cart_id
                                , 'sessionId': gb.session
                                , 'customer': [
                                    _.extend(billingInfo, {
                                        'mode': 'billing'
                                        , 'region': billingInfo.region_code
                                        , 'region_id': billingInfo.region_code
                                    })
                                    , _.extend(shippingInfo, {
                                        'mode': 'shipping'
                                        , 'region': shippingInfo.region_code
                                        , 'region_id': shippingInfo.region_code
                                    })
                                ]
                            }, function(err, data) {
                                if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                                if (data.result.$value != true) return cb(new Error('Cannot add customer addresses to cart'));
                                cb(err);
                            });
                    }
                    , function(cb){
                        client.shoppingCartShippingList({
                            'quoteId': gb.cart_id
                            , 'sessionId': gb.session
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from shoppingCartShippingList'));
                            gb.shipping_method = _.min(Array.isArray(data.result.item) ? data.result.item : [data.result.item],
                                function(m){ return Belt.cast(m.price.$value, 'number'); });
                            cb(err);
                        });
                    }
                    , function(cb){
                        client.shoppingCartShippingMethod({
                            'quoteId': gb.cart_id
                            , 'sessionId': gb.session
                            , 'method': gb.shipping_method.code.$value
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                            if (data.result.$value != true) return cb(new Error('Cannot set shipping method to cart'));
                            cb(err);
                        });
                    }
                    , function(cb){
                        client.shoppingCartPaymentList({
                            'quoteId': gb.cart_id
                            , 'sessionId': gb.session
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                            gb.payment_method = Array.isArray(data.result.item) ? data.result.item[0].code.$value : data.result.item.code.$value;
                            cb(err);
                        });
                    }
                    , function(cb){
                        client.shoppingCartPaymentMethod({
                            'quoteId': gb.cart_id
                            , 'sessionId': gb.session
                            , 'method': {
                                'method': gb.payment_method
                            }
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                            if (data.result.$value != true) return cb(new Error('Cannot set payment method to cart'));
                            cb(err);
                        });
                    }
                    , function(cb){
                        client.shoppingCartOrder({
                            'quoteId': gb.cart_id
                            , 'sessionId': gb.session
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                            gb.order_number = data.result.$value;
                            cb(err);
                        });
                    }
                    , function(cb){
                        client.salesOrderAddComment({
                            'quoteId': gb.cart_id
                            , 'sessionId': gb.session
                            , 'orderIncrementId': gb.order_number
                            , 'comment': a.o.order.comment
                        }, function(err, data) {
                            if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                            if (data.result.$value != true) return cb(new Error('Cannot add comment to the order'));
                            cb(err);
                        });
                    }
                    , function(cb){
                        Async.eachSeries(a.o.order.cart_items, function(ci, cb2){
                            client.salesOrderAddComment({
                                'quoteId': gb.cart_id
                                , 'sessionId': gb.session
                                , 'orderIncrementId': gb.order_number
                                , 'comment': 'SELECTED OPTIONS: ' + _.reduce(ci.product_option.extension_attributes.custom_options, function (m, o) {
                                    return m += o.option_title + ' : ' + o.option_value_title + ' | ';
                                }, '')
                            }, function(err, data) {
                                if (!data || data.body) return cb(new Error(data.body || 'No data returned from catalogProductList'));
                                if (data.result.$value != true) return cb(new Error('Cannot add options comment to the order'));
                                cb2(err);
                            });
                        }, function(err, data){
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
            });
        });
    }

    S['CreateOrder'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            // vendor
            // order
        });

        if (a.o.vendor.magento.version == 1) return S.CreateOrderV1(options, callback);
        gb.vendor_url = a.o.vendor.magento.url;
        gb.oauth = {
            "token_secret" : a.o.vendor.magento.access_secret
            , "token" : a.o.vendor.magento.access_token
            , "consumer_key" : a.o.vendor.magento.consumer_key
            , "consumer_secret" : a.o.vendor.magento.consumer_secret
            , "verifier" : a.o.vendor.magento.verifier
        };
        Async.waterfall([
            function (cb) {
                Request({
                  'url': gb.vendor_url + S.api_urls.guest_cart
                , 'method': 'post'
                , 'json': true
                , 'oauth': gb.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
                    gb.cart_id = data.body;
                    cb(err);
                });
            },
            function (cb) {
                Async.eachSeries(a.o.order.cart_items, function(ci, cb2){
                    ci.quote_id = gb.cart_id;
                    Request({
                            'url': gb.vendor_url + S.api_urls.guest_cart + gb.cart_id + '/items'
                            , 'method': 'post'
                            , 'json': true
                            , 'body': {
                                'cart_item': ci
                            }
                        , 'oauth': gb.oauth
                    }, function (err, data) {
                        if (!data || !data.body || data.body.message) return cb2(S.Error(data));
                        cb2(err);
                    });
                }, function(err, data){
                    cb(err);
                });

            },
            function (cb) {
                Request({
                    'url': gb.vendor_url + S.api_urls.guest_cart + gb.cart_id + '/shipping-information'
                    , 'method': 'post'
                    , 'json': true
                    ,
                    'body': a.o.order.billing_shipping_information
                    , 'oauth': gb.oauth
                }, function (err, data) {
                    // an error will be here because shipping method is not set yet but that's ok
                    // if (!data || !data.body || data.body.message) return cb(S.Error(data));
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': gb.vendor_url + S.api_urls.guest_cart + gb.cart_id + '/shipping-methods'
                    , 'method': 'get'
                    , 'json': true
                    , 'oauth': gb.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
                    gb.shipping_methods = data.body;
                    cb(err);
                });
            },
            function (cb) {
                var cheapestShipping = _.min(gb.shipping_methods, function(m){ return m.price_incl_tax; });
                a.o.order.billing_shipping_information.addressInformation.shipping_method_code = cheapestShipping.method_code;
                a.o.order.billing_shipping_information.addressInformation.shipping_carrier_code = cheapestShipping.carrier_code;
                Request({
                    'url': gb.vendor_url + S.api_urls.guest_cart + gb.cart_id + '/shipping-information'
                    , 'method': 'post'
                    , 'json': true
                    ,
                    'body': a.o.order.billing_shipping_information
                    , 'oauth': gb.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': gb.vendor_url + S.api_urls.guest_cart + gb.cart_id + '/payment-methods'
                    , 'method': 'get'
                    , 'json': true
                    , 'oauth': gb.oauth
                }, function (err, data) {
                    if (!data || !data.body || !data.body[0]) cb(new Error('No payment method available'));
                    gb.payment_method = data.body[0].code;
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': gb.vendor_url + S.api_urls.guest_cart + gb.cart_id + '/order'
                    , 'method': 'put'
                    , 'json': true
                    ,
                    'body': {
                        'paymentMethod': {
                            "method": gb.payment_method
                        }
                    }
                    , 'oauth': gb.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
                    gb.order_id = data.body;
                    cb(err);
                });
            },
            function (cb) {
                Request({
                    'url': gb.vendor_url + S.api_urls.orders + gb.order_id + '/comments'
                    , 'method': 'post'
                    , 'json': true
                    , 'body': {
                        "statusHistory": {
                            "comment": a.o.order.comment
                        }
                    }
                    , 'oauth': gb.oauth
                }, function (err, data) {
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
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

    // TODO create for Magento 1
    S['ReadOrder'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            //vendor
            //order
        });

        gb.vendor_url = a.o.vendor.magento.url;
        gb.oauth = {
            "token_secret" : a.o.vendor.magento.access_secret
            , "token" : a.o.vendor.magento.access_token
            , "consumer_key" : a.o.vendor.magento.consumer_key
            , "consumer_secret" : a.o.vendor.magento.consumer_secret
            , "verifier" : a.o.vendor.magento.verifier
        };
        Request({
            'url': gb.vendor_url + S.api_urls.orders + a.o.order.id
            , 'method': 'get'
            , 'json': true
            , 'oauth': gb.oauth
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
                if (a.o.vendor.magento.version != 1 && !_.any(a.o.product.images)) return cb(new Error('Product does not have images'));

                gb['sku'] = Belt.cast(a.o.product.sku, 'string');

                S.instance.log.warn('Syncing "' + gb.sku + '"');

                self.instance.db.model('product').findOne({
                    'sku': gb.sku
                    , 'vendor': a.o.vendor.get('_id')
                }, Belt.cs(cb, gb, 'doc', 1, 0));
            }
            , function(cb){
                var is_new_product = false;
                if (!gb.doc) {
                    is_new_product = true;
                    gb.doc = S.instance.db.model('product')({});
                }
                //if (a.o.vendor.magento.version == 1 && (gb.doc.get('name')))

                _.each(a.o.product.options, function(o){
                    if (!o.title) return;
                    o.title = o.title.replace(/\./g, '');
                });

                a.o.product.description = a.o.product.description ? a.o.product.description : _.find(a.o.product.custom_attributes, function(attr){ return attr.attribute_code === 'description'}) || {};
                a.o.product.short_description = a.o.product.short_description ? a.o.product.short_description : _.find(a.o.product.custom_attributes, function(attr){ return attr.attribute_code === 'short_description'}) || {};

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
                    , 'hide': is_new_product &&
                        a.o.vendor.magento.version == 1 &&
                        (!_.any(a.o.product.images) || a.o.product.type_id == 'configurable') ? true : gb.doc.get('hide') || false
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

                if (is_new_product && a.o.vendor.magento.version == 1) {
                    gb.doc.set({
                        'parent_id': '-'
                    });
                }

                if (Belt.cast(a.o.product.status, 'number') !== 1){
                    gb.doc.set({
                      'sync_hide': true
                    , 'hide_note': 'sync - status not set to publish'
                    });
                } else {
                    gb.doc.set({
                        'sync_hide': false
                    });
                }

                if (a.o.product.images && a.o.product.images.length > 0) {
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
                            'remote_url': a.o.vendor.magento.version == 1 ? i.src : baseUrl.substring(0,
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
                }

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
                            if (!po.option_id) return;
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
                                    , 'price': pov.price
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
                                , 'price': vov.price
                            };
                            allPossibleOptions[allPossibleOptions.length - 1].options.push(obj);
                        });
                    });
                    optionsPermutationsArray = S.OptionsPermutation(allPossibleOptions, {});

                    Async.eachSeries(optionsPermutationsArray || [{}], function (opts, cb3) {

                        var price = v.price;
                        _.each(_.keys(opts), function(k) {
                            price += opts[k].price;
                            opts[k] = _.omit(opts[k], 'price');
                        });

                        _.each(v.variation_config_options, function(vco) {
                            opts[vco.title] = {
                                'alias': vco.title
                                , 'value': vco.value
                                , 'alias_value': vco.value
                            };
                        });
                        Async.waterfall([
                            function(cb4){
                                self.instance.db.model('stock').findOne({
                                    'sku': Belt.cast(v.id + (_.keys(opts).length ? '-' + _.map(opts, function(opt){ return opt.alias + opt.value }).join('-') : ''), 'string')
                                    , 'product': gb.doc.get('_id')
                                }, Belt.cs(cb4, gb2, 'stock', 1, 0));
                            }
                            , function(cb4){
                                gb2.stock = gb2.stock || S.instance.db.model('stock')({});

                                gb2.stock.set({
                                    'product': gb.doc.get('_id')
                                    , 'vendor': a.o.vendor.get('_id')
                                    , 'sku': Belt.cast(v.sku + (_.keys(opts).length ? '-' + _.map(opts, function(opt){ return opt.alias + opt.value }).join('-') : ''), 'string')
                                    , 'source': {
                                        'platform': 'magento'
                                        , 'record': Belt.parse(SanitizeHTML(Belt.stringify(v)))
                                    }
                                    , 'last_sync': a.o.last_sync
                                    , 'synced_at': a.o.synced_at
                                    , 'options': opts
                                    , 'price': Math.ceil(price)
                                    , 'list_price': Math.ceil(price)
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

    S['IterateProductsV1'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            // vendor
            'progress_cb': Belt.np
        });
        var WSDL = false;
        var today = new Date();
        gb['page'] = 0;

        S.LoginV1(a.o.vendor.magento.url, function(err, client) {
            client.login({'username': a.o.vendor.magento.username, 'apiKey': a.o.vendor.magento.api_key}, function(err, result) {
                if (client.wsdl._includesWsdl.length > 0) WSDL = true;
                //if (WSDL) return;
                if (err || (!result.loginReturn && !result.result)) return a.o.progress_cb(new Error('Cannot login to Magento 1'));
                gb.session = WSDL ? result.loginReturn.$value : result.result;
                gb.virtual_products = [];

                Async.waterfall([
                    function(cb) {

                        client.catalogProductCurrentStore({
                            'sessionId': gb.session
                        }, function (err, data) {
                            if (!data || data.body) return cb3(new Error(data ? data.body : 'No data returned from catalogProductInfo'));
                            gb['store_id'] = data.storeView.$value;
                            cb(err)
                        });
                    }
                    , function(cb){

                        Async.forever(function(next){
                            if (gb.page >= 52) return cb(); // stops the forever loop

                            gb.page++;

                            client.catalogProductList({
                                'sessionId': gb.session
                                , 'storeView': gb.store_id
                                , 'filters': {
                                    'complex_filter': {
                                        'complexObjectArray': [
                                            {
                                                'key' : 'CREATED_AT'
                                                , 'value': {
                                                    'key': 'lt'
                                                    , 'value': S.FormatDate(new Date(today - 7 * (gb.page - 1) * 24 * 60 * 60 * 1000))
                                                }
                                            }
                                            , {
                                                'key' : 'created_at'
                                                , 'value': {
                                                    'key': 'gt'
                                                    , 'value': S.FormatDate(new Date(today - 7 * gb.page * 24 * 60 * 60 * 1000))
                                                }
                                            }
                                        ]
                                    }
                                }
                            }, function(err, data) {
                                if (!data || data.body) return cb(new Error(data ? data.body : 'No data returned from catalogProductList'));
                                if (WSDL && !Array.isArray(data.storeView.item)) data.storeView.item = data.storeView.item ? [data.storeView.item] : [];

                                gb['products'] = WSDL ? _.filter(data.storeView.item, function (i) { return i.type.$value != 'virtual'; }) :
                                    _.filter(data.result.complexObjectArray, function(i) { return i.type != 'virtual' });


                                 Async.eachSeries(gb.products, function(p, cb2){
                                     Async.waterfall([
                                        function (cb3) {
                                            client.catalogProductInfo({
                                                'sessionId': gb.session
                                                , 'productId': WSDL ? p.product_id.$value : p.product_id
                                            }, function (err, data) {
                                                if (!data || data.body) return cb3(new Error(data ? data.body : 'No data returned from catalogProductInfo'));
                                                p = WSDL ? data.info : data.result;
                                                cb3(err)
                                            });
                                        }
                                        , function (cb3) {
                                            if (WSDL) return cb3();
                                            client.catalogProductCurrentStore({
                                                'sessionId': gb.session
                                            }, function (err, data) {
                                                if (!data || data.body) return cb3(new Error(data ? data.body : 'No data returned from catalogProductInfo'));
                                                p['store_id'] = data.result;
                                                cb3(err)
                                            });
                                        }
                                        , function (cb3) {
                                            var query = { 'sessionId': gb.session };
                                            if (WSDL) query['products'] = [p.product_id.$value];
                                            else query['productIds'] = {"complexObjectArray": [p.product_id] };
                                            client.catalogInventoryStockItemList(
                                                query
                                                , function (err, data) {
                                                    if (err || !data || data.body) return cb3(new Error(err || data ? data.body : 'No data returned from catalogInventoryStockItemList'));
                                                    if (WSDL) {
                                                        p['stocks'] = [];
                                                        _.each(!data.result ? [] : Array.isArray(data.result.item) ? data.result.item : [data.result.item], function(s) {
                                                            p.stocks.push(_.mapObject(s, function (v, k){ return v.$value ? v.$value : v; }));
                                                        })
                                                    } else {
                                                        p['stocks'] = data.result.complexObjectArray;
                                                    }
                                                    p.extension_attributes = {
                                                        'stock_item': {
                                                            'is_in_stock': _.any(_.filter(p.stocks, function(s) { return s.is_in_stock; }))
                                                            , 'qty': _.reduce(p.stocks, function(m, v) { return m + Belt.cast(v.qty, 'number'); }, 0)
                                                        }
                                                    };
                                                    cb3(err)
                                            });
                                        }
                                        , function (cb3) {
                                            p.options = [];
                                            var query = {
                                                'sessionId': gb.session
                                                , 'productId': WSDL ? p.product_id.$value : p.product_id
                                            };
                                            if (!WSDL) query['store'] = p.store_id;
                                            client.catalogProductCustomOptionList(
                                                query
                                                , function (err, data) {
                                                    if (!data || data.body) return cb3(new Error(data ? data.body : 'No data returned from catalogProductInfo'));
                                                    if (WSDL) {
                                                        if (!data.result.item) return cb3();
                                                        else if (!Array.isArray(data.result.item)) data.result.item = [data.result.item];
                                                    } else if (data.result == null) {
                                                        return cb3();
                                                    }

                                                    Async.eachSeries(WSDL ? data.result.item : data.result.complexObjectArray, function(o, cb4){
                                                        client.catalogProductCustomOptionInfo({
                                                            'sessionId': gb.session
                                                            , 'optionId': WSDL ? o.option_id.$value : o.option_id
                                                        }, function (err, data) {
                                                            if (!data || data.body) return cb4(new Error(data ? data.body : 'No data returned from catalogProductCustomOptionInfo'));
                                                            data.result['option_id'] = WSDL ? o.option_id.$value : o.option_id;
                                                            p.options.push(data.result);
                                                            cb4();
                                                        });
                                                    }, Belt.cw(cb3));
                                            });
                                        }
                                        , function (cb3) {
                                            var query = { 'sessionId': gb.session };
                                            if (WSDL) query['product'] = p.product_id.$value;
                                            else query['productId'] = p.product_id;
                                            client.catalogProductAttributeMediaList(
                                                query
                                                , function (err, data) {
                                                    if (!data || data.body) return cb3(new Error(data ? data.body : 'No data returned from catalogProductInfo'));

                                                    if (!data.result || (WSDL && !data.result.item)) return cb3();
                                                    else if (WSDL && !Array.isArray(data.result.item)) data.result.item = [data.result.item];
                                                    p.images = _.map(WSDL ? data.result.item : data.result.complexObjectArray, function(m) {
                                                        return {
                                                            'src': WSDL ? m.url.$value : m.url
                                                            , 'label': WSDL ? m.label.$value : m.label
                                                            , 'file': WSDL ? m.file.$value : m.file
                                                            , 'position': WSDL ? m.position.$value : m.position
                                                            , 'types': WSDL ? _.map(Array.isArray(m.types.item) ? m.types.item : [m.types.item], function(t) {
                                                                return t ? t.$value : null;
                                                            }) : m.types ? m.types.complexObjectArray : null
                                                        };
                                                    });
                                                    cb3(err)
                                            });
                                        }
                                        , function(cb3) {
                                            if (WSDL) {
                                                p = _.mapObject(p, function(v, k) {
                                                    if (k == 'options') return _.map(v, function(v2, i2) {
                                                        _.each(v2, function(v3, k3) {
                                                            if (k3 == 'additional_fields') {
                                                                v2.values = _.map(Array.isArray(v3.item) ? v3.item : [v3.item], function(v4) {
                                                                    return _.mapObject(v4, function(v5, k5) {
                                                                        return v5.$value ? k5 == 'price' ? Belt.cast(v5.$value, 'number') : v5.$value : v5;
                                                                    });
                                                                });
                                                                delete v2.additional_fields;
                                                            } else if (v3.$value) {
                                                                v2[k3] = v3.$value;
                                                            }
                                                        });
                                                        return v2;
                                                    });
                                                    else if (k == 'price') v.$value = Belt.cast(v.$value, 'number');
                                                    return v.$value ? v.$value : v;
                                                });
                                                p = JSON.parse(JSON.stringify(p).replace(/\$value/g, 'value'));
                                            }
                                            cb3();
                                        }
                                     ], function() {
                                         a.o.progress_cb(p, cb2);
                                     });

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
            })
        })
    };

    S['IterateProducts'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            // vendor
            'progress_cb': Belt.np
        });

        if (a.o.vendor.magento.version == 1) return S.IterateProductsV1(options, callback);

        gb.vendor_url = a.o.vendor.magento.url;
        gb.oauth = {
            "token_secret" : a.o.vendor.magento.access_secret
            , "token" : a.o.vendor.magento.access_token
            , "consumer_key" : a.o.vendor.magento.consumer_key
            , "consumer_secret" : a.o.vendor.magento.consumer_secret
            , "verifier" : a.o.vendor.magento.verifier
        };
        Async.waterfall([
            function(cb){

                gb['page'] = 1;

                Async.forever(function(next){

                    Request({
                        'url': gb.vendor_url + S.api_urls.get_products + gb.page++
                        , 'oauth': gb.oauth
                    }, function (err, data) {
                        if (!data || !data.body || data.body.message) return next(S.Error(data));

                        gb['products'] = Belt.get(JSON.parse(data.body), 'items') || [];
                        if (!_.any(gb.products) || gb.lastItemId === _.last(gb.products).id) {
                            cb();
                            return; // stops the forever loop
                        } else {
                            gb.lastItemId = _.last(gb.products).id;
                        }

                        gb.products = _.filter(gb.products, function (i) { return i.type_id !== 'virtual' && i.visibility !== 1; });

                         Async.eachSeries(gb.products, function(p, cb2){
                             Async.waterfall([
                                 function (cb) {
                                     Request({
                                         'url': gb.vendor_url + S.api_urls.products + p.sku
                                         , 'json': true
                                         , 'oauth': gb.oauth
                                     }, function (err, data) {
                                         if (!data || !data.body || data.body.message) return cb(new Error(data));
                                         p = data.body;
                                         p.images = _.each(_.filter(p.media_gallery_entries, function(media){
                                                 return media.media_type === 'image'
                                             }), function (media) {
                                                media.src = a.o.vendor.magento.url + S.api_urls.media_prefix + media.file.replace('\\', '').substring(1);
                                            });
                                         // TODO Temp add error
                                         if (!_.any(p.images)) return cb2();
                                         cb(err)
                                     });
                                 },
                                 function (cb) {
                                     if (p.extension_attributes.configurable_product_options) {
                                         Async.eachSeries(p.extension_attributes.configurable_product_options || [], function (po, cb2) {
                                             Request({
                                                 'url': gb.vendor_url + S.api_urls.product_attributes + po.attribute_id
                                                 , 'json': true
                                                 , 'oauth': gb.oauth
                                             }, function (err, data) {
                                                 if (data && data.body) {
                                                     _.each(po.values, function(option) {
                                                         option.title = _.find(data.body.options, function(v) { return option.value_index == v.value }).label;
                                                            // TODO TEMP
                                                         option.title = option.title.toLowerCase().indexOf('size') ? 'size' : option.title
                                                     });
                                                     // TODO TEMP
                                                     po.title = po.label.toLowerCase().indexOf('size') != -1 ? 'Size' : po.label;
                                                     p.options.push(Belt.copy(po));
                                                 }
                                                 cb2(err);
                                             });
                                         }, Belt.cw(cb));
                                     } else {
                                         cb();
                                     }
                                 },
                                 function (cb) {
                                     if (p.extension_attributes.configurable_product_options) {
                                         Request({
                                             'url': gb.vendor_url + S.api_urls.configurable_products + p.sku + '/children'
                                             , 'json': true
                                             , 'oauth': gb.oauth
                                         }, function (err, data) {
                                             if (!data || !data.body || data.body.message) return cb(S.Error(data));
                                             p.children = data.body;
                                             cb(err);
                                         });
                                     } else {
                                         cb();
                                     }
                                 },
                                 function (cb) {
                                     p.variations = [];
                                     Async.eachSeries(p.children || [], function(v, cb3) {
                                         Request({
                                             'url': gb.vendor_url + S.api_urls.products + v.sku
                                             , 'json': true
                                             , 'oauth': gb.oauth
                                         }, function (err, data) {
                                             if (!data || !data.body || data.body.message) return cb3(new Error(data));
                                             var currentChildConfiguration = [];
                                             _.each(p.options, function (o) {
                                                 _.each(data.body.custom_attributes, function (ca) {
                                                      if (ca.attribute_code.match(/[a-zA-Z]+/g).join('') == o.title.toLowerCase().match(/[a-zA-Z]+/g).join('')) {
                                                         currentChildConfiguration.push({
                                                            // TODO TEMP
                                                             title: o.label.toLowerCase().indexOf('size') != -1 ? 'Size' : o.label
                                                             , value: _.filter(o.values, function(v) {
                                                                 return v.value_index == Belt.cast(ca.value, 'number');
                                                             })[0].title
                                                         });
                                                     }
                                                 });
                                             });
                                             data.body.variation_config_options = currentChildConfiguration;
                                             p.variations.push(data.body);
                                             cb3(err);
                                         });
                                     }, function (err, data) {
                                         a.o.progress_cb(p, cb2);
                                     });
                                 }
                             ], Belt.cw(cb2));

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
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
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
                    if (!data || !data.body || data.body.message) return cb(S.Error(data));
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

    S.instance.express.post('/magento/:version/authorize', function(req, res){
        var a = {
            'o': _.extend({}, {
                'data': req.data()
                , 'magento_version': req.params.version
            })
        }
        , self = S
        , gb = {};

        if (a.o.magento_version == 'v1') {
            var missing = _.find([
                'name'
                , 'url'
                , 'username'
                , 'api_key'
            ], function(v){
                return !a.o.data[v];
            });

            if (missing) return new Error(missing + ' is required');

            a.o.data.url = a.o.data.url.trim('/');
            while (a.o.data.url.charAt(a.o.data.url.length - 1) == '/') {
                a.o.data.url = a.o.data.url.substring(0, a.o.data.url.length - 1);
            }

            return Async.waterfall([
                function(cb) {
                    S.instance.db.model('vendor').update(
                        {
                            'name': a.o.data.name
                        }
                        , {
                            '$set': {
                                'name': a.o.data.name
                                , 'locked': false
                                , 'magento.url': a.o.data.url
                                , 'magento.username': a.o.data.username
                                , 'magento.api_key': a.o.data.api_key
                                , 'magento.version': 1
                            }
                        }
                        , {
                            'upsert': true
                        }
                        , Belt.cw(cb)
                    );
                }
            ], function(err, data){
                if (err) return res.status(400).end(err.message);

                res.redirect('/magento/v1?success=true');
            });

        } else if (a.o.magento_version == 'v2') {
            var missing = _.find([
                'oauth_consumer_key'
                , 'oauth_consumer_secret'
                , 'store_base_url'
                , 'oauth_verifier'
            ], function(v){
                return !a.o.data[v];
            });

            if (missing) return new Error(missing + ' is required');

            S.Authorization({
                'consumer_key': a.o.data.oauth_consumer_key
                , 'consumer_secret': a.o.data.oauth_consumer_secret
                , 'store_url': a.o.data.store_base_url
                , 'verifier': a.o.data.oauth_verifier
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
                                    'name': a.o.data.oauth_consumer_key
                                }
                                , {
                                    '$set': {
                                        'name': a.o.data.oauth_consumer_key
                                        , 'locked': true
                                        , 'magento.url': a.o.data.store_base_url
                                        , 'magento.consumer_key': a.o.data.oauth_consumer_key
                                        , 'magento.consumer_secret': a.o.data.oauth_consumer_secret
                                        , 'magento.verifier': a.o.data.oauth_verifier
                                        , 'magento.access_token': data.accessToken
                                        , 'magento.access_secret': data.accessSecret
                                        , 'magento.version': 2
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

        }


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

    S.instance.express.all('/magento/:version', function(req, res){
        var a = {
            'o': _.extend({}, {
                'data': req.data()
                , 'session': req.session
                , 'magento_version': req.params.version
            })
        }
        , self = S
        , gb = {};

        Async.waterfall([
            function(cb){
                cb();
            }
        ], function(err, data){
            if (err){
                return res.status(400).end(err.message);
            }

            try {
                res.status(200).type('text/html').end(S.instance.renderView(req, 'magento' + Belt.capitalize(a.o.magento_version), {

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

    S.instance.express.all('/magento/v1/success-callback', function(req, res){
        var a = {
            'o': _.extend({}, {
                'data': req.data()
                , 'session': req.session
                , 'magento_version': req.params.version
            })
        }
        , self = S
        , gb = {};

        Async.waterfall([
            function(cb){
                if (!a.o.data) cb(new Error('No data got back from Magento - get verifier'));

                S.instance.db.model('vendor').findOne({
                    'magento.access_token': a.o.data.oauth_token
                }, Belt.cs(cb, gb, 'vendor', 1, 0));
            }
            , function(cb){
                if (!gb.vendor) cb(new Error('No vendor found with this token'));

                Request({
                    'url': gb.vendor.magento.url + '/oauth/token'
                    , 'method': 'post'
                    , 'oauth': {
                        'consumer_key': gb.vendor.magento.consumer_key
                        , 'consumer_secret': gb.vendor.magento.consumer_secret
                        , 'token': gb.vendor.magento.access_token
                        , 'token_secret': gb.vendor.magento.access_secret
                        , 'verifier': a.o.data.oauth_verifier
                        , 'callback': S.settings.host
                    }
                }, Belt.cs(cb, gb, 'doc', 1, 0));
            }
            , function(cb){
                if (!gb.doc) cb(new Error('No data got back from Magento - get access tokens'));

                var access_tokens = Querystring.parse(gb.doc.body);
                gb.vendor.set({
                    'locked': false
                    , 'magento.verifier': a.o.data.oauth_verifier
                    , 'magento.access_token': access_tokens.oauth_token
                    , 'magento.access_secret': access_tokens.oauth_token_secret
                });
                gb.vendor.save(Belt.cw(cb));
            }
        ], function(err){
            if (err) return res.status(400).end(err.message);
            res.redirect('/magento/v1?success_message=Great job, you\'ve successfully connected your Magento store with Wanderset');
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
