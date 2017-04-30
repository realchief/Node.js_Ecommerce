$(document).ready(function(){
  GB['view'] = ProductView({
    'method': 'update'
  , '_id': document.location.pathname.split('/')[3]
  });

  $.getJSON('/product/' + GB.view._id + '/read.json', function(json){
    if (Belt.get(json, 'error')) return bootbox.alert(json.error);

    GB.view.loadDoc({
      'doc': json.data
    });
  });
});
