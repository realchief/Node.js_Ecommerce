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
    , 'change [data-get]': function(e){
        this.set(this.get());
      }
    , 'change [data-get="billing_same"]': function(e){
        this.CopyShipping();
        $(e.currentTarget).makeChecked(false);
      }
    , 'click [data-toggle="tab"]:not(.tabs__link)': function(e){
        this.$el.find('[data-toggle="tab"]').removeClass('active');
        this.$el.find('.tabs__link[href="' + $(e.currentTarget).attr('href') + '"]').addClass('active');
      }
    }
  , 'transformers': {
      'redact_card': function(val){
        val = (val || '').split('');
        var v = '';
        for (var i = 0; i < val.length; i++){
          if (i >= val.length - 5){
            v += val[i];
          } else {
            v += 'X';
          }
        }
        return v;
      }
    }
  , 'events': {

    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['CopyShipping'] = function(){
    var info = _.pick(this.get(), function(v, k){
      return k.match(/^shipping/i);
    });

    _.each(info, function(v, k){
      gb.view.$el.find('[data-get="' + k.replace(/^shipping/i, 'billing') + '"]').val(v);
    });
  };

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = new CheckoutView({

  });
});
