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

Instance['escapeRegExp'] = function(val){
  return (val || '').replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
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
GB['hash_query'] = _.extend({}, GB, queryObject.get(), GetHashObj());

var GetElementOffset = function(el){
  var top = 0
    , left = 0
    , height = $(el).height();

  do {
    top += el.offsetTop  || 0;
    left += el.offsetLeft || 0;
    el = el.offsetParent;
  } while(el);

  return {
    'top': top
  , 'left': left
  , 'height': height
  };
};

var GAEnabled = function(){
  return typeof ga !== 'undefined' && _.isFunction(ga) ? true : false;
};

var FBEnabled = function(){
  return typeof fbq !== 'undefined' && _.isFunction(fbq) ? true : false;
};

var FSEnabled = function(){
  return typeof FS !== 'undefined' && _.isFunction(FS) ? true : false;
};

if (GAEnabled()){
  $(document).on('click', 'a.product-link', function(e){
    e.preventDefault();

    var self = $(this);

    ga('ec:addProduct', {
      'id': self.attr('data-id')
    , 'name': self.attr('data-name')
    , 'category': self.attr('data-category')
    , 'brand': self.attr('data-brand')
    , 'price': Belt.cast(self.attr('data-price'), 'number')
    , 'variant': self.attr('data-sku')
    });
    ga('ec:setAction', 'click', {
      'list': $('title').text()
    });

    ga('send', 'event', 'ProductItem', 'click', $('title').text(), {
      'hitCallback': function() {
        document.location = self.attr('href');
      }
    });

    setTimeout(function(){
      document.location = self.attr('href');
    }, 500);
  });
}

var IsMobile = function(){
  return $('#is-mobile:visible').length ? true : false;
};
