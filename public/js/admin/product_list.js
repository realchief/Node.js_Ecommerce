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
        cb();
      });
    }
  ], function(err){
    a.cb(err, gb);
  });
};

$(document).ready(function(){
  GB['criteria'] = _.defaults(queryObject.get() || {}, {
    'limit': 500
  , 'skip': 0
  , 'query': '{}'
  , 'sort': '{"_id": 1}'
  });

  GB.criteria.query = JSON.parse(GB.criteria.query);
  GB.criteria.sort = JSON.parse(GB.criteria.sort);

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

    $('tbody').html(_.map(res.docs, function(d){
      d.options = d.options || {};
      return Templates.admin_product_list_row(d);
    }).join('\n'));
  });
});
