var LoadProductFilter = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    //category
    //sort
    'limit': Belt.isMobile() ? 48 : 48
  });

  GB['product_filter'] = {
    'skip': a.o.skip ? Belt.cast(a.o.skip, 'number') || 0 : 0
  , 'limit': a.o.limit
  , 'query': _.extend({
      'hide': {
        '$ne': true
      }
    , 'sync_hide': {
        '$ne': true
      }
    , 'low_price': {
        '$gt': 0
      }
    }, a.o.query ? a.o.query : {})
  , 'sort': a.o.sort || undefined
  };
};

LoadProductFilter(GB);

var LoadProducts = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    //limit
    'query': {}
  , 'append': false
  });

  Async.waterfall([
    function(cb){
      ToggleFooterLoader(true);

/*
      var hash = GetHashObj();
      delete hash.skip;
      delete hash.category;
      delete hash.sort;

      CreateHash(_.extend(a.o.skip ? {
        'skip': a.o.skip
      } : {}, a.o.sort ? {
        'sort': a.o.sort
      } : {}, Belt.get(a.o.query, 'categories.$regex') ? {
        'category': a.o.query.categories.$regex
      } : {}));
*/

      $.post('/list/products.json', {
        'limit': a.o.limit
      , 'skip': a.o.skip
      , 'q': Belt.stringify(a.o.query)
      , 'sort': a.o.sort
      }, function(res){
        gb['data'] = Belt.get(res, 'data') || {};

        return cb();
      });
    }
  , function(cb){
      gb.data['load_count'] = 0;

      var html = '';
      _.each(gb.data.docs, function(d){
        gb.data.load_count++;

        if (a.o.append && $('.product-item[data-id="' + d._id + '"]').length || !d.low_price) return;

        html += '<div class="col-md-3 col-sm-4 col-6">'
              + Render('product_item', {
                  'doc': d
                })
              + '</div>'
      });

      $('[data-set="products"]')[a.o.append ? 'append' : 'html'](html);

      $('[data-set="product_listing_nav"]').html(
        Render('product_list_nav', _.extend({}, a.o, gb.data, {
          'Locals': _.extend({}, a.o, gb.data)
        , 'Instance': Instance
        }))
      );

      cb();
    }
  , function(cb){
      if (a.o.append) return cb();

      simple.scrollTo({
        'target': 'body'
      , 'animation': true
      , 'duration': 300
      , 'offset': {
          'y': 100
        }
      });

      cb();
    }
  ], function(err){
    ToggleFooterLoader();
    a.cb(err, gb.data);
  });
};

var ThrottleLoadProducts = _.throttle(function(){
  if (GB.product_filter.skip >= GB.product_filter.count) return;

  LoadProducts(_.extend({}, GB.product_filter, {
    'append': true
  }), function(err, data){
    GB.product_filter.skip += GB.product_filter.limit;
    if (!Belt.isNull(data, 'count')) GB.product_filter.count = data.count;
  });
}, 500, {
  'leading': true
, 'trailing': false
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > ($(document).height() * 0.66)){
    ThrottleLoadProducts();
  }
});

$(document).ready(function(){

});
