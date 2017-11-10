
var GetCartCount = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {

  });

  Async.waterfall([
    function(cb){
      $.getJSON('/cart/session/read.json', function(res){
        gb['products'] = Belt.get(res, 'data.products') || [];

        cb();
      });
    }
  , function(cb){
      $('[data-set="cart_product_count"]').html(gb.products.length);

      if (gb.products.length){
        $('[name="cart"] a').attr('href', '/bag');
        $('[name="cart"] [data-set="cart_product_count"]').removeClass('hidden-xs-up');

      } else {
        $('[name="cart"] a').attr('href', '#');
        $('[name="cart"] [data-set="cart_product_count"]').addClass('hidden-xs-up');
      }

      cb();
    }
  ], function(err){
    a.cb(err, gb.products);
  });
};

$(document).ready(function(){
  GetCartCount();
});
