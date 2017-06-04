$(document).on('click', '[name="cart_product_remove"]', function(e){
  e.preventDefault();

  $.getJSON($(this).attr('href'), function(){
    document.location.reload();
  });
});

$(document).on('click', '[name="cart_product_save"]', function(e){
  e.preventDefault();

  var prod = $(this).parents('[data-view="BagProductView"], [data-view="BagProductMobileView"]')
    , qty = prod.find('[data-get="quantity"]').val();

  $.getJSON('/cart/session/product/' + prod.attr('data-id') + '/quantity/' + qty + '/update.json', function(){
    document.location.reload();
  });
});
