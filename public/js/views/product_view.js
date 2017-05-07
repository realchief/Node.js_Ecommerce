$(document).ready(function(){
  $(document).on('click', 'a[name="image_thumbnail"]', function(e){
    e.preventDefault();

    $('[name="main_image"]').attr('src', $(this).find('img').attr('src'));
  });

  $(document).on('click', '[name="image_pager"]', function(e){
    e.preventDefault();

    $('[name="image_pager"]').parents('li').removeClass('active');
    $('[name="main_image"]').attr('src', DOC.media[$(this).attr('data-index')].url);
    $('[name="main_image"]').attr('data-index', $(this).attr('data-index'));
  });

  $(document).on('click', '[name="next_image"]', function(e){
    e.preventDefault();

    var index = $('[name="main_image"]').attr('data-index');
console.log(DOC.media[index])
    if (!DOC.media[index]) index = 0;

    $('[name="image_pager"]').parents('li').removeClass('active');
    $('[name="image_pager"][data-index="' + index + '"]').parents('li').addClass('active');

    $('[name="main_image"]').attr('src', DOC.media[index].url);
    $('[name="main_image"]').attr('data-index', index);
  });

  $(document).on('click', '[name="option_value"]', function(e){
    e.preventDefault();

    $(this).parents('[name="option"]').find('[name="selected_option_value"]').html($(this).html());
  });
});
