$(document).ready(function(){
  GB['view'] = ProductView({

  });

  GB['product_id'] = document.location.pathname.split('/')[3];

  $.getJSON('/product/' + GB.product_id + '/read.json', function(json){
    if (Belt.get(json, 'error')) return bootbox.alert(json.error);

    GB.view.set(Belt.objFlatten(json.data));
  });
});
