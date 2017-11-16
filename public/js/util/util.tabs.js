$(document).ready(function(){

  /* ======== Product tab animation action ======== */
  $('.tabs-product__link--left').on("click", function(){
    $('.tabs-product').removeClass('tabs-product--animation-right')
    $('.tabs-product').addClass('tabs-product--animation-left')
  })
  $('.tabs-product__link--right').on("click", function(){
    $('.tabs-product').removeClass('tabs-product--animation-left')
    $('.tabs-product').addClass('tabs-product--animation-right')
  });

});
