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
    });

    Async.waterfall([
      function(cb){
        $.post('/product/' + self._id + '/availability.json', a.o
        , Belt.cs(cb, gb, 'price', 0, 'data.price'));
      }
    , function(cb){
        if (gb.price){
          gb.price = '$' + Belt.cast(gb.price, 'string');
          self.$el.find('[name="add_to_bag"]').removeClass('disabled');
        } else {
          gb.price = 'Sold Out';
          self.$el.find('[name="add_to_bag"]').addClass('disabled');
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
    gb.view.getAvailability();
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
    , 'options': self.get().options || {}
    });

    Async.waterfall([
      function(cb){
        $.post('/cart/session/product/create.json', a.o, function(res){
          console.log(res);
          cb();
        });
      }
    , function(cb){
        GetCartCount(Belt.cw(cb, 0));
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
