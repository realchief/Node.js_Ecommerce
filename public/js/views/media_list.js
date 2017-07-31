var LoadMedia = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //skip
    'limit': Belt.isMobile() ? 3 : 10
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
        if ($('[data-id="' + d._id + '"]').length) return;

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

var ThrottleLoadMedia = _.throttle(function(){
  if (!Belt.isNull(GB.count) && GB.skip >= GB.count) return;

  LoadMedia(GB, function(err, data){
    GB.skip += GB.limit;
    if (!Belt.isNull(data, 'count')) GB.count = data.count;
  });
}, 500, {
  'leading': true
, 'trailing': false
});

$(window).scroll(function() {
  if ($(window).scrollTop() + $(window).height() > $(document).height() - 400){
    ThrottleLoadMedia();
  }
});

ToggleFooterLoader(true);
ThrottleLoadMedia();
