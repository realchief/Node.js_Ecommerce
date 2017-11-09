$(document).ready(function(){

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
    $('.navbar-toggle').removeClass('open');
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
  $('.searh-box__close').on('click', function(event) {
    event.preventDefault();
    event.stopPropagation();
    $('.searh-box').removeClass('searh-box--is-active');
    $('body').removeClass('overflow');
    $('body').removeClass('navbase--is-open');
    $('.navbar-collapse').removeClass('show');
  });

});
