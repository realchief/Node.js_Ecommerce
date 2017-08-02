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

var EscapeRegExp = function(val){
  return (val || '').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
};

var Instance = {};

Instance['toPercentage'] = function(val){
  val = Belt.cast(val, 'number') || 0;
  return (val * 100).toFixed(2);
};

$(document).ready(function(){
  GetCartCount();

  setInterval(function(){
    Belt.call($('.masonry-grid'), 'isotope', 'layout');
  }, 1000);
});

var ToggleLoader = function(show){
  if (show){
    $('.loader').removeClass('hidden-xs-up');
    $('body').addClass('overflow');
  }

  if (!show){
    $('.loader').addClass('hidden-xs-up');
    $('body').removeClass('overflow');
  }
};

var ToggleFooterLoader = function(show){
  if (show){
    $('#footer-loader').show();
    $('footer').hide();
  }

  if (!show){
    $('#footer-loader').hide();
    $('footer').show();
  }
};

var AppendToHash = function(obj){
  window.location.hash = window.location.hash ? window.location.hash + '&' + _.map(obj, function(v, k){
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&');
};

var GetHashObj = function(){

};
