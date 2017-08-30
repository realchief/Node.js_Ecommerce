var LoadProductFilter = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    //category
    //sort
    'limit': Belt.isMobile() ? 10 : 48
  });

  GB['product_filter'] = {
    'skip': a.o.skip ? Belt.cast(a.o.skip, 'number') || 0 : 0
  , 'limit': a.o.limit
  , 'query': _.extend({
      '_id': {
        '$in': GB.doc.products
      }
    , 'hide': {
        '$ne': true
      }
    , 'sync_hide': {
        '$ne': true
      }
    }, GB.doc.show_stock_outs ? {

    } : {
      'low_price': {
        '$exists': true
      }
    }, a.o.category ? {
      'categories': {
        '$regex': a.o.category
      , '$options': 'i'
      }
    } : {})
  , 'sort': a.o.sort || undefined
  };
};

LoadProductFilter(GB.hash_query);

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

var LoadSetProducts = function(options, callback){
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
        if (a.o.append && $('.product-item[data-id="' + d._id + '"]').length) return;

        html += '<div class="col-md-3 col-sm-4 col-6">'
              + Render('product_item', {
                  'doc': d
                })
              + '</div>'
      });

      $('[data-set="products"]')[a.o.append ? 'append' : 'html'](html);

      $('[data-set="set_listing_nav"]').html(
        Render('set_product_nav', _.extend({}, a.o, gb.data))
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

var MediaLoadQueue = Async.queue(function(task, callback){
  task(callback);
}, 1);

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

      if (a.o.sort) return cb();

      _.extend(a.o.query, {
        '_id': {
          '$in': GB.doc.media.slice(a.o.skip, a.o.skip + a.o.limit)
        }
      });

      $.post('/list/media.json', {
        'q': Belt.stringify(a.o.query)
      , 'sort': a.o.sort
      }, function(res){
        gb['data'] = Belt.get(res, 'data') || {};
        gb.data['count'] = GB.doc.media.length;

        gb.data.docs = _.sortBy(gb.data.docs, function(d){
          return _.findIndex(a.o.query._id.$in, function(i){
            return d._id === i;
          });
        });

        return cb();
      });
    }
  , function(cb){
      if (!a.o.sort) return cb();

      _.extend(a.o.query, {
        '_id': {
          '$in': GB.doc.media
        }
      });

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
      gb.data['load_count'] = 0;

      _.each(gb.data.docs, function(d){
        if ($('.media-item[data-id="' + d._id + '"]').length || !_.some(d.products, function(p){
          return Belt.get(p, 'product.low_price');
        })) return;

        var s = Render('media_item', {
          'doc': d
        , 'Instance': Instance
        });

        s = $(s);
        s.imagesLoaded(function(){
          MediaLoadQueue.push(function(cb2){
            if ($('.media-item[data-id="' + d._id + '"]').length) return cb2();

            gb.data.load_count++;

            $('.masonry-grid').isotope('insert', s);
            cb2();
          });
        });
      });

      cb();
    }
  ], function(err){
    ToggleFooterLoader();
    a.cb(err, gb.data);
  });
};

var ThrottleLoadSetProducts = _.throttle(function(){
  if (GB.product_filter.skip >= GB.product_filter.count) return;

  LoadSetProducts(_.extend({}, GB.product_filter, {
    'append': true
  }), function(err, data){
    GB.product_filter.skip += GB.product_filter.limit;
    if (!Belt.isNull(data, 'count')) GB.product_filter.count = data.count;
  });
}, 500, {
  'leading': true
, 'trailing': false
});

var ThrottleLoadSetMedia = _.throttle(function(){
  if (GB.media_filter.skip >= GB.media_filter.count) return;

  LoadSetMedia(_.extend({}, GB.media_filter, {
    'append': true
  }), function(err, data){
    GB.media_filter.skip += GB.media_filter.limit;
    if (!Belt.isNull(data, 'count')) GB.media_filter.count = data.count;

    if (data.load_count < GB.media_filter.limit) ThrottleLoadSetMedia();
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

  LoadProductFilter({
    'skip': 0
  });

  LoadSetProducts(GB.product_filter);
});

$('a[href="#shop-lifestyle-tab"]').on('shown.bs.tab', function(e){
  ExtendHash({
    'tab': 'lifestyle'
  });

  $('[data-set="set_listing_nav"]').html('');

  simple.scrollTo({
    'target': 'body'
  , 'animation': true
  , 'duration': 300
  , 'offset': {
      'y': 100
    }
  });

  ThrottleLoadSetMedia();
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > ($(document).height() * 0.66)){
    if (Belt.get(GetHashObj(), 'tab') === 'lifestyle'){
      ThrottleLoadSetMedia();
    } else {
      ThrottleLoadSetProducts();
    }
  }
});

$(document).ready(function(){
  if (Belt.get(GetHashObj(), 'tab') === 'lifestyle'){
    $('[href="#shop-lifestyle-tab"]').tab('show');
  } else {
    var h_skip = GetHashObj().skip ? true : false;

    LoadSetProducts(GB.product_filter, function(){
      //if (h_skip) GB.product_filter.skip = 0;
    });
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
