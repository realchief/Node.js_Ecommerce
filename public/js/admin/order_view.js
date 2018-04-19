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
    , 'click [name="process_vendor_orders"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure you want to place vendor orders?', function(yes){
          if (!yes) return;

          self.processVendorOrders();
        });
      }
    , 'click [name="send_confirmation_email"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure you want to send order confirmation email to customer?', function(yes){
          if (!yes) return;

          self.sendOrderConfirmation();
        });
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
    , 'buyer'
    , 'recipient'
    ]);

    Async.waterfall([
      function(cb){
        $.post('/admin/order/' + self._id + '/update.json', gb.update, function(json){
          if (Belt.get(json, 'error')) return cb(new Error(json.error));

          gb['doc'] = Belt.get(json, 'data');

          LoadDocs(GB.criteria, function(err, res){
            if (err) return bootbox.alert(err.message);

            $('tbody').html(_.map(res.docs, function(d){
              d.options = d.options || {};
              d.Instance = Instance;
              d.GB = GB;
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
          d.GB = GB;
          return Templates['admin_' + GB.model + '_list_row'](d);
        }).join('\n'));

      });
    });
  };

  gb.view['processVendorOrders'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    $.post('/admin/order/' + self._id + '/vendor_orders/create.json', {
    }, function(res){
      var err = Belt.get(res, 'error');
      if (err) return bootbox.alert(err);

      LoadDocs(GB.criteria, function(err, res){
        if (err) return bootbox.alert(err.message);

        $('tbody').html(_.map(res.docs, function(d){
          d.options = d.options || {};
          d.Instance = Instance;
          d.GB = GB;
          return Templates['admin_' + GB.model + '_list_row'](d);
        }).join('\n'));

        bootbox.alert('Vendor orders have been placed!');
      });
    });
  };

  gb.view['sendOrderConfirmation'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    $.post('/admin/order/' + self._id + '/confirmation/send.json', {
    }, function(res){
      var err = Belt.get(res, 'error');
      if (err) return bootbox.alert(err);

      LoadDocs(GB.criteria, function(err, res){
        if (err) return bootbox.alert(err.message);

        $('tbody').html(_.map(res.docs, function(d){
          d.options = d.options || {};
          d.Instance = Instance;
          d.GB = GB;
          return Templates['admin_' + GB.model + '_list_row'](d);
        }).join('\n'));

        bootbox.alert('Order confirmation has been sent!');
      });
    });
  };

  gb.view['method'] = a.o.method;
  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};

$(document).on('click', 'tr [name="save"]', function(e){
    e.preventDefault();
    var $tr = $(this).parents('tr')
        , support_status = $tr.find('[name="support_status"]').val()
        , notes = $tr.find('[name="notes"]').val()
        , _id = $tr.attr('data-id');

    var vendor_products = {};
    $.each($tr.find('.variant'), function (i) {
        var prod_id = $(this).attr('data-prod-id');
        var key = $(this).attr('data-variant-label');
        if (!(prod_id in vendor_products)) {
            vendor_products[prod_id] = {}
        }
        vendor_products[prod_id][key] = $(this).val();
    });

    $.each($tr.find('.qty'), function (i) {
        var prod_id = $(this).attr('data-prod-id');
        if (!(prod_id in vendor_products)) {
            vendor_products[prod_id] = {}
        }
        vendor_products[prod_id]['qty'] = $(this).val();
    });

    Async.waterfall([
        function(cb) {
            Async.forEachOf(vendor_products, function (prod, prod_id, cb2) {
                $.post('/admin/order/' + _id + '/product/' + prod_id + '/stock/update.json', prod, function (res) {
                    if (Belt.get(res, 'error')) return cb2(res.error);
                    cb2();
                });
            }, Belt.cw(cb, 0));
        },
        function(cb) {
            $.post('/admin/order/' + _id + '/update.json', {
                'support_status': support_status
                , 'notes': notes
            }, function(res){
                if (Belt.get(res, 'error')) cb(res.error);
                var d = Belt.get(res, 'data');
                d.options = d.options || {};
                d.Instance = Instance;
                d.GB = GB;
                var stocks = {};
                var available_keys = {};

                _.each(d.products, function (p) {
                    stocks[p.product] = {};
                    available_keys[p.product] = [];
                    var pr_stocks = p.source.product.stocks || _.flatten(p.source.product.configuration_array);
                    var option_attrs = _.keys(p.options);
                    _.each(pr_stocks, function (stock) {
                        _.each(option_attrs, function (attr, idx) {
                            if (stock.available_quantity > 0) {
                                var key = _.map(option_attrs.slice(0, idx+1), function (k) {
                                    if (stock.options[k] && _.has(stock.options[k], 'value') && stock.options[k].value)
                                        return stock.options[k].value.replace(/\./g, '_');
                                    return '';
                                }).join('.');
                                Belt.set(stocks[p.product], key, stock.available_quantity);
                                if(option_attrs.length == idx + 1)
                                    available_keys[p.product].push(key);
                            }
                        });
                    });
                });
                d.stocks_str = JSON.stringify(stocks);
                d.available_keys = JSON.stringify(available_keys);
                $tr.replaceWith(Templates['admin_' + GB.model + '_list_row'](d));
                cb();
            });
        }
    ], function (err) {
        if (err) return bootbox.alert(err);
    });

});
