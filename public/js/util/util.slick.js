$(document).ready(function(){

  $('.gallery').slick({
   slidesToShow: 1,
   slidesToScroll: 1,
   'swipeToSlide': true,
   'touchThreshold': 20,
   arrows: true,
   autoplay: true,
   autoplaySpeed: 3000000,
   lazyLoad: 'ondemand',
   fade: true,
   cssEase: 'linear',
   dots: true,
   responsive: [
    {
      breakpoint: 767,
      settings: {
        fade: false,
        speed: 200
      }
    }
   ]
  });

  $('.gallery__thumbnail').slick({
   autoplay: true,
   autoplaySpeed: 3000000,
   slidesToShow: 4,
   slidesToScroll: 1,
   'swipeToSlide': true,
   'touchThreshold': 20,
   dots: false,
   centerMode: false,
   focusOnSelect: true,
   lazyLoad: 'ondemand'
  });

  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    $('.gallery, .gallery__thumbnail').resize();
  });

});
