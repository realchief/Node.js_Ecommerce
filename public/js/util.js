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

var EscapeRegExp = function(val){
  return (val || '').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
};

var Instance = {};

Instance['priceString'] = function(val){
  val = Belt.cast(val, 'number');
  if (!val) return '0';
  if (Math.floor(val) === val) return Belt.cast(val, 'string');

  return val.toFixed(2);
};

Instance['toPercentage'] = function(val){
  val = Belt.cast(val, 'number') || 0;
  return (val * 100).toFixed(2);
};


Instance['paginationUrl'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //sort
    //skip
  });

  var url = document.location.href
    , qs = ParseQueryString(url.split('?')[1] || '') || {};

  url = url.replace(/\?.*$/, '');

  if (!Belt.isNull(a.o.skip)){
    qs['skip'] = a.o.skip;
  }
  if (!Belt.isNull(a.o.sort)){
    qs['sort'] = a.o.sort;
  }

  url += '?' + CreateQueryString(qs);

  return url;
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

var ParseQueryString = function(str){
  var query = {};
  var a = (str[0] === '?' ? str.substr(1) : str).split('&');
  for (var i = 0; i < a.length; i++) {
    var b = a[i].split('=');
    query[decodeURIComponent(b[0])] = decodeURIComponent(b[1] || '');
  }
  return Belt.objDefalse(query);
};

var CreateQueryString = function(obj){
  return _.map(obj, function(v, k){
    return encodeURIComponent(k) + '=' + encodeURIComponent(v);
  }).join('&');
};

var CreateHash = function(obj){
  window.location.hash = CreateQueryString(obj);
};

var ExtendHash = function(obj){
  var o = _.extend({}, GetHashObj(), obj);

  CreateHash(o);
};

var GetHashObj = function(){
  return ParseQueryString((window.location.hash || '').replace(/^#/, ''));
};

var GB = GB || {};
GB['hash_query'] = _.extend({}, queryObject.get(), GetHashObj());

$(function() {
  Belt.get($('.lazy'), 'lazy()');
});
