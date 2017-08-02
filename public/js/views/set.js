GB['product_filter'] = {
  'skip': Belt.cast(GB.hash_query.skip, 'number') || 0
, 'limit': 20
, 'query': _.extend({
    '_id': {
      '$in': GB.doc.products
    }
  , 'hide': {
      '$ne': true
    }
  }, GB.hash_query.category ? {
    'categories': {
      '$regex': GB.hash_query.category
    , '$options': 'i'
    }
  } : {})
, 'sort': GB.hash_query.sort || undefined
};

GB['media_filter'] = {
  'skip': 0
, 'limit': true || Belt.isMobile() ? 6 : 10
, 'query': {
    '_id': {
      '$in': GB.doc.media
    }
  , 'hide': {
      '$ne': true
    }
  }
};

var ProductFilterQuery = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //query
  });
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
      ToggleFooterLoader(true);

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

      if (a.o.sort || Belt.get(a.o.query, 'categories.$regex')) return cb();

      _.extend(a.o.query, {
        '_id': {
          '$in': GB.doc.products.slice(a.o.skip, a.o.skip + a.o.limit)
        }
      });

      $.post('/list/products.json', {
        'q': Belt.stringify(a.o.query)
      , 'sort': a.o.sort
      }, function(res){
        gb['data'] = Belt.get(res, 'data') || {};
        gb.data['count'] = GB.doc.products.length;

        gb.data.docs = _.sortBy(gb.data.docs, function(d){
          return _.findIndex(a.o.query._id.$in, function(i){
            return d._id === i;
          });
        });

        return cb();
      });
    }
  , function(cb){
      if (!a.o.sort && !Belt.get(a.o.query, 'categories.$regex')) return cb();

      _.extend(a.o.query, {
        '_id': {
          '$in': GB.doc.products
        }
      });

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
  , function(cb){
      simple.scrollTo({
        'target': '[data-set="products"]'
      , 'animation': true
      , 'duration': 300
      , 'offset': {
          'y': 300
        }
      });

      cb();
    }
  ], function(err){
    ToggleFooterLoader();
    a.cb(err, gb.data);
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
      ToggleFooterLoader(true);

      $.post('/list/media.json', {
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
      var html = '';
      _.each(gb.data.docs, function(d){
        html += Render('media_item', {
                  'doc': d
                , 'Instance': Instance
                });
      });

      var $html = $(html);
      $html.imagesLoaded(function(){
        $('.masonry-grid').isotope('insert', $(html));
        cb();
      });
    }
  ], function(err){
    ToggleFooterLoader();
    a.cb(err, gb.data);
  });
};

var ThrottleLoadSetMedia = _.throttle(function(){
  if (GB.media_filter.skip >= GB.media_filter.count) return;

  LoadSetMedia(GB.media_filter, function(err, data){
    GB.media_filter.skip += GB.media_filter.limit;
    if (!Belt.isNull(data, 'count')) GB.media_filter.count = data.count;
  });
}, 500, {
  'leading': true
, 'trailing': false
});

$('a[href="#shop-product-tab"]').on('shown.bs.tab', function(e){
  var o = GetHashObj();
  delete o.category;
  o['tab'] = 'product';

  CreateHash(o);

  GB.product_filter = {
    'skip': 0
  , 'limit': 20
  , 'query': {
      '_id': {
        '$in': GB.doc.products
      }
    , 'hide': {
        '$ne': true
      }
    }
  };

  LoadSetProducts(GB.product_filter);
});

$('a[href="#shop-lifestyle-tab"]').on('shown.bs.tab', function(e){
  ExtendHash({'tab': 'lifestyle'});

  $('[data-set="pagination.desktop"]').html('');
  ThrottleLoadSetMedia();
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > ($(document).height() * 0.66)){
    ThrottleLoadSetMedia();
  }
});

$(document).ready(function(){
  if (Belt.get(GetHashObj(), 'tab') === 'lifestyle'){
    $('[href="#shop-lifestyle-tab"]').tab('show');
  } else {
    LoadSetProducts(GB.product_filter);
  }

  ThrottleLoadSetMedia();

  if (Belt.get(GetHashObj(), 'tab') === 'product'){
    $('[href="#shop-product-tab"]').tab('show');
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

    GB.product_filter.skip = 0;

    LoadSetProducts(GB.product_filter);
  });

  $(document).on('click', '[data-sort]', function(e){
    e.preventDefault();

    Belt.set(GB.product_filter, 'sort', $(this).attr('data-sort'));

    GB.product_filter.skip = 0;

    LoadSetProducts(GB.product_filter);
  });
});
