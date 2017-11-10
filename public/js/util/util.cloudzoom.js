$(document).ready(function(){

  /* ======== Cloudzoom initial inside Slick gallery ======== */
  $('.gallery').on('lazyLoaded', function(event, slick, image, imageSource){
    if (!IsMobile()) $(image).CloudZoom({
      zoomPosition: 'inside',
      autoInside: true,
      //zoomFlyOut: false,
      animationTime: 500,
      touchStartDelay: true
    });
  });

});
