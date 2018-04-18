var LoadDocs = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'skip': 0
  , 'limit': 100
  });

  return Async.waterfall([
    function(cb){
      $.post('/admin/' + GB.model + '/count.json', a.o, function(json){
        if (Belt.get(json, 'error')) return cb(new Error(json.error));

        gb['count'] = Belt.get(json, 'data');
        cb();
      });
    }
  , function(cb){
      $.post('/admin/' + GB.model + '/list.json', a.o, function(json){
        if (Belt.get(json, 'error')) return cb(new Error(json.error));

        gb['docs'] = Belt.get(json, 'data');
        cb();
      });
    }
  , function(cb){
      _.extend(gb, a.o);
      cb();
    }
  ], function(err){
    a.cb(err, gb);
  });
};

var BuildQuery = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'query': GB.criteria.query
  });

  var qry = {} //Belt.copy(a.o.query)
    , val;

  val = $('[name="_id"] [name="filter"]').val();
  if (val){
    val = val.replace(/\s/g, '');
    qry['_id'] = val;
  }

  val = $('[name="name"] [name="filter"]').val();
  if (val){
    val = val.replace(/\W+/g, '\\W*');
    qry['name'] = {
      '$regex': val
    , '$options': 'i'
    };
  }

  return qry;
};

var DelProd = function (order_id, ids, cb) {
  $.post('/admin/order/' + order_id + '/products/delete.json', {
    'products': ids
  }, function (res) {
    if (res.error) return bootbox.alert(error);
    var d = Belt.get(res, 'data');
    return cb(d);
  });
}

$(document).ready(function(){
  GB['view'] = OrderView({
    'method': 'update'
  , '_id': document.location.pathname.split('/')[3]
  });

  $.getJSON('/admin/order/' + GB.view._id + '/read.json', function(json){
    if (Belt.get(json, 'error')) return bootbox.alert(json.error);

    GB.view.loadDoc({
      'doc': json.data
    });

    GB['model'] = 'order';

    GB['criteria'] = {
      'limit': 50
    , 'skip': 0
    , 'query': {'slug': GB.view._id}
    , 'sort': '{"_id": 1}'
    };

    if (_.isString(GB.criteria.query)) GB.criteria.query = JSON.parse(GB.criteria.query);
    if (_.isString(GB.criteria.sort)) GB.criteria.sort = JSON.parse(GB.criteria.sort);
    GB.criteria.skip = Belt.cast(GB.criteria.skip, 'number');
    GB.criteria.limit = Belt.cast(GB.criteria.limit, 'number');

    LoadDocs(GB.criteria, function(err, res){
      if (err) return bootbox.alert(err.message);      
      $('tbody').html(_.map(res.docs, function(d){
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
                        if (!Belt.get(stocks[p.product], key))
                            Belt.set(stocks[p.product], key, stock.available_quantity);
                        if(option_attrs.length == idx + 1) {
                            available_keys[p.product].push(key);
                        }
                    }
                });
            });
        });
        d.stocks_str = JSON.stringify(stocks);
        d.available_keys = JSON.stringify(available_keys);

        return Templates['admin_' + GB.model + '_list_row'](d);
      }).join('\n'));

    });
  });
});

$(document).on('click', '.btn-prod-add', function(e){
    var prod_slug = $(this).closest('td').find('.input-add-product input').val();
    var $elem = $(this).closest('td').find('.input-add-product .error');
    if (prod_slug && !$elem.hasClass('hidden')) {
        $elem.addClass('hidden');
    }
    else if (!prod_slug ){
        if ( $elem.hasClass('hidden')) {
            $elem.removeClass('hidden');
        }
        return;
    }
    var $tr = $(this).closest('tr');
    var order_id = $tr.attr('data-id');
    $.get('/admin/order/' + order_id + '/product/' + prod_slug + '/create.json', function(res) {
        if (res.error) return bootbox.alert(error);
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
    });

});

$(document).on('click', '.btn-prod-del', function (e) {
    var sel_prod_slugs = [];
    var $tr = $(this).closest('tr');
    var order_id = $tr.attr('data-id');
    $.each($('.ch-prod:checked'), function (idx) {
        var data_prod_slug = $(this).attr('id');
        if (data_prod_slug) {
            sel_prod_slugs.push(data_prod_slug);
        }
    });
    DelProd(order_id, sel_prod_slugs, function(d) {
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
    });
});

$(document).on('click', '.ch-prod', function(e) {
  var sel_prod_slugs = [];
  var $btn_del = $(this).closest('td').find('.btn-prod-del');
  $.each($('.ch-prod:checked'), function (idx) {
    var data_prod_slug = $(this).attr('id');
    
    if (data_prod_slug) {
      sel_prod_slugs.push(data_prod_slug);
    }
  });

  if (sel_prod_slugs.length > 0) {
    $btn_del.removeAttr('disabled');
  }
  else {
    $btn_del.attr('disabled', 'disabled');
  }
  
});

$(document).on('click', '[name="save"]', function(e){
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
