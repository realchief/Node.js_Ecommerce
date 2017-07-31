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
        var self = this;

        self.ValidateShipping(function(err){
          if (err) return;

          self.$el.find('.tab-pane').removeClass('active');
          self.$el.find('#billing-tab.tab-pane').addClass('active');

          self.$el.find('.tabs__link').removeClass('active');
          self.$el.find('.tabs__link[href="#billing-tab"]').addClass('active');
        });
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
    , 'click [href="#billing-tab"]:not(.active)': function(e){
        var self = this;
        self.ValidateShipping(function(err){
          if (err) return;

          self.$el.find('.tab-pane').removeClass('active');
          self.$el.find('#billing-tab.tab-pane').addClass('active');

          self.$el.find('.tabs__link').removeClass('active');
          self.$el.find('.tabs__link[href="#billing-tab"]').addClass('active');
        });
      }
    , 'click [href="#shipping-tab"]:not(.active)': function(e){
        var self = this;

        self.$el.find('.tab-pane').removeClass('active');
        self.$el.find('#shipping-tab.tab-pane').addClass('active');

        self.$el.find('.tabs__link').removeClass('active');
        self.$el.find('.tabs__link[href="#shipping-tab"]').addClass('active');
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
    , 'getShippingGroup': function(val, $el){
        return $el.find('.selected-shipping-option').attr('data-shipping-option');
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

  gb.view['ValidateShipping'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        self.$el.find('.form-group').removeClass('form-group--has-error');

        if (!self.get('shipping_first_name')){
          self.$el.find('[name="shipping_first_name"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_first_name"] .form-group-error-label').html('First name is required');
          return cb(new Error('First name is required'));
        }

        if (!self.get('shipping_last_name')){
          self.$el.find('[name="shipping_last_name"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_last_name"] .form-group-error-label').html('Last name is required');
          return cb(new Error('Last name is required'));
        }

        if (!self.get('shipping_address')){
          self.$el.find('[name="shipping_address"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_address"] .form-group-error-label').html('Address is required');
          return cb(new Error('Address is required'));
        }

        if (!self.get('shipping_city')){
          self.$el.find('[name="shipping_city"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_city"] .form-group-error-label').html('City is required');
          return cb(new Error('City is required'));
        }

        if (!self.get('shipping_region')){
          self.$el.find('[name="shipping_region"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_region"] .form-group-error-label').html('State is required');
          return cb(new Error('State is required'));
        }

        if (!self.get('shipping_postal_code')){
          self.$el.find('[name="shipping_postal_code"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_postal_code"] .form-group-error-label').html('Postal code is required');
          return cb(new Error('Postal code is required'));
        }

        if (!self.get('shipping_phone')){
          self.$el.find('[name="shipping_phone"]').addClass('form-group--has-error');
          self.$el.find('[name="shipping_phone"] .form-group-error-label').html('Phone is required');
          return cb(new Error('Phone is required'));
        }

        cb();
      }
    ], function(err){
      a.cb(err);
    });
  };

  gb.view.emit('load');

  return gb.view;
};

$(document).on('click', 'a.shipping-option', function(e){
  e.preventDefault();

  var $el = $(this)
    , o = $el.attr('data-shipping-option')
    , $sg = $el.parents('[data-shipping-group]')
    , shipping_group_id = $sg.attr('data-shipping-group')
    , l = $el.html();

  var shipping_group = GB.doc.shipping_groups[shipping_group_id];

  shipping_group.selected_shipping_option = Belt.copy(_.find(shipping_group.shipping_options, function(s){
    return s.option._id === o;
  }));

  GB.view.$el.find('[data-view="CheckoutSidebar"]').html(Render('checkout_sidebar', {
    'doc': GB.doc
  , 'Locals': {
      'doc': GB.doc
    }
  }));

  $sg.find('.selected-shipping-option').attr('data-shipping-option', o).html(l);
});

$(document).ready(function(){
  GB['view'] = new CheckoutView({

  });
});
