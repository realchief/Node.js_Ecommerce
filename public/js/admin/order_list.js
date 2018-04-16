var SearchOrders = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'first_name': $('#search-modal [name="first_name"]').val()
  , 'last_name': $('#search-modal [name="last_name"]').val()
  , 'email': $('#search-modal [name="email"]').val()
  , 'promo_code': $('#search-modal [name="promo_code"]').val()
  , 'product': $('#search-modal [name="product"]').val()
  , 'slug': $('#search-modal [name="slug"]').val()
  , 'vendor': $('#search-modal [name="vendor"]').val()
  , 'vendor_order': $('#search-modal [name="vendor_order"]').val()
  , 'shipment': $('#search-modal [name="shipment"]').val()
  , 'shipment_status': $('#search-modal [name="shipment_status"]').val()
  , 'support_status': $('#search-modal [name="support_status"]').val()
  , 'transaction': $('#search-modal [name="transaction"]').val()
  , 'notes': $('#search-modal [name="notes"]').val()
  });

  var query = {};

  if (a.o.first_name){
    query['$or'] = query.$or || [];
    query.$or[0] = query.$or[0] || {};
    query.$or[0]['recipient.first_name'] = {
      '$regex': a.o.first_name.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
    query.$or[1] = query.$or[1] || {};
    query.$or[1]['recipient.first_name'] = {
      '$regex': a.o.first_name.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.last_name){
    query['$or'] = query.$or || [];
    query.$or[0] = query.$or[0] || {};
    query.$or[0]['recipient.last_name'] = {
      '$regex': a.o.last_name.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
    query.$or[1] = query.$or[1] || {};
    query.$or[1]['recipient.last_name'] = {
      '$regex': a.o.last_name.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.email){
    query['buyer.email'] = {
      '$regex': a.o.email.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.slug){
    query['slug'] = {
      '$regex': a.o.slug.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.transaction){
    query['transactions.id'] = {
      '$regex': a.o.transaction.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.shipment){
    query['shipments.tracking_number'] = {
      '$regex': a.o.shipment.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.promo_code){
    query['line_items.label'] = {
      '$regex': a.o.promo_code.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.support_status){
    query['support_status'] = {
      '$regex': a.o.support_status.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.notes){
    query['notes'] = {
      '$regex': a.o.notes.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.product){
    query['$or'] = query.$or || [];
    query.$or[0] = query.$or[0] || {};
    query.$or[0]['products.source.product.label.us'] = {
      '$regex': a.o.product.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
    query.$or[1] = query.$or[1] || {};
    query.$or[1]['products.source.product.brands'] = {
      '$regex': a.o.product.toLowerCase().replace(/\W/g, '.*')
    , '$options': 'i'
    };
  }

  if (a.o.vendor_order){
    query['$or'] = query.$or || [];

    query.$or[0] = query.$or[0] || {};
    query.$or[0]['products.source.order.order.id'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number');

    query.$or[0] = query.$or[0] || {};
    query.$or[0]['products.source.order.id'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number');

    query.$or[1] = query.$or[1] || {};
    query.$or[1]['products.source.order.order.number'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number');

    query.$or[1] = query.$or[1] || {};
    query.$or[1]['products.source.order.number'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number');

    query.$or[2] = query.$or[2] || {};
    query.$or[2]['products.source.order.order.order_number'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number');

    query.$or[2] = query.$or[2] || {};
    query.$or[2]['products.source.order.order_number'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number');
  }

  if (a.o.shipment_status){
    query['shipping_status'] = a.o.shipment_status;
  }

  if (a.o.vendor){
    query['products.source.product.vendor'] = a.o.vendor;
  }

  document.location = '/admin/order/list?query=' + JSON.stringify(query);
}

var LoadDocs = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'skip': 0
  , 'limit': 500
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
        var docs = Belt.get(json, 'data');
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
  GB['model'] = 'order';

  GB['criteria'] = _.defaults(_.extend({}, GB.data || {}, queryObject.get() || {}), {
    'limit': 25
  , 'skip': 0
  , 'query': '{}'
  , 'sort': '{"created_at": -1}'
  });

  if (_.isString(GB.criteria.query)) GB.criteria.query = JSON.parse(GB.criteria.query);
  if (_.isString(GB.criteria.sort)) GB.criteria.sort = JSON.parse(GB.criteria.sort);
  GB.criteria.skip = Belt.cast(GB.criteria.skip, 'number');
  GB.criteria.limit = Belt.cast(GB.criteria.limit, 'number');

  $(document).on('change', '.variant', function (e) {
    var key = '';
    $tr = $(this).closest('tr');
    $.each($tr.find('.variant'), function () {
      key += '.' + $(this).val().replace('\.', '_');
    });
    var stocks = JSON.parse($tr.find('.stock-str').val());
    var product_id = $(this).attr('data-prod-id');
    var available_quantity = Belt.get(stocks, product_id + key);
    var html = '';
    var origin_qty = $tr.find('.qty').val();

    for (var i = 1;i <= available_quantity;i ++) {
      if (i == origin_qty || (origin_qty > available_quantity && i == available_quantity)) 
        html += '<option selected>' + i + '</option>';
      else html += '<option>' + i + '</option>';
    }

    if (!html) {
      html = '<option>No available</option>';
    }
    $tr.find('.qty').html(html);
  });

  $(document).on('click', '[name="apply_filter"]', function(e){
    e.preventDefault();

    var qry = BuildQuery();

    document.location = document.location.pathname
    + '?limit=' + GB.criteria.limit
    + '&skip=0'
    + (GB.criteria.sort ? '&sort=' + encodeURIComponent(JSON.stringify(GB.criteria.sort)) : '')
    + (qry ? '&query=' + encodeURIComponent(JSON.stringify(qry)) : '');
  });

  $(document).on('click', '.' + GB.model + ' [name="delete"]', function(e){
    e.preventDefault();

    var $doc = $(this).parents('.' + GB.model)
      , id = $doc.attr('data-id');

    bootbox.confirm('Are you sure you want to delete this ' + GB.model + '?', function(yes){
      if (!yes) return;

      $.ajax({
        'url': '/admin/' + GB.model + '/' + id + '/delete.json'
      , 'type': 'DELETE'
      , 'dataType': 'json'
      , 'success': function(json){
          if (Belt.get(json, 'error')) return bootbox.alert(json.error);

          $doc.remove();
        }
      })
    });
  });

  LoadDocs(GB.criteria, function(err, res){
    if (err) return bootbox.alert(err.message);

    $('[name="count"]').html((res.skip + 1) + '-' + Belt.cast(_.min([res.skip + res.limit, res.count]), 'string') + ' of ' + res.count);

    $('tbody').html(_.map(res.docs, function(d){
      if (!d) return '';
      var options = d.options;
      d.options = d.options || {};
      d.Instance = Instance;
      d.GB = GB;
      var stocks = {};
      _.each(d.products, function (p) {
        stocks[p.product] = {};
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
            }
          });
        });
      });
      d.stocks_str = JSON.stringify(stocks);
      return Templates['admin_' + GB.model + '_list_row'](d);
    }).join('\n'));

    var phtml = '<div class="btn-group">';
    for (var i = 1; (i - 1) * res.limit <= res.count; i++){
      phtml += '<a href="' + document.location.pathname
      + '?limit=' + res.limit
      + '&skip=' + ((i - 1) * res.limit)
      + (res.sort ? '&sort=' + encodeURIComponent(JSON.stringify(res.sort)) : '')
      + (res.query ? '&query=' + encodeURIComponent(JSON.stringify(res.query)) : '')
      + '" class="btn btn-'
      + ((res.skip + 1) <= (res.limit * i)
      && (res.skip + 1) > (res.limit * (i - 1))
      ? 'primary' : 'default') + '">' + i + '</a>';
    }
    phtml += '</div>'
    $('[name="pagination"]').html(phtml);
  });
});

$(document).on('click', '#search-modal [name="search"]', function(e){
  e.preventDefault();
  SearchOrders();
});

$(document).on('submit', '#search-modal form', function(e){
  e.preventDefault();
  SearchOrders();
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
  console.log(prod_slug);
  var $tr = $(this).closest('tr');
  var order_id = $tr.attr('data-id');
  $.get('/admin/order/' + order_id + '/product/' + prod_slug + '/create.json', function(res) {
    if (res.error) return bootbox.alert(error);
    var d = Belt.get(res, 'data');
    d.options = d.options || {};
    d.Instance = Instance;
    d.GB = GB;
    $tr.replaceWith(Templates['admin_' + GB.model + '_list_row'](d));
  });
  
});
$(document).on('click', '.btn-prod-del', function (e) {
  var sel_prod_slugs = [];
  var $tr = $(this).closest('tr');
  var order_id = $tr.attr('data-id');
  $.each($('.ch-prod:checked'), function (idx) {
    var data_prod_slug = $(this).attr('id');
    console.log(data_prod_slug);
    if (data_prod_slug) {
      sel_prod_slugs.push(data_prod_slug);
    }
  });
  DelProd(order_id, sel_prod_slugs, function(d) {
    d.options = d.options || {};
    d.Instance = Instance;
    d.GB = GB;
    $tr.replaceWith(Templates['admin_' + GB.model + '_list_row'](d));
  });
});
$(document).on('click', '.btn-prod-remove', function(e) {
  var prod_id = $(this).attr('data-prod-slug');
  var $tr = $(this).closest('tr');
  var order_id = $tr.attr('data-id');
  DelProd(order_id, [prod_id], function(d) {
    d.options = d.options || {};
    d.Instance = Instance;
    d.GB = GB;
    $tr.replaceWith(Templates['admin_' + GB.model + '_list_row'](d));
  });
});
$(document).on('click', '.ch-prod', function(e) {
  var sel_prod_slugs = [];
  var $btn_del = $(this).closest('td').find('.btn-prod-del');
  $.each($('.ch-prod:checked'), function (idx) {
    var data_prod_slug = $(this).attr('id');
    console.log(data_prod_slug);
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
  console.log(sel_prod_slugs);
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
        _.each(d.products, function (p) {
          stocks[p.product] = {};
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
              }
            });
          });
        });
        d.stocks_str = JSON.stringify(stocks);
        $tr.replaceWith(Templates['admin_' + GB.model + '_list_row'](d));
          cb();
        });
    }
  ], function (err) {
      if (err) return bootbox.alert(err);
  });
  
});
