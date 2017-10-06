$(document).on('click', '[name="cart_product_remove"]', function(e){
  e.preventDefault();

  ToggleLoader(true);

  var self = $(this);

  if (GAEnabled()){
    ga('ec:addProduct', {
      'id': self.attr('data-id')
    , 'name': self.attr('data-name')
    , 'category': self.attr('data-category')
    , 'brand': self.attr('data-brand')
    , 'price': Belt.cast(self.attr('data-price'), 'number')
    , 'quantity': Belt.cast(self.attr('data-quantity'), 'number')
    , 'variant': self.attr('data-sku')
    });
    ga('ec:setAction', 'remove');
    ga('send', 'event', 'BagView', 'remove product');
  }

  $.getJSON($(this).attr('href'), function(){
    document.location.reload();
  });
});

var throtQtyUpdate = _.throttle(function(options, callback){
//var throtQtyUpdate = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {

  });

  ToggleLoader(true);

  var prod = $(a.o.el).parents('[data-view="BagProductView"], [data-view="BagProductMobileView"]')
    , qty = prod.find('[data-get="quantity"]').val();

  if (GAEnabled()){
    ga('ec:addProduct', {
      'id': prod.attr('data-sku') || prod.attr('data-product-id')
    , 'name': prod.attr('data-name')
    , 'category': prod.attr('data-category')
    , 'brand': prod.attr('data-brand')
    , 'price': Belt.cast(prod.attr('data-price'), 'number')
    , 'quantity': qty
    , 'variant': prod.attr('data-sku')
    });
    ga('ec:setAction', 'add');
    ga('send', 'event', 'BagView', 'update product quantity');
  }

  $.getJSON('/cart/session/product/' + prod.attr('data-id') + '/quantity/' + qty + '/update.json', function(res){
    $('.alert').remove();

    if (Belt.get(res, 'error')){
      $('h1').after(Render('alert', {
        'alert_type': 'danger'
      , 'html': res.error
      }));
      prod.find('[data-get="quantity"]').val(Belt.get(res, 'data.old_quantity') || 1);

      ToggleLoader();

      return;
    }

    document.location.reload();
  });
//};

}, 300, {
  'leading': false
, 'trailing': true
});

$(document).on('change keyup', '[data-get="quantity"]', function(e){
  e.preventDefault();

  throtQtyUpdate({
    'el': $(this)
  });
});

$(document).on('click', '[name="cart_product_save"]', function(e){
  e.preventDefault();

  throtQtyUpdate({
    'el': $(this)
  });
});
