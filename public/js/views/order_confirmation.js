if (GAEnabled()){

  window.renderOptIn = function() {
      window.gapi.load('surveyoptin', function() {
          var date = new Date();
          date.setDate(date.getDate() + 30);
          var d = date.getDate();
          var m = date.getMonth() + 1;
          var y = date.getFullYear();

          window.gapi.surveyoptin.render(
              {
                  "merchant_id": 118193082
                  , "order_id": GB.doc._id
                  , "email": GB.doc.buyer.email
                  , "delivery_country": GB.doc.buyer.country
                  , "estimated_delivery_date": y + '-' + (m < 10 ? '0' + m : m) + '-' + (d < 10 ? '0' + d : d)
              });
      });
  };
  window.___gcfg = {
      lang: 'en_US'
  };
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

if (FBEnabled()){
  fbq('track', 'Purchase', {
    'contents': _.map(GB.doc.products, function(p){
      return {
        'id': p.sku
      , 'quantity': p.quantity
      , 'item_price': p.price
      };
    })
  , 'content_ids': _.pluck(GB.doc.products, 'sku')
  , 'content_type': 'product'
  , 'value': GB.doc.total_price
  , 'currency': 'USD'
  , 'num_items': GB.doc.products.length
  });
}

if (FSEnabled()){
  FS.setUserVars({
    'purchase_real': GB.doc.total_price
  });
}
