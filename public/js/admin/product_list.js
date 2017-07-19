var LoadProducts = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'skip': 0
  , 'limit': 100
  });

  return Async.waterfall([
    function(cb){
      $.post('/product/count.json', a.o, function(json){
        if (Belt.get(json, 'error')) return cb(new Error(json.error));

        gb['count'] = Belt.get(json, 'data');
        cb();
      });
    }
  , function(cb){
      $.post('/product/list.json', a.o, function(json){
        if (Belt.get(json, 'error')) return cb(new Error(json.error));

        gb['docs'] = Belt.get(json, 'data');
        GB['docs'] = gb.docs;

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

  val = $('[name="content"] [name="filter"]').val();
  if (val){
    val = val.replace(/\W+/g, '\\W*');
    qry['$or'] = [
      {
        'label.us': {
          '$regex': val
        , '$options': 'i'
        }
      }
    , {
        'description.us': {
          '$regex': val
        , '$options': 'i'
        }
      }
    ];
  }

  val = $('[name="categories"] [name="filter"]').val();
  if (val){
    val = val.replace(/\W+/g, '\\W*');
    qry['categories'] = {
      '$regex': val
    , '$options': 'i'
    };
  }

  val = $('[name="brands"] [name="filter"]').val();
  if (val){
    val = val.replace(/\W+/g, '\\W*');
    qry['brands'] = {
      '$regex': val
    , '$options': 'i'
    };
  }

  val = $('[name="options"] [name="filter"]').val();
  if (val){
    val = val.replace(/\W+/g, '\\W*');
    qry['options.values.us'] = {
      '$regex': val
    , '$options': 'i'
    };
  }

  return qry;
};

$(document).ready(function(){
  GB['criteria'] = _.defaults(queryObject.get() || {}, {
    'limit': 50
  , 'skip': 0
  , 'query': '{}'
  , 'sort': '{"_id": 1}'
  });

  GB.criteria.query = JSON.parse(GB.criteria.query);
  GB.criteria.sort = JSON.parse(GB.criteria.sort);
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

  $(document).on('click', '.product [name="delete"]', function(e){
    e.preventDefault();

    var $prod = $(this).parents('.product')
      , id = $prod.attr('data-id');

    bootbox.confirm('Are you sure you want to delete this product?', function(yes){
      if (!yes) return;

      $.ajax({
        'url': '/product/' + id + '/delete.json'
      , 'type': 'DELETE'
      , 'dataType': 'json'
      , 'success': function(json){
          if (Belt.get(json, 'error')) return bootbox.alert(json.error);

          $prod.remove();
        }
      })
    });
  });

  LoadProducts(GB.criteria, function(err, res){
    if (err) return bootbox.alert(err.message);

    $('[name="count"]').html((res.skip + 1) + '-' + Belt.cast(_.min([res.skip + res.limit, res.count]), 'string') + ' of ' + res.count);

    $('tbody').html(_.map(res.docs, function(d){
      d.options = d.options || {};
      return Templates.admin_product_list_row(d);
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
    phtml += '</div>';

    phtml += '<a href="/product/export.csv?limit=' + res.count
    //+ (res.sort ? '&sort=' + encodeURIComponent(JSON.stringify(res.sort)) : '')
    + (res.query ? '&query=' + encodeURIComponent(JSON.stringify(res.query)) : '')
    + '" class="btn btn-primary" style="margin-top:10px;">Export CSV</a>';

    $('[name="pagination"]').html(phtml);

    if (Belt.get(res.query, '_id')){
      $('[name="_id"] [name="filter"]').val(res.query._id);
    }

    if (Belt.get(res.query, 'name.$regex')){
      $('[name="name"] [name="filter"]').val(res.query.name.$regex.replace(/\\W\*/g, ' '));
    }

    if (Belt.get(res.query, 'categories.$regex')){
      $('[name="categories"] [name="filter"]').val(res.query.categories.$regex.replace(/\\W\*/g, ' '));
    }

    if (Belt.get(res.query, 'brands.$regex')){
      $('[name="brands"] [name="filter"]').val(res.query.brands.$regex.replace(/\\W\*/g, ' '));
    }

    if (Belt.get(res.query, 'options.values.us.$regex')){
      $('[name="options"] [name="filter"]').val(res.query.options.values.us.$regex.replace(/\\W\*/g, ' '));
    }

    if (Belt.get(res.query, '$or.0')){
      $('[name="content"] [name="filter"]').val(res.query.$or[0]['label.us'].$regex.replace(/\\W\*/g, ' '));
    }
  });
});
