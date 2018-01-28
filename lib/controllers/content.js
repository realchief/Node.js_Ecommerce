#!/usr/bin/env node

var Async = require('async')
    , _ = require('underscore')
    , Belt = require('jsbelt')
    , CRUD = require('./helpers/crud.js')
    , Validate = require('../../node_modules/basecmd/lib/controllers/helpers/validate.js')
    ;

module.exports = function(S){
    S = CRUD(S, {
        'create_routes': S.settings.create_rest_routes ? true : false
    });
    S = Validate(S);

    /**
     * @api {post} /promo_code/:page/update.json Update Content
     * @apiName UpdateContent
     * @apiGroup Content
     * @apiPermission admin
     *
     */
    S.instance.express.all('/admin/content/:page/update.json', function(req, res){
        var a = {
            'o': _.extend({}, {
                'data': req.body
                , 'page': req.params.page
            })
        }, self = S
        , gb = {};
        a.o = _.defaults(a.o, {
            'data': {}
        });

        return Async.waterfall([
            function(cb){
                return self.model.findOne({
                    'page': a.o.page
                }, Belt.cs(cb, gb, 'doc', 1));
            }
            , function(cb){
                if (a.o.data.update) {
                    if (!gb.doc) return cb(new Error('Page to update not found'));
                    a.o.data = _.omit(a.o.data, 'update');
                } else if (!gb.doc) {
                    gb.doc = self.model({});
                }

                gb.doc.set({
                    'page': a.o.page
                    , 'data': a.o.data
                });

                gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
            }
        ], function(err){
            return res.status(200).json({
                'error': Belt.get(err, 'message')
                , 'data': Belt.get(gb, 'doc.toSanitizedObject()')
            });
        });
    });

    setTimeout(function(){
        Async.waterfall([
            function(cb){
                cb();
            }
        ], function(err){
            if (err) S.emit('error', err);

            S.emit('ready');
        });
    }, 0);
};
