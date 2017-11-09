$(document).ready(function(){

  /* ======== Isotop masonry initial ======== */
  $('.masonry-grid').isotope({
    itemSelector: '.masonry-grid__item',
    percentPosition: true
  });
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    $('.masonry-grid').isotope('layout');
  });

});
