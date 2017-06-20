$('a[href="#shop-product-tab"]').on('shown.bs.tab', function(e){
  window.location.hash = 'product';
});

$('a[href="#shop-lifestyle-tab"]').on('shown.bs.tab', function(e){
  window.location.hash = 'lifestyle';
});

$(document).ready(function(){
  if (window.location.hash === '#lifestyle'){
    $('[href="#shop-lifestyle-tab"]').tab('show');
  }

  if (window.location.hash === '#product'){
    $('[href="#shop-product-tab"]').tab('show');
  }
});
