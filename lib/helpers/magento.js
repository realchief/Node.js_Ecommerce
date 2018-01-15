#!/usr/bin/env node

var Async = require('async')
    , _ = require('underscore')
    , Belt = require('jsbelt')
    , Request = require('request')
    , querystring = require('query-string')
    ;

module.exports = function(S){

    S['api_urls'] = {
        'get_request_token': 'oauth/token/request'
        , 'get_access_token': 'oauth/token/access'
        , 'get_products': 'rest/V1/products?searchCriteria[page_size]=20&searchCriteria[current_page]='
    };

    S['IterateProducts'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            // url
            // consumer_key
            // secret
            // access_token
            // access_secret
            // verifier
            'progress_cb': Belt.np
        });

        Async.waterfall([
            function(cb){

                gb['page'] = 1;

                Async.forever(function(next){

                    Request({
                        'url': a.o.url + S.api_urls.get_products + gb.page++
                        , 'oauth': {
                            'consumer_key': a.o.consumer_key
                            , 'consumer_secret': a.o.secret
                            , 'verifier': a.o.verifier
                            , 'token': a.o.access_token
                            , 'token_secret': a.o.access_secret
                        }
                    }, function (err, data) {

                        gb['products'] = Belt.get(JSON.parse(data.body), 'items') || [];
                        if (_.any(gb.products) && gb.lastItemId === _.last(gb.products).id) {
                            cb();
                            return; // stops the forever loop
                        } else {
                            gb.lastItemId = _.last(gb.products).id;
                        }

                         Async.eachSeries(gb.products, function(p, cb2){
                             a.o.progress_cb(p, cb2);
                         }, Belt.cw(next, 0));
                    });
                });
            }
        ], function(err){
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
                }, function (err, res) {
                    res = querystring.parse(res.body);
                    gb.requestToken = res.oauth_token;
                    gb.requestSecret = res.oauth_token_secret;
                    cb();
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
                }, function (err, res) {
                    res = querystring.parse(res.body);
                    gb.accessToken = res.oauth_token;
                    gb.accessSecret = res.oauth_token_secret;
                    cb();
                });
            }
        ], function(err, data){
            a.o.progress_cb(err, gb);
        });
    };

    S.instance.express.all('/magento/authorize', function(req, res){
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
            , 'progress_cb': function (err, response) {
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
                            return !response[v];
                        });

                        if (missing) return cb(new Error(missing + ' is required'));

                        gb.doc = S.instance.db.model('vendor')({});

                        // TODO check if permissions are correct
                        gb.doc.set({
                            'name': gb.data.oauth_consumer_key
                            , 'locked': true
                            , 'magento.url': gb.data.store_base_url
                            , 'magento.consumer_key': gb.data.oauth_consumer_key
                            , 'magento.secret': gb.data.oauth_consumer_secret
                            , 'magento.verifier': gb.data.oauth_verifier
                            , 'magento.access_token': response.accessToken
                            , 'magento.access_secret': response.accessSecret
                        });

                        gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
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
        // TODO check if store name is unique
        var gb = {
            'data': req.data()
        };

        Async.waterfall([
            function(cb){
                S.instance.db.model('vendor').update({
                    'name': gb.data.consumer_key
                }, {
                    'name': gb.data.store_name
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
