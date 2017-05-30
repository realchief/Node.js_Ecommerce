$(document).ready(function(){


  /* ======== Slick carousel initial ======== */
  $('.carousel').each(function() {
    $(this).slick({
      prevArrow: $(this).siblings('.gallery__arrow--prev'),
      nextArrow: $(this).siblings('.gallery__arrow--next'),
      dotsClass: "gallery__pagination"
    });
  });
  $('.carousel--billboard').each(function() {
    $(this).slick({
      prevArrow: $(this).siblings('.gallery__arrow--prev'),
      nextArrow: $(this).siblings('.gallery__arrow--next'),
      dotsClass: "gallery__pagination",
      slidesToShow: 3,
      slidesToScroll: 1,
      responsive: [
         {
          breakpoint: 767,
          settings: {
            slidesToShow: 1,
           }
         }
       ]
    });
  });
  $('.carousel--with-thumbnails').each(function() {
    $(this).slick({
      //fade: true,
      prevArrow: $(this).siblings('.gallery__arrow--prev'),
      nextArrow: $(this).siblings('.gallery__arrow--next'),
      dotsClass: "gallery__pagination",
      asNavFor: '.gallery__thumbnails'
    });
  });
  $('.gallery__thumbnails').slick({
	  slidesToShow: 5,
	  slidesToScroll: 1,
	  asNavFor: '.carousel--with-thumbnails',
    prevArrow: $(this).siblings('.gallery__arrow--prev'),
    nextArrow: $(this).siblings('.gallery__arrow--next'),
	  dots: false,
	  focusOnSelect: true,
		arrows: false,
    infinite: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          arrows: true,
          dots: true
        }
      }
    ]
	});
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    $('.carousel, .gallery__thumbnails').resize();
  });

  /* ======== Isotop masonry initial ======== */
  $('.masonry-grid').isotope({
    itemSelector: '.masonry-grid__item',
    percentPosition: true
  });
  $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
    $('.masonry-grid').isotope('layout');
  });

  /* ======== Sticky initial ======== */
  $(".sticky").stick_in_parent({
    sticky_class: 'sticky--top',
    offset_top: 0
  });

  /* ======== Close search box if Mobile menu is open ======== */
  $('.navbar-toggler').on('click', function(event) {
    $('body').toggleClass('navbase--is-open');
    $('body').removeClass('overflow');
    $('.searh-box').removeClass('searh-box--is-active');
  });

  /* ======== Content search form initial ======== */
  $('.nav-link--search-form-trigger').on('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
    $('.searh-box').toggleClass('searh-box--is-active');
    $('.searh-box .form-control').focus();
    $('body').toggleClass('overflow');
    $('body').removeClass('navbase--is-open');
    $('.navbar-collapse').removeClass('show');
  });
  $(window).click(function() {
    $('.searh-box').removeClass('searh-box--is-active');
    $('.searh-box__form .form-control').parent().removeClass("form-group--is-focus");
    $('.searh-box .form-control').val("");
    $('body').removeClass('overflow');
  });
  $('.searh-box__form').click(function(event){
    event.stopPropagation();
  });
  $(".searh-box__form .form-control").focus(function(){
    tmpval = $(this).val();
    if(tmpval == '') {
      $(this).parent().addClass("form-group--is-focus");
    }
  }).blur(function(){
    tmpval = $(this).val();
    if(tmpval == '') {
      $(this).parent().removeClass("form-group--is-focus");
    }
  })

  /* ======== Back to top button action ======== */
  $('.btn-scroll-top').click(function() {
    $('html, body').animate({ scrollTop: 0 }, 'slow');
    return false;
  });

  /* ======== Scroll animation initial ======== */
  AOS.init({
    disable: 'mobile'
  });


});

/* ======== Header scroll animation initial ======== */
var didScroll;
var lastScrollTop = 0;
var delta = 75;
var navbarHeight = $('header').outerHeight() - 1200;

$(window).scroll(function(event){
  didScroll = true;
});

setInterval(function() {
  if (didScroll) {
    hasScrolled();
    didScroll = false;
  }
}, 250);

function hasScrolled() {
  var st = $(this).scrollTop();

  // Make sure they scroll more than delta
  if(Math.abs(lastScrollTop - st) <= delta)
      return;

  // If they scrolled down and are past the navbar, add class .nav-up.
  // This is necessary so you never see what is "behind" the navbar.
  if (st > lastScrollTop && st > navbarHeight){
      // Scroll Down
    $('header').removeClass('headroom--pinned').addClass('headroom--unpinned');
    //Hide opened dropdow when header will hide
    $('body').find('.dropdown').removeClass('show');
    $('body').find('.dropdown-menu--large').addClass('hide');
  } else {
      // Scroll Up
    if(st + $(window).height() < $(document).height()) {
      $('header').removeClass('headroom--unpinned').addClass('headroom--pinned');
      $('body').find('.dropdown-menu--large').removeClass('hide');
    }
  }

  lastScrollTop = st;
}

$(window).scroll(function(event) {

  var scroll = $(window).scrollTop();

  /* ======== Show and hide on scroll back top top button ======== */
  if (scroll >= 500) {
    $('.btn-scroll-top').addClass('active');
  } else {
    $('.btn-scroll-top').removeClass('active');
  }

	/* ======== Header scroll animation ======== */
  //
  // if (scroll >= 25) {
  //   $(".header-regular").addClass("header--animate");
  // } else {
  //   $(".header-regular").removeClass("header--animate");
  // }
});
