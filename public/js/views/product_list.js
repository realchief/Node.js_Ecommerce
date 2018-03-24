GB['index'] = GB.skip;

var LoadProductFilter = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    //category
    //sort
    'limit': Belt.isMobile() ? 24 : 24
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

        /*html += '<div class="col-md-3 col-sm-4 col-6">'
              + Render('product_item', {
                  'doc': d
                })
              + '</div>';*/

        var $el = $('<div class="col-md-3 col-sm-4 col-6">'
                      + Render('product_item', {
                        'doc': d
                      , 'index': GB.index++
                      })
                    + '</div>');

        $('[data-set="products"]')[a.o.append ? 'append' : 'html']($el);
      });

      //$('[data-set="products"]')[a.o.append ? 'append' : 'html'](html);

      /*
      $('[data-set="product_listing_nav"]').html(
        Render('product_list_nav', _.extend({}, a.o, gb.data, {
          'Locals': _.extend({}, a.o, gb.data)
        , 'Instance': Instance
        }))
      );
      */

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

GB['product_coordinates'] = {};

var GetProductCoordinates = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {

  });

  $('.product-item').each(function(i, e){
    GB.product_coordinates[e.getAttribute('data-index')] = GetElementOffset(e);
  });

  var doc = document.documentElement
    , top = (window.pageYOffset || doc.scrollTop)  - (doc.clientTop || 0);

  GB['scroll_index'] = _.chain(GB.product_coordinates)
                        .pick(function(v, k){
                           return (v.height + v.top) >= top;
                         })
                        .keys()
                        .min(function(k){
                           return k;
                         })
                        .value();

  GB.scroll_index = Belt.cast(GB.scroll_index, 'number');

  $('[data-set="product_listing_nav"]').html(
    Render('product_list_nav', _.extend({
      'count': Infinity
    }, a.o, GB.product_filter, {
      'skip': GB.scroll_index
    , 'Locals': _.extend({
        'count': Infinity
      }, a.o, GB.product_filter, {
        'skip': GB.scroll_index
      })
    , 'Instance': Instance
    }))
  );
};

var ThrottleGetProductCoordinates = _.throttle(function(){
  GetProductCoordinates();
}, 250, {
  'leading': true
, 'trailing': false
});

/*setInterval(function(){
  GetProductCoordinates();
}, 300);*/

$(window).scroll(function() {
  /*if ($(window).scrollTop() + $(window).height() > ($(document).height() * 0.66)){
    ThrottleLoadProducts();
  }
  ThrottleGetProductCoordinates();*/
});

$(document).ready(function(){

});

if (GAEnabled()){
  _.each(GB.docs, function(d, i){
    ga('ec:addImpression', {
      'id': d._id
    , 'name': d.name || Belt.get(d, 'label.us')
    , 'category': Belt.get(d, 'categories.0') || d.auto_category
    , 'brand': (d.brands || []).join(', ')
    , 'list': $('title').text()
    , 'price': _.size(d.configurations) ? _.values(d.configurations)[0].price : d.low_price
    , 'variant': _.size(d.configurations) ? _.values(d.configurations)[0].sku : undefined
    , 'position': GB.skip - 48 + i + 1
    });
  });
}

if (FBEnabled()){
  if ($('.search-result__subtitle').text().match(/search/i)){
    fbq('track', 'Search', {
      'content_ids': _.pluck(GB.docs, '_id')
    , 'content_type': 'product_group'
    , 'search_string': $('.search-result__subtitle').text().replace(/"|search results/ig, '')
    });
  } else if (false) {
    fbq('track', 'ViewContent', {
      'content_ids': _.pluck(GB.docs, '_id')
    , 'content_category': $('.search-result__subtitle').text()
    , 'content_type': 'product_group'
    });
  }
}
