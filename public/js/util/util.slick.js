$(document).ready(function(){

  $('.gallery').slick({
   slidesToShow: 1,
   slidesToScroll: 1,
   arrows: true,
   autoplay: true,
   autoplaySpeed: 3000000,
   lazyLoad: 'ondemand',
   fade: true,
   cssEase: 'linear'
  });

  $('.gallery__thumbnail').slick({
   autoplay: true,
   autoplaySpeed: 3000000,
   slidesToShow: 4,
   slidesToScroll: 1,
   dots: false,
   centerMode: false,
   focusOnSelect: true,
   lazyLoad: 'ondemand'
  });

  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    $('.gallery, .gallery__thumbnail').resize();
  });

});
