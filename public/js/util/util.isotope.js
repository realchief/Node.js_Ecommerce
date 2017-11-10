$(document).ready(function(){

  /* ======== Isotop masonry initial ======== */
  $('.masonry-grid').isotope({
    itemSelector: '.masonry-grid__item',
    percentPosition: true
  });
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    $('.masonry-grid').isotope('layout');
  });

  setInterval(function(){
    Belt.call($('.masonry-grid'), 'isotope', 'layout');
  }, 1000);
});
