if (typeof ga !== 'undefined' && _.isFunction(ga)){
  _.each(GB.products, function(d, i){
    ga('ec:addImpression', {
      'id': d._id
    , 'name': d.name || Belt.get(d, 'label.us')
    , 'category': Belt.get(d, 'categories.0') || d.auto_category
    , 'brand': (d.brands || []).join(', ')
    , 'variant': _.size(d.configurations) ? _.values(d.configurations)[0].sku : undefined
    , 'list': $('title').text()
    });
  });
}
