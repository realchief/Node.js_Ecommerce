$(document).ready(function(){

  /* ======== Mobile menu button trigger action ======== */
  $('.navbar-toggle').click(function(e) {
    $(this).toggleClass('open');
    // workaround that is fixed with bootstrap v4.0.0-beta - after update test and remove this
    $(e.currentTarget).css('pointer-events', 'none');
    setTimeout(function() {
	  $(e.currentTarget).css('pointer-events', 'all');
    }, 500);
  });

});
