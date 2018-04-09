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
      // console.log(res.docs);
      $('tbody').html(_.map(res.docs, function(d){
        d.options = d.options || {};
        d.Instance = Instance;
        d.GB = GB;
        // console.log(d.products[0]);
        // console.log(d.products[0].source);
        // console.log(d.products[0].source.product);

        return Templates['admin_' + GB.model + '_list_row'](d);
      }).join('\n'));

    });
  });
});
