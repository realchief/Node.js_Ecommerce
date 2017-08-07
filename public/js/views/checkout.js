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
        var self = this;

        ToggleLoader(true);

        self.ValidateBilling(function(err){
          if (err){
            ToggleLoader();
            return;
          }

          var data = _.extend({}, self.get(), {
            'token': GB.token
          });

          delete data.billing_cardnumber;
          delete data.billing_cardholder_name;
          delete data.billing_cvc;
          delete data.billing_expiration_month;
          delete data.billing_expiration_year;

          $.post('/order/create.json', data, function(res){
            if (Belt.get(res, 'error')){
              ToggleLoader();
              alert(res.error);
            } else {
              document.location = '/checkout/complete';
            }
          });
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

  gb.view['ValidateBilling'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        self.$el.find('.form-group').removeClass('form-group--has-error');

        if (!self.get('billing_cardholder_name')){
          self.$el.find('[name="billing_cardholder_name"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_cardholder_name"] .form-group-error-label').html('Cardholder name is required');
          return cb(new Error('Cardholder name is required'));
        }

        if (!self.get('billing_cardnumber')){
          self.$el.find('[name="billing_cardnumber"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_cardnumber"] .form-group-error-label').html('Card number is required');
          return cb(new Error('Card number is required'));
        }

        if (!self.get('billing_expiration_month')){
          self.$el.find('[name="billing_expiration_month"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_expiration_month"] .form-group-error-label').html('Expirtation month is required');
          return cb(new Error('Expiration month is required'));
        }

        if (!self.get('billing_expiration_year')){
          self.$el.find('[name="billing_expiration_year"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_expiration_year"] .form-group-error-label').html('Expirtation year is required');
          return cb(new Error('Expiration year is required'));
        }

        if (!self.get('billing_cvc')){
          self.$el.find('[name="billing_cvc"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_cvc"] .form-group-error-label').html('Security code is required');
          return cb(new Error('Security code is required'));
        }

        Stripe.createToken({
          'number': self.get('billing_cardnumber')
        , 'cvc': self.get('billing_cvc')
        , 'exp_month': Belt.cast(self.get('billing_expiration_month'), 'number')
        , 'exp_year': Belt.cast(self.get('billing_expiration_year'), 'number')
        }, function(status, res){
          GB['token'] = Belt.get(res, 'id');

          if (!GB.token){
            var err = Belt.get(res, 'error.message') || 'Billing information is invalid. Please check and re-try.';

            self.$el.find('[name="billing_cardnumber"]').addClass('form-group--has-error');
            self.$el.find('[name="billing_cardnumber"] .form-group-error-label').html(err);
            return cb(new Error(err));
          }

          cb();
        });
      }
    , function(cb){

        if (!self.get('billing_first_name')){
          self.$el.find('[name="billing_first_name"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_first_name"] .form-group-error-label').html('First name is required');
          return cb(new Error('First name is required'));
        }

        if (!self.get('billing_last_name')){
          self.$el.find('[name="billing_last_name"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_last_name"] .form-group-error-label').html('Last name is required');
          return cb(new Error('Last name is required'));
        }

        if (!self.get('billing_address')){
          self.$el.find('[name="billing_address"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_address"] .form-group-error-label').html('Address is required');
          return cb(new Error('Address is required'));
        }

        if (!self.get('billing_city')){
          self.$el.find('[name="billing_city"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_city"] .form-group-error-label').html('City is required');
          return cb(new Error('City is required'));
        }

        if (!self.get('billing_region')){
          self.$el.find('[name="billing_region"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_region"] .form-group-error-label').html('State is required');
          return cb(new Error('State is required'));
        }

        if (!self.get('billing_postal_code')){
          self.$el.find('[name="billing_postal_code"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_postal_code"] .form-group-error-label').html('Postal code is required');
          return cb(new Error('Postal code is required'));
        }

        if (!self.get('billing_phone')){
          self.$el.find('[name="billing_phone"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_phone"] .form-group-error-label').html('Phone is required');
          return cb(new Error('Phone is required'));
        }

        if (!self.get('billing_email')){
          self.$el.find('[name="billing_email"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_email"] .form-group-error-label').html('Email is required');
          return cb(new Error('Email is required'));
        }

        if (!self.get('billing_email').match(Belt.email_regexp)){
          self.$el.find('[name="billing_email"]').addClass('form-group--has-error');
          self.$el.find('[name="billing_email"] .form-group-error-label').html('Email is invalid');
          return cb(new Error('Email is invalid'));
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
    , 'Instance': Instance
    }
  , 'Instance': Instance
  }));

  $sg.find('.selected-shipping-option').attr('data-shipping-option', o).html(l);
});

$(document).ready(function(){
  GB['view'] = new CheckoutView({

  });
});
