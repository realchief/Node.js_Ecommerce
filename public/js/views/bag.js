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

$(document).on('click', '[name="cart_product_save"]', function(e){
  e.preventDefault();

  var prod = $(this).parents('[data-view="BagProductView"], [data-view="BagProductMobileView"]')
    , qty = prod.find('[data-get="quantity"]').val();

  try {
    ga('send', 'event', 'UpdateBag', 'click', prod, Belt.cast(qty, 'number'));
  } catch (e) {

  }

  $.getJSON('/cart/session/product/' + prod.attr('data-id') + '/quantity/' + qty + '/update.json', function(){
    document.location.reload();
  });
});
