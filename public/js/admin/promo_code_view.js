var PromoCodeView = function(options, callback){
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

        if (self.method === 'update'){
          self.update(function(err, gb){
            if (err) return bootbox.alert(err.message);

            self.loadDoc({
              'doc': gb.doc
            });
          });
        } else {
          self.create(function(err, gb){
            if (err) return bootbox.alert(err.message);

            document.location = '/admin/promo_code/' + gb.doc._id + '/read';
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

  gb.view['create'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['data'] = self.getSelf();

    gb['update'] = _.pick(gb.data, [
      'code'
    , 'label'
    , 'active'
    , 'error_label'
    , 'discount_type'
    , 'discount_amount'
    , 'max_claims'
    , 'credit_balance'
    ]);

    if (gb.update.discount_amount){
      if (gb.update.discount_type === 'percentage' && gb.update.discount_amount > 1) gb.update.discount_amount /= 100;

      gb.update.discount_amount = Math.abs(gb.update.discount_amount);
    }

    gb.update = {
      'json': JSON.stringify(gb.update)
    };

    Async.waterfall([
      function(cb){
        $.post('/admin/promo_code/create.json', gb.update, function(json){
          if (Belt.get(json, 'error')) return cb(new Error(json.error));

          gb['doc'] = Belt.get(json, 'data');

          cb();
        });
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view['update'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['data'] = self.getSelf();

    gb['update'] = _.pick(gb.data, [
      'code'
    , 'label'
    , 'active'
    , 'error_label'
    , 'discount_type'
    , 'discount_amount'
    , 'max_claims'
    , 'credit_balance'
    ]);

    if (gb.update.discount_amount){
      if (gb.update.discount_type === 'percentage' && gb.update.discount_amount > 1) gb.update.discount_amount /= 100;

      gb.update.discount_amount = Math.abs(gb.update.discount_amount);
    }

    gb.update = {
      'json': JSON.stringify(gb.update)
    };

    Async.waterfall([
      function(cb){
        $.post('/admin/promo_code/' + self._id + '/update.json', gb.update, function(json){
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
  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};
