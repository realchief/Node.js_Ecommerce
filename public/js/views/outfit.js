if (typeof ga !== 'undefined' && _.isFunction(ga)){
  _.each(GB.products, function(d, i){
    ga('ec:addImpression', {
      'id': d._id
    , 'name': d.name || Belt.get(d, 'label.us')
    , 'category': Belt.get(d, 'categories.0') || d.auto_category
    , 'brand': (d.brands || []).join(', ')
    , 'list': $('title').text()
    });
  });
}
