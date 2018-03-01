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
    'skip': typeof a.o.skip != 'undefined' ? Belt.cast(a.o.skip, 'number') || 0 : 0
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
        '$gt': 0
      }
    }, a.o.category ? {
      '$or': [
        {
          'categories': {
            '$regex': Instance.escapeRegExp(a.o.category)
          , '$options': 'i'
          }
        }
      , {
          'auto_category': {
            '$regex': Instance.escapeRegExp(a.o.category)
          , '$options': 'i'
          }
        }
      ]
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
      //delete hash.category;
      delete hash.sort;

      ExtendHash(_.extend(typeof a.o.skip != 'undefined' ? {
        'skip': a.o.skip
      } : {}, a.o.sort ? {
        'sort': a.o.sort
      } : {}, Belt.get(a.o.query, '$or.0.categories.$regex') ? {
        'category': a.o.query.$or[0].categories.$regex
      } : {}));

      if (a.o.sort || Belt.get(a.o.query, '$or.0.categories.$regex')) return cb();

      _.extend(a.o.query, {
        '_id': {
          '$in': Belt.copy(GB.doc.products).slice(a.o.skip, a.o.skip + a.o.limit)
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
      if (!a.o.sort && !Belt.get(a.o.query, '$or.0.categories.$regex')) return cb();

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

        if (GAEnabled()){
          ga('ec:addImpression', {
            'id': d._id
          , 'name': d.name || Belt.get(d, 'label.us')
          , 'category': Belt.get(d, 'categories.0') || d.auto_category
          , 'brand': (d.brands || []).join(', ')
          , 'variant': _.size(d.configurations) ? _.values(d.configurations)[0].sku : undefined
          , 'list': $('title').text()
          , 'position': a.o.skip + gb.data.load_count
          });
        }

        if (false && FBEnabled()){
          fbq('track', 'ViewContent', {
            'content_ids': [
              d._id
            ]
          , 'content_category': $('title').text()
          , 'content_type': 'product_group'
          });
        }
      });

      $('[data-set="products"]')[a.o.append ? 'append' : 'html'](html);

      $('[data-set="set_listing_nav"]:not(".bottom")').html(
        Render('set_product_nav', _.extend({

        }, a.o, gb.data))
      );

      $('[data-set="set_listing_nav"].bottom').html(
        Render('set_product_nav', _.extend({
          'hide_sort': true
        }, a.o, gb.data))
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

    $('.lazy').lazy();

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

    if (GB.product_filter.skip <= GB.product_filter.count && data.load_count < GB.product_filter.limit) ThrottleLoadSetProducts();
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

    if (GB.media_filter.skip <= GB.media_filter.count && data.load_count < GB.media_filter.limit) ThrottleLoadSetMedia();
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

  if (GAEnabled()) ga('send', 'event', 'SetView', 'show products');

  if (FBEnabled()){
    fbq('trackCustom', 'show products', {

    });
  }
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

  if (GAEnabled()) ga('send', 'event', 'SetView', 'show lifestyle');

  if (FBEnabled()){
    fbq('trackCustom', 'show lifestyle', {

    });
  }
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > ($(document).height() * 0.66)){
    if (Belt.get(GetHashObj(), 'tab') === 'lifestyle'){
      ThrottleLoadSetMedia();
    } else {
      //ThrottleLoadSetProducts();
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

    if (GAEnabled()) ga('send', 'event', 'SetView', 'select product page', GB.product_filter.skip);

    if (FBEnabled()){
      fbq('trackCustom', 'select product page', {
        'status': GB.product_filter.skip
      });
    }
  });

  $(document).on('click', 'a[data-category]:not(".product-link")', function(e){
    e.preventDefault();

    var cat = $(this).attr('data-category');

    if (cat.indexOf('>') != -1) {
      $(this).closest('.card.product-filter-item').find('.product-filter-item__toggle').addClass('collapsed');
      $(this).closest('.collapse.show').removeClass('show');
    } else if ($(this).attr('class').indexOf('collapsed') !== -1) {
      return;
    }

    Belt.set(GB.product_filter, 'query.$or', [
      {
        'categories': {
          '$regex': Instance.escapeRegExp(cat)
        , '$options': 'i'
        }
      }
    , {
        'auto_category': {
          '$regex': Instance.escapeRegExp(cat)
        , '$options': 'i'
        }
      }
    ]);

    GB.product_filter.skip = 0;

    LoadSetProducts(GB.product_filter, function(){
      ExtendHash({
        'category': cat
      });
    });

    if (GAEnabled()) ga('send', 'event', 'SetView', 'select product category', cat);

    if (FBEnabled()){
      fbq('trackCustom', 'select product category', {
        'status': cat
      });
    }
  });

  $(document).on('click', '[data-sort]:not(".product-link")', function(e){
    e.preventDefault();

    Belt.set(GB.product_filter, 'sort', $(this).attr('data-sort'));

    GB.product_filter.skip = 0;

    LoadSetProducts(GB.product_filter);

    if (GAEnabled()) ga('send', 'event', 'SetView', 'select product sort', GB.product_filter.sort);

    if (FBEnabled()){
      fbq('trackCustom', 'select product sort', {
        'status': GB.product_filter.sort
      });
    }
  });
});
