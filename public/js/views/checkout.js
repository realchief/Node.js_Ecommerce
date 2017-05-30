$(document).on('click', '[name="cart_product_remove"]', function(e){
  e.preventDefault();

  $.getJSON($(this).attr('href'), function(){
    document.location.reload();
  });
});
