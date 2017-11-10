$(document).ready(function(){

  /* ======== Back to top button action ======== */
  $('.btn-scroll-top').click(function() {
    $('html, body').animate({ scrollTop: 0 }, 'slow');
    return false;
  });

});


/* ======== Header scroll animation initial ======== */
var didScroll;
var lastScrollTop = 0;
var delta = 160;
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
    $('.navbar').removeClass('navbar--pinned').addClass('navbar--unpinned');
    //Hide opened dropdow when header will hide
    //$('body').find('.dropdown').removeClass('show');
    $('body').find('.dropdown-menu--large').addClass('hide');
    $('.navbar-collapse').removeClass('show');
    $('.navbar-toggle').removeClass('open');
  } else {
      // Scroll Up
    if(st + $(window).height() < $(document).height()) {
      $('.navbar').removeClass('navbar--unpinned').addClass('navbar--pinned');
      $('body').find('.dropdown-menu--large').removeClass('hide');
    }
  }

  lastScrollTop = st;
}

$(window).scroll(function(event) {

  var scroll = $(window).scrollTop();


  /* ======== Add/hide box-shadow for nav ======== */
  if (scroll >= 20) {
    $('.navbar').addClass('navbar--shadow');
    $('body').addClass('navbar-bar-hidden');
  } else {
    $('.navbar').removeClass('navbar--shadow');
    $('body').removeClass('navbar-bar-hidden');
  }

  /* ======== Show and hide on scroll back top top button ======== */
  if (scroll >= 500) {
    $('.btn-scroll-top').addClass('active');
  } else {
    $('.btn-scroll-top').removeClass('active');
  }

});
