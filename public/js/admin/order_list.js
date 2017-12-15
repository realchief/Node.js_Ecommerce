var SearchOrders = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'first_name': $('[name="first_name"]').val()
  , 'last_name': $('[name="last_name"]').val()
  , 'email': $('[name="email"]').val()
  , 'promo_code': $('[name="promo_code"]').val()
  , 'product': $('[name="product"]').val()
  , 'slug': $('[name="slug"]').val()
  , 'vendor': $('[name="vendor"]').val()
  , 'vendor_order': $('[name="vendor_order"]').val()
  , 'shipment': $('[name="shipment"]').val()
  , 'shipment_status': $('[name="shipment_status"]').val()
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
    query['products.source.order.order.id'] = Belt.cast(a.o.vendor_order.toLowerCase().replace(/\W/g, '.*'), 'number')
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
      d.options = d.options || {};
      d.Instance = Instance;
      d.GB = GB;
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

    if (Belt.get(res.query, '_id')){
      $('[name="_id"] [name="filter"]').val(res.query._id);
    }

    if (Belt.get(res.query, '$or.0')){
      $('[name="content"] [name="filter"]').val(res.query.$or[0]['label.us'].$regex.replace(/\\W\*/g, ' '));
    }
  });
});

$(document).on('click', '#search-modal [name="search"]', function(e){
  e.preventDefault();
  SearchOrders();
});
