$.fn.makeVisible = function(val){
  var b = Belt.cast(val, 'boolean');
  if (b){
    $(this).show();
  } else {
    $(this).hide();
  }
};

$.fn.makeChecked = function(val){
  var b = Belt.cast(val, 'boolean');
  $(this).prop('checked', b);
};

$.fn.radioVal = function(val){
  if (Belt.isNull(val)){
    return $(this).find('.active [type="radio"]').val();
  } else {
    $(this).find('[type="radio"]').parents('label').removeClass('active');
    $(this).find('[type="radio"][value="' + val + '"]').parents('label').addClass('active');
    return;
  }
};

$.fn.isVisible = function(){
  return $(this).is(':visible') ? true : false;
};

$.fn.isChecked = function(){
  return $(this).is(':checked') ? true : false;
};

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
        $('[name="cart"]').removeClass('hidden-xs-up');
      } else {
        $('[name="cart"]').addClass('hidden-xs-up');
      }

      cb();
    }
  ], function(err){
    a.cb(err);
  });
};

$(document).ready(function(){
  GetCartCount();

  setInterval(function(){
    Belt.call($('.masonry-grid'), 'isotope', 'layout');
  }, 1000);
});
