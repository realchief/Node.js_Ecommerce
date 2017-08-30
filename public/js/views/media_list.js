var MediaLoadQueue = Async.queue(function(task, callback){
  task(callback);
}, 1);

var LoadMedia = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    'limit': true || Belt.isMobile() ? 6 : 10
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
      _.each(gb.data.docs, function(d){
        var s = Render('media_item', {
          'doc': d
        , 'Instance': Instance
        });

        s = $(s);

        gb.data['load_count'] = 0;

        s.imagesLoaded(function(){
          MediaLoadQueue.push(function(cb2){
            if ($('.media-item[data-id="' + d._id + '"]').length || !_.some(d.products, function(p){
              return Belt.get(p, 'product.low_price');
            })) return cb2();

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

var ThrottleLoadMedia = _.throttle(function(){
  if (!Belt.isNull(GB.count) && GB.skip >= GB.count) return;

  LoadMedia(GB, function(err, data){
    GB.skip += GB.limit;
    if (!Belt.isNull(data, 'count')) GB.count = data.count;

    if (data.load_count < GB.limit) LoadMedia(GB);
  });
}, 500, {
  'leading': true
, 'trailing': false
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > ($(document).height() * 0.66)){
    ThrottleLoadMedia();
  }
});

ToggleFooterLoader(true);

ThrottleLoadMedia();
