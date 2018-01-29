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
            , function (cb) {
                if (a.o.data.update) {
                    if (!gb.doc) return cb(new Error('Page to update not found'));
                    a.o.data = _.omit(a.o.data, 'update');
                } else if (!gb.doc) {
                    gb.doc = self.model({});
                    gb.doc.set('page', a.o.page);
                }
                _.each(_.keys(a.o.data), function (k1) {
                    _.each(_.keys(a.o.data[k1]), function (k2) {
                        if (a.o.data[k1][k2] === '') {
                            delete a.o.data[k1][k2];
                        } else {
                            gb.doc.set('data.' + k1 + '.' + k2, a.o.data[k1][k2]);
                        }
                    });
                });

                gb.doc.save(Belt.cs(cb, gb, 'doc', 1, 0));
            }
            , function (cb) {
                S.instance.content_cache[req.params.page] = gb.doc.data;
                cb();
            }
        ], function(err){
            var json = { 'data': Belt.get(gb, 'doc.toSanitizedObject()') };
            if (err) json.error = Belt.get(err, 'message');
            else json.message = 'Content updated successfully';
            return res.status(200).json(json);
        });
    });

    setTimeout(function(){
        var gb = {};
        Async.waterfall([
            function (cb) {
                S.instance.db.model('content').find({}, Belt.cs(cb, gb, 'doc', 1, 0));
            }
            , function (cb) {
                S.instance['content_cache'] = {};
                Async.eachSeries(gb.doc, function (doc, cb2) {
                    S.instance['content_cache'][doc.page] = doc.data;
                    cb2();
                }, Belt.cw(cb));
            }
        ], function(err){
            if (err) S.emit('error', err);

            S.emit('ready');
        });
    }, 0);
};
