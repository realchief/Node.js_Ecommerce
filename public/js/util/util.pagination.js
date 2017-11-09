$(document).ready(function(){

  /* ======== Show/hide pagination on setmember page ======== */
  $('.btn-filter-hide-pagination').on('click', function(event) {
    event.preventDefault();
    $('.pagination--shop-product').addClass('hide');
  });
  $('.btn-filter-show-pagination').on('click', function(event) {
    event.preventDefault();
    $('.pagination--shop-product').removeClass('hide');
  });

});
