/**
 * Created by zvonimirsabljic on 26/01/18.
 */
var ContentView = function(options, callback){
    var a = Belt.argulint(arguments)
        , self = this
        , gb = {};
    a.o = _.defaults(a.o, {
        'el': $('#container')
        , 'triggers': {
            'submit form': function(e){
                e.preventDefault();
            }
            , 'click [name="submit"]': function(e){
                e.preventDefault();
                var self = this;

                self.clicked_id = e.target.id;
                if (self.method === 'update'){
                    self.update(function(err, gb){
                        if (err) return bootbox.alert(err.message);

                        self.loadDoc({
                            'doc': gb.doc
                        });
                    });
                }
            }
        }
        , 'transformers': {
            'get:max_claims': function(val){
                return !val ? undefined : Belt.cast(val, 'number');
            }
            , 'get:discount_amount': function(val){
                return Belt.cast(val, 'number') || 0;
            }
        }
    });

    gb['view'] = new Bh.View(a.o);

    gb.view['getSelf'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {

        });

        var obj = self.get();

        return obj;
    };


    gb.view['loadDoc'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {
            //doc
        });

        self.set(Belt.objFlatten(a.o.doc));

        self['doc'] = a.o.doc;
    };

    gb.view['update'] = function(options, callback){
        var a = Belt.argulint(arguments)
            , self = this
            , gb = {};
        a.o = _.defaults(a.o, {

        });

        gb['data'] = self.getSelf();

        if (self.clicked_id) {
            gb['data'] = _.pick(gb.data, [
                self.clicked_id
            ]);
            gb['data'].update = true;
        }

        Async.waterfall([
            function(cb){
                $.post('/admin/content/' + self.page + '/update.json', gb.data, function(json){
                    if (Belt.get(json, 'error')) return cb(new Error(json.error));

                    gb['doc'] = Belt.get(json, 'data');

                    cb();
                });
            }
        ], function(err){
            a.cb(err, gb);
        });
    };

    gb.view['method'] = a.o.method;
    gb.view.emit('load');

    return gb.view;
};
