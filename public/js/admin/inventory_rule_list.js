var SearchInventoryRules = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'term': $('#search-modal [name="term"]').val()
    , 'product_category': $('#search-modal [name="product_category"]').val()
    , 'brand': $('#search-modal [name="brand"]').val()
    , 'product_brand': $('#search-modal [name="product_brand"]').val()
    , 'active': ($('#search-modal [name="active_true"]:checked').val() ? true : undefined) ||
      ($('#search-modal [name="active_false"]:checked').val() ? false : undefined)
    , 'product_hide': ($('#search-modal [name="product_hide_true"]:checked').val() ? true : undefined) ||
      ($('#search-modal [name="product_hide_false"]:checked').val() ? false : undefined)
    , 'product_show': ($('#search-modal [name="product_show_true"]:checked').val() ? true : undefined) ||
      ($('#search-modal [name="product_show_false"]:checked').val() ? false : undefined)
    , 'whitelist': ($('#search-modal [name="whitelist_true"]:checked').val() ? true : undefined) ||
      ($('#search-modal [name="whitelist_false"]:checked').val() ? false : undefined)
  });

  var query = {};
  var searchNullProductCategory = $('#search-modal [name="search_null_product_category"]:checked').val();

  if (a.o.term){
    query['term'] = {
      '$regex': a.o.term.toLowerCase().replace(/\W/g, '.*')
    };
  }

  if (a.o.product_category || searchNullProductCategory){
    query['product_category'] = searchNullProductCategory ? '' :{
      '$regex': a.o.product_category.toLowerCase().replace(/\W/g, '.*')
    };
  }

  if (a.o.product_brand){
    query['product_brand'] = {
      '$regex': a.o.product_brand.toLowerCase().replace(/\W/g, '.*')
    };
  }

  if (a.o.brand){
    query['brand'] = a.o.brand;
  }

  if (typeof a.o.active !== 'undefined'){
    query['active'] = a.o.active;
  }

  if (typeof a.o.product_hide !== 'undefined'){
    query['product_hide'] = a.o.product_hide;
  }

  if (typeof a.o.whitelist !== 'undefined'){
    query['whitelist'] = a.o.whitelist;
  }

  if (typeof a.o.product_show !== 'undefined'){
    query['product_show'] = a.o.product_show;
  }

  document.location = '/admin/inventory_rule/list?query=' + JSON.stringify(query);
};

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
      $.get('/cache/product/categories/list.json', function(json){
        if (Belt.get(json, 'error')) return cb(new Error(json.error));

        gb['product_categories'] = Belt.get(json);
        gb.product_categories = ['< No Product Category >'].concat(gb.product_categories);
        _.each(gb.product_categories, function (category) {
          $("#product_category_dropdown ul").append('<li><a href="#">' + category + '</a></li>');
        });
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

$(document).ready(function(){
  GB['model'] = 'inventory_rule';

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
  });
});

$(document).on('click', '#search-modal [name="search"]', function(e){
  e.preventDefault();
  SearchInventoryRules();
});

$(document).on('submit', '#search-modal form', function(e){
  e.preventDefault();
  SearchInventoryRules();
});

$(document).on('click', '#product_category_dropdown a', function(e){
  e.preventDefault();
  var category = $(this).html();

  $('#search-modal [name="product_category"]').val(category.indexOf('No Product Category') !== -1 ? undefined : category);
  $('#product_category_dropdown button').html(category)
});