#!/usr/bin/env node

var Async = require('async')
    , _ = require('underscore')
    , Belt = require('jsbelt')
    , Request = require('request')
    , API_URLS = {
        'get_request_token': 'oauth/token/request'
        , 'get_access_token': 'oauth/token/access'
    }
    , transformBodyToJSON = function (data) {
        var obj = {};
        data = data.split('&');
        for(var i = 0; i < data.length; i++) {
            obj[data[i].substring(0, data[i].indexOf('='))] = data[i].substring(data[i].indexOf('=') + 1);
        }
        return obj;
    }
    ;

module.exports = function(S){

    S['Authorization'] = function (consumerKey, consumerSecret, storeUrl, verifier, callback) {
        var gb = {};

        Async.waterfall([
            function(cb){

                Request({
                    'url': storeUrl + API_URLS.get_request_token
                    , 'oauth': {
                        'consumer_key': consumerKey
                        , 'consumer_secret': consumerSecret
                    }
                }, function (err, res) {
                    res = transformBodyToJSON(res.body);
                    gb.requestToken = res.oauth_token;
                    gb.requestSecret = res.oauth_token_secret;
                    cb();
                });
            },
            function (cb) {

                Request({
                    'url': storeUrl + API_URLS.get_access_token
                    , 'oauth': {
                        'consumer_key': consumerKey
                        , 'consumer_secret': consumerSecret
                        , 'token': gb.requestToken
                        , 'token_secret': gb.requestSecret
                        , 'verifier': verifier
                    }
                }, function (err, res) {
                    res = transformBodyToJSON(res.body);
                    gb.accessToken = res.oauth_token;
                    gb.accessSecret = res.oauth_token_secret;
                    cb();
                });
            }
        ], function(err, data){
            if (err){
                console.log(err);
                S.emit('error', err);
            }

            callback(gb);
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

        S.Authorization(gb.data.oauth_consumer_key
            , gb.data.oauth_consumer_secret
            , gb.data.store_base_url
            , gb.data.oauth_verifier
            , function (response) {
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
                            , 'magento.access_token': response.accessKey
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
        );
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

    S.instance.express.all('/magento/store-name', function(req, res){

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
