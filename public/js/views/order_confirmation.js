if (GAEnabled()){
  _.each(GB.doc.products, function(p, i){
    var d = Belt.get(p, 'source.product');
    if (!d) return;

    ga('ec:addProduct', {
      'id': d._id
    , 'name': d.name || Belt.get(d, 'label.us')
    , 'category': Belt.get(d, 'categories.0') || d.auto_category
    , 'brand': (d.brands || []).join(', ')
    , 'variant': p.sku
    , 'price': p.price
    , 'quantity': p.quantity
    });
  });

  ga('ec:setAction', 'purchase', {
    'id': GB.doc.slug
  , 'revenue': GB.doc.total_price
  , 'tax': Belt.get(_.find(GB.doc.line_items, function(l){
      return l.type === 'tax';
    }), 'amount') || 0
  , 'shipping': 0
  , 'coupon': (_.find(GB.doc.line_items, function(l){
      return Belt.get(l, 'details.promo_code');
    }), 'details.promo_code')
  , 'option': Belt.get(GB, 'doc.buyer.subscriber') ? 'is_subscriber' : 'not_subscriber'
  });
}
