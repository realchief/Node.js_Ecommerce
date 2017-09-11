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
          , val = $el.html()
          , button = $el.parents('.form-group').find('button');
        button.html(val);

        this.emit('options:update');
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
      'options:update': function(){
        this.throttledGetAvailability();
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
      //record_analytics
    });

    Async.waterfall([
      function(cb){
        if (_.size(a.o.options) !== _.size((GB.product || GB.doc).options)) return cb();

        $.post('/product/' + self._id + '/availability.json', a.o
        , Belt.cs(cb, gb, 'price', 0, 'data.price'));
      }
    , function(cb){
        if (gb.price){
          self.price = gb.price;
          gb.price = '$' + Instance.priceString(gb.price);
          self.$el.find('[name="add_to_bag"]').removeClass('disabled');
        } else {
          gb.price = 'Sold Out';
          self.$el.find('[name="add_to_bag"]').addClass('disabled');
        }

        if (a.o.record_analytics){
          try {
            ga('send', 'event', 'CheckAvailability', 'click', self._id, gb.price ? 1 : 0);
          } catch (e) {

          }
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

  gb.view['throttledGetAvailability'] = _.throttle(function(){
    gb.view.getAvailability({
      'record_analytics': true
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

    Async.waterfall([
      function(cb){
        $.post('/cart/session/product/create.json', a.o, function(res){
          console.log(res);

          try {
            ga('send', 'event', 'AddToBag', 'click', self._id);
          } catch (e) {

          }

          cb();
        });
      }
    , function(cb){
        GetCartCount(Belt.cs(cb, gb, 'products_length', 1, 'length', 0));
      }
    , function(cb){
        $('[data-view="BagDropdown"]').remove();

        $('[name="cart"].dropdown.show').append(Render('bag_dropdown', _.extend({
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
  setTimeout(function(){
    GB.view.getAvailability();
  }, 0);
});
