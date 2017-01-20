$.fn.makeVisible = function(val){
  var b = Belt.cast(val, 'boolean');
  if (b){
    $(this).show();
  } else {
    $(this).hide();
  }
};

$.fn.makeChecked = function(val){
  var b = Belt.cast(val, 'boolean');
  $(this).prop('checked', b);
};

$.fn.radioVal = function(val){
  if (Belt.isNull(val)){
    return $(this).find('.active [type="radio"]').val();
  } else {
    $(this).find('[type="radio"]').parents('label').removeClass('active');
    $(this).find('[type="radio"][value="' + val + '"]').parents('label').addClass('active');
    return;
  }
};

$.fn.isVisible = function(){
  return $(this).is(':visible') ? true : false;
};

$.fn.isChecked = function(){
  return $(this).is(':checked') ? true : false;
};
