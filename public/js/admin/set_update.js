$(document).ready(function(){
  GB['view'] = SetView({
    'method': 'update'
  , '_id': document.location.pathname.split('/')[3]
  });

  $.getJSON('/set/' + GB.view._id + '/read.json', function(json){
    if (Belt.get(json, 'error')) return bootbox.alert(json.error);

    GB.view.loadDoc({
      'doc': json.data
    });
  });
});
