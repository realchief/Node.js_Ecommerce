$(document).on('click', '[name="cart_product_remove"]', function(e){
  e.preventDefault();

  try {
    ga('send', 'event', 'RemoveFromBag', 'click', $(this).attr('href'));
  } catch (e) {

  }

  $.getJSON($(this).attr('href'), function(){
    document.location.reload();
  });
});

var throtQtyUpdate = _.throttle(function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {

  });

  var prod = $(a.o.el).parents('[data-view="BagProductView"], [data-view="BagProductMobileView"]')
    , qty = prod.find('[data-get="quantity"]').val();

  try {
    ga('send', 'event', 'UpdateBag', 'click', prod, Belt.cast(qty, 'number'));
  } catch (e) {

  }

  $.getJSON('/cart/session/product/' + prod.attr('data-id') + '/quantity/' + qty + '/update.json', function(res){
    $('.alert').remove();

    if (Belt.get(res, 'error')){
      $('h1').after(Render('alert', {
        'alert_type': 'danger'
      , 'html': res.error
      }));
      prod.find('[data-get="quantity"]').val(Belt.get(res, 'data.old_quantity') || 1);
      return;
    }

    document.location.reload();
  });
}, 300, {
  'leading': false
, 'trailing': true
})

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
