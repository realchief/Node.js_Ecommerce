var ProductView = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('[data-view="ProductView"]')
  , 'triggers': {
      'submit form': function(e){
        e.preventDefault();
      }
    , 'click [data-option] a.dropdown-item': function(e){
        e.preventDefault();

        var $el = $(e.currentTarget)
          , val = $el.contents().not($el.children()).text()
          , button = $el.parents('.form-group').find('button');
        // TODO change css to remove/add classes
        $el.css('color', '#616161');
        button.html(val);
        button.data('value', val);

        this.emit('options:update', $el.data('option'), $el.data('value'));
      }
    , 'click [name="add_to_bag"]:not(.disabled)': function(e){
        e.preventDefault();

        this.throttledAddToBag();
      }
    }
  , 'transformers': {
      'trim': function(val){
        return Str.trim(val || '');
      }
    }
  , 'events': {
      'options:update': function(option, value){
        this.throttledGetAvailability(option, value);
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['getAvailability'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'available_quantity': 1
    , 'options': self.get().options || {}
      // record_analytics
      // option
      // value
    });

    a.o.options = _.mapObject(a.o.options, function(v, k){
      return _.unescape(v);
    });

    Async.waterfall([
      function(cb) {
        if (a.o.option && a.o.value) {
          var stocks_with_selected_option = _.filter(DOC.stocks, function(s) {
            return s.available_quantity > 0 &&
              s.options[a.o.option] &&
              (s.options[a.o.option].value == a.o.value ||
              s.options[a.o.option].alias_value == a.o.value);
          });

          gb['data'] = _.reduce($('[data-option].form-group'), function(m, el) {
            el = $(el);
            var option = el.data('option');
            if (option == a.o.option) return m;
            var option_button = el.find('.dropdown-toggle');
            var current_value = option_button.data('value');
            var stocks = _.filter(m, function(s) {
              return s.options[option].value == current_value || s.options[option].alias_value == current_value;
            });

            if (stocks.length == 0) {
              stocks = m;
              var new_value = stocks[1].options[option].value;
              stocks = _.filter(m, function(s) {
                return s.options[option].value == new_value || s.options[option].alias_value == new_value;
              });

              option_button.html(new_value);
              option_button.data('value', new_value);
              if (!gb.data) {

              }
            }

            _.each(el.find('.dropdown-item'), function(item) {
              var stocks_with_current_option = _.filter(m, function(s) {
                return s.options[option].value == $(item).data('value');
              });
              // TODO change css to remove/add classes
              if (stocks_with_current_option.length == 0) {
                $(item).css('color', '#D0D0D0');
                $(item).html($(item).data('value') + '<span> (available with other options)</span>');
              } else {
                $(item).css('color', '#616161');
                $(item).html($(item).data('value'));
              }
            })

            return stocks;
          }, stocks_with_selected_option)[0];
        }
        cb();
      }
      , function(cb){
        if (gb.data) return cb();
        $.post('/product/' + self._id + '/availability.json', a.o
        , Belt.cs(cb, gb, 'data', 0, 'data'));
      }
    , function(cb){
        if (FSEnabled()){
          FS.setUserVars({
            'checkAvailability_bool': true
          });
        }

        gb['price'] = Belt.get(gb, 'data.price');
        gb['compare_at_price'] = Belt.get(gb, 'data.compare_at_price') || Belt.get(gb, 'data.source.record.compare_at_price');

        if (gb.price){
          self.price = gb.price;
          gb.price = '$' + Instance.priceString(gb.price);
          self.$el.find('[name="add_to_bag"]').removeClass('disabled');
        } else {
          gb.price = 'Sold Out';
          self.$el.find('[name="add_to_bag"]').addClass('disabled');

          if (FSEnabled()){
            FS.setUserVars({
              'productUnavailable_bool': true
            });
          }
        }

        if (a.o.record_analytics){
          if (GAEnabled()){
            ga('send', 'event', 'ProductView', 'check availability');
          }

          if (FBEnabled()){
            fbq('trackCustom', 'check availability', {
              'content_ids': [
                self._id
              ]
            , 'value': self.price
            , 'currency': 'USD'
            });
          }
        }

        if (
             gb.price
          && gb.compare_at_price
          && Belt.cast(gb.compare_at_price, 'number') > Belt.cast(gb.data.price, 'number')
        ){
          gb.price = '<del>$' + Instance.priceString(gb.compare_at_price) + '</del>&nbsp;<span class="text-danger">' + gb.price + '</span>';
        }

        self.set({
          'price': gb.price
        });

        cb();
      }
    ], function(err){
      a.cb(err);
    });
  };

  gb.view['throttledGetAvailability'] = _.throttle(function(option, value){
    gb.view.getAvailability({
      'record_analytics': true
      , 'option': option
      , 'value': value
    });
  }, 100, {
    'leading': false
  , 'trailing': true
  });

  gb.view['addToBag'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'quantity': 1
    , 'product': self._id
    , 'price': self.price
    , 'options': self.get().options || {}
    });

    a.o.options = _.mapObject(a.o.options, function(v, k){
      return _.unescape(v);
    });

    Async.waterfall([
      function(cb){
        $.post('/cart/session/product/create.json', a.o, function(res){

          if (GAEnabled()){
            ga('ec:addProduct', {
              'id': a.o.product
            , 'name': GB.product.name || Belt.get(GB, 'product.label.us')
            , 'category': Belt.get(GB.product, 'categories.0') || GB.product.auto_category
            , 'brand': (GB.product.brands || []).join(', ')
            , 'variant': Belt.get(_.find(GB.product.configurations, function(c){
                return _.every(c.options, function(v, k){
                  return a.o.options[k] === v.value;
                });
              }), 'sku')
            , 'price': a.o.price
            , 'quantity': a.o.quantity
            });
            ga('ec:setAction', 'add');
            ga('send', 'event', 'ProductView', 'add to bag');
          }

          if (FSEnabled()){
            FS.setUserVars({
              'addToCart_bool': true
            });
          }

          if (FBEnabled()) {
            fbq('track', 'AddToCart', {
              'value': a.o.price
            , 'currency': 'USD'
            , 'content_ids': Belt.arrayDefalse([
                a.o.product
              , Belt.get(_.find(GB.product.configurations, function(c){
                  return _.every(c.options, function(v, k){
                    return a.o.options[k] === v.value;
                  });
                }), 'sku')
              ])
            , 'content_type': 'product'
            , 'content_name': GB.product.name || Belt.get(GB, 'product.label.us')
            , 'content_category': Belt.get(GB.product, 'categories.0') || GB.product.auto_category
            });
          }

          cb();
        });
      }
    , function(cb){
        GetCartCount(Belt.cs(cb, gb, 'products_length', 1, 'length', 0));
      }
    , function(cb){
        simple.scrollTo({
          'target': 'body'
        , 'animation': false
        , 'duration': 0
        , 'offset': {
            'y': 0
          }
        });

        $('[data-view="BagDropdown"]').remove();

        $('[name="cart"].dropdown').append(Render('bag_dropdown', _.extend({
          'doc': GB.product || GB.doc
        , 'product_count': gb.products_length || 0
        }, a.o)));

        setTimeout(function(){
          $('[data-view="BagDropdown"]').remove();
        }, 10000);
      }
    ], function(err){
      a.cb(err);
    });
  };

  gb.view['throttledAddToBag'] = _.throttle(function(){
    gb.view.addToBag();
  }, 100, {
    'leading': false
  , 'trailing': true
  });

  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = new ProductView({
    '_id': (GB.product || GB.doc)._id
  });

  var initial_stock = _.find(DOC.stocks, function(s) { return s.available_quantity > 0; });
  var initial_option = _.keys(initial_stock.options)[0];
  var initial_value = initial_stock.options[initial_option].value || initial_stock.options[initial_option].alias_value;
  var option_button = $('[data-option="' + initial_option + '"]').find('.dropdown-toggle');
  option_button.html(initial_value);
  option_button.data('value', initial_value);

  setTimeout(function(){
    GB.view.getAvailability({
      'option': initial_option
      , 'value': initial_value
    });
  }, 0);
});

GB['product'] = GB.product || GB.doc;

if (GAEnabled()){
  ga('ec:addProduct', {
    'id': GB.product._id
  , 'name': GB.product.name || Belt.get(GB, 'product.label.us')
  , 'category': Belt.get(GB.product, 'categories.0') || GB.product.auto_category
  , 'brand': (GB.product.brands || []).join(', ')
  , 'variant': Belt.get(GB, 'configuration.sku')
  , 'price': Belt.get(GB, 'configuration.price') || GB.product.low_price
  });

  ga('ec:setAction', 'detail');
}

if (FBEnabled()){
  fbq('track', 'ViewContent', {
    'content_ids': Belt.arrayDefalse([
      GB.product._id
    , Belt.get(GB, 'configuration.sku')
    ])
  , 'content_name': GB.product.name || Belt.get(GB, 'product.label.us')
  , 'content_category': Belt.get(GB.product, 'categories.0') || GB.product.auto_category
  , 'content_type': 'product'
  , 'value': Belt.get(GB, 'configuration.price') || GB.product.low_price
  , 'currency': 'USD'
  });
}
