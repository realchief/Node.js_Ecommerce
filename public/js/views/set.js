GB['product_filter'] = {
  'skip': 0
, 'limit': 50
, 'query': {
    '_id': {
      '$in': GB.doc.products
    }
  , 'hide': {
      '$ne': true
    }
  }
};

GB['media_filter'] = {
  'skip': 0
, 'limit': 50
, 'query': {
    '_id': {
      '$in': GB.doc.media
    }
  , 'hide': {
      '$ne': true
    }
  }
};

var LoadSetProducts = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    //limit
    'query': {}
  });

  Async.waterfall([
    function(cb){
      ToggleLoader(true);

      $.post('/list/products.json', {
        'limit': a.o.limit
      , 'skip': a.o.skip
      , 'q': Belt.stringify(a.o.query)
      }, function(res){
        gb['data'] = Belt.get(res, 'data') || {};

        return cb();
      });
    }
  , function(cb){
      var html = '';
      _.each(gb.data.docs, function(d){
        html += '<div class="col-md-3 col-sm-4 col-6">'
              + Render('product_item', {
                  'doc': d
                })
              + '</div>'
      });

      $('[data-set="products"]').html(html);

      $('[data-set="pagination.desktop"]').html(
        Render('set-product-pagination', _.extend({}, a.o, gb.data))
      );

      cb();
    }
  ], function(err){
    ToggleLoader();
  });
};

var LoadSetMedia = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    'limit': 10
  , 'query': {}
  });

  Async.waterfall([
    function(cb){
      ToggleLoader(true);

      $.post('/list/media.json', {
        'limit': a.o.limit
      , 'skip': a.o.skip
      , 'q': Belt.stringify(a.o.query)
      }, function(res){
        gb['data'] = Belt.get(res, 'data') || {};

        return cb();
      });
    }
  , function(cb){
      var html = '';
      _.each(gb.data.docs, function(d){
        html += Render('media_item', {
                  'doc': d
                , 'Instance': Instance
                });
      });

      $('.masonry-grid').append(html).isotope('layoutItems', html);

      cb();
    }
  ], function(err){
    ToggleLoader();
  });
};

$('a[href="#shop-product-tab"]').on('shown.bs.tab', function(e){
  window.location.hash = 'product';
  LoadSetProducts(GB.product_filter);
});

$('a[href="#shop-lifestyle-tab"]').on('shown.bs.tab', function(e){
  window.location.hash = 'lifestyle';
});

$(document).ready(function(){
  if (window.location.hash === '#lifestyle'){
    $('[href="#shop-lifestyle-tab"]').tab('show');
  } else {
    LoadSetProducts(GB.product_filter);
  }

  if (window.location.hash === '#product'){
    $('[href="#shop-product-tab"]').tab('show');
    LoadSetProducts(GB.product_filter);
  }

  $(document).on('click', 'a.page-link[data-index]', function(e){
    e.preventDefault();

    GB.product_filter.skip = (Belt.cast($(this).attr('data-index'), 'number') - 1) * GB.product_filter.limit;

    LoadSetProducts(GB.product_filter);
  });

  $(document).on('click', 'a[data-category]', function(e){
    e.preventDefault();

    Belt.set(GB.product_filter, 'query.categories', {
      '$regex': $(this).attr('data-category')
    , '$options': 'i'
    });

    LoadSetProducts(GB.product_filter);
  });
});
