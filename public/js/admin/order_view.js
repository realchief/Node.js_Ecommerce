var OrderView = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('#container')
  , 'triggers': {
      'submit form': function(e){
        e.preventDefault();
      }
    , 'click [name="add_shipment"]': function(e){
        e.preventDefault();
        var self = this;

        self.addShipment();
      }
    , 'click [name="submit"]': function(e){
        e.preventDefault();
        var self = this;

        self.update();
      }
    }
  , 'transformers': {
      'set:products': function(val){
        return _.map(val, function(v){
          return '<option value="' + v._id + '">' + Belt.get(v, 'source.product.label.us') + ' - ' + v._id + '</option>';
        }).join('\n')
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

    gb['update'] = _.pick(gb.data, [
      'support_status'
    , 'notes'
    ]);

    Async.waterfall([
      function(cb){
        $.post('/order/' + self._id + '/update.json', gb.update, function(json){
          if (Belt.get(json, 'error')) return cb(new Error(json.error));

          gb['doc'] = Belt.get(json, 'data');

          LoadDocs(GB.criteria, function(err, res){
            if (err) return bootbox.alert(err.message);

            $('tbody').html(_.map(res.docs, function(d){
              d.options = d.options || {};
              d.Instance = Instance;
              return Templates['admin_' + GB.model + '_list_row'](d);
            }).join('\n'));

            cb();
          });
        });
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view['addShipment'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    $('input, select').each(function(i, e){
      var $e = $(e);
      gb[$e.attr('name')] = $e.is('[type="checkbox"]') ? ($e.is(':checked') ? true : false) : $e.val();
    });

    gb['id'] = gb.tracking_number || gb.carrier;

    $.post('/admin/order/' + self._id + '/shipment/create.json', {
      'shipment': gb
    }, function(res){
      $('input, select').val('');

      LoadDocs(GB.criteria, function(err, res){
        if (err) return bootbox.alert(err.message);

        $('tbody').html(_.map(res.docs, function(d){
          d.options = d.options || {};
          d.Instance = Instance;
          return Templates['admin_' + GB.model + '_list_row'](d);
        }).join('\n'));

      });
    });
  };

  gb.view['method'] = a.o.method;
  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};
