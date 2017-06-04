var CheckoutView = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('[data-view="CheckoutView"]')
  , 'triggers': {
      'submit form': function(e){
        e.preventDefault();
      }
    , 'click [name="next"]': function(e){
        var cur = this.$el.find('.tab-pane.active')
          , next = cur.next('.tab-pane');

        cur.removeClass('active');
        next.addClass('active');
        this.$el.find('[data-toggle="tab"]').removeClass('active');
        this.$el.find('[href="#' + next.attr('id') + '"]').addClass('active');
      }
    , 'click [name="submit"]': function(e){
        $.post('/order/create.json', this.get(), function(){
          document.location = '/checkout/complete';
        });
      }
    }
  , 'transformers': {

    }
  , 'events': {

    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view.emit('load');

  return gb.view;
};

$(document).on('click', '[name="cart_product_remove"]', function(e){
  e.preventDefault();

  $.getJSON($(this).attr('href'), function(){
    document.location.reload();
  });
});

$(document).on('click', '[name="cart_product_save"]', function(e){
  e.preventDefault();

  var prod = $(this).parents('[data-view="BagProductView"], [data-view="BagProductMobileView"]')
    , qty = prod.find('[data-get="quantity"]').val();

  $.getJSON('/cart/session/product/' + prod.attr('data-id') + '/quantity/' + qty + '/update.json', function(){
    document.location.reload();
  });
});

$(document).ready(function(){
  GB['view'] = new CheckoutView({

  });
});
