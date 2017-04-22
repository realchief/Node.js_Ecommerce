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
      $.post('/product/list.json', a.o, function(json){
        if (Belt.get(json, 'error')) return cb(new Error(json.error));

        gb['docs'] = Belt.get(json, 'data');
        cb();
      });
    }
  ], function(err){
    a.cb(err, gb.docs);
  });
};

$(document).ready(function(){
  LoadProducts(function(err, docs){
    if (err) return bootbox.alert(err.message);

    $('tbody').html(_.map(docs, function(d){
      return Templates.admin_product_list_row(d);
    }).join('\n'));
  });
});
