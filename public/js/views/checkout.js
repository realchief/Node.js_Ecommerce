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
    , 'click #shipping [name="edit"]': function(e){
        e.preventDefault();

        var self = this;

        self.ToggleStep({
          'show': false
        });

        self.ToggleStep({
          'step': 'shipping'
        , 'show': true
        , 'active': true
        });
      }
    , 'click #shipping [name="next"]': function(e){
        e.preventDefault();

        var self = this;

        self.ValidateShipping(function(err){
          try {
            ga('send', 'event', 'ValidateShipping', 'click', Belt.get(err, 'message') ? err.message : 'valid');
          } catch (e) {

          }

          if (err) return;

          self.ToggleStep({
            'step': 'shipping'
          , 'editable': true
          , 'show': false
          , 'error': false
          , 'error_control': false
          });

          self.ToggleStep({
            'step': 'payment'
          , 'show': true
          , 'active': true
          });
        });
      }
    , 'click [name="submit"]': function(e){
        var self = this;

        ToggleLoader(true);

        self.ValidateBilling(function(err){
          try {
            ga('send', 'event', 'ValidateBilling', 'click', Belt.get(err, 'message') ? err.message : 'valid');
          } catch (e) {

          }

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

          try {
            ga('send', 'event', 'OrderAttempt', 'submit');
          } catch (e) {

          }

          $.post('/order/create.json', data, function(res){
            if (Belt.get(res, 'error')){
              ToggleLoader();

              try {
                ga('send', 'event', 'OrderError', 'result');
              } catch (e) {

              }

              alert(res.error);
            } else {

              try {
                ga('send', 'event', 'OrderSuccess', 'result', Belt.get(res, 'data.total_price'));
              } catch (e) {

              }

              document.location = '/checkout/complete';
            }
          });
        });
      }
    , 'change [data-get]': function(e){
        var self = this;

        self.ThrottleUpdateCart();
      }
    , 'change [data-get="billing_same"]': function(e){
        this.CopyShipping();
        $(e.currentTarget).makeChecked(false);
      }
    , 'click [name="apply_promo_code"]': function(e){
        e.preventDefault();

        this.AddPromoCode();
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
    , 'set:line_items': function(val, $el, view){
        return Render('checkout_line_items', {
          'line_items': val
        , 'Instance': Instance
        , 'products_count': Belt.get(view, 'data.products.length') || 0
        , 'total_price': Belt.get(view, 'data.total_price') || 0
        });
      }
    , 'set:products': function(val){
        return _.map(val, function(v){
          return Render('checkout_product', {
            'doc': v
          , 'Instance': Instance
          });
        }).join('\n');
      }
    }
  , 'events': {

    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['ThrottleUpdateCart'] = _.throttle(function(){
    $.post('/cart/session/update.json', gb.view.get(), function(res){

    });
  }, 300, {
    'leading': false
  , 'trailing': true
  });

  gb.view['AddPromoCode'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'code': self.$el.find('[name="promo_code"]').val()
    });

    ToggleLoader(true);

    Async.waterfall([
      function(cb){
        if (!a.o.code) return cb(new Error('Promo code is missing'));

        $.post('/cart/session/promo_code/' + a.o.code + '/create.json', {}, function(res){
          var data = Belt.get(res, 'data');
          if (data) self.set(Belt.objFlatten(data));

          if (Belt.get(res, 'error')) return cb(new Error(res.error));

          cb();
        });
      }
    ], function(err){
      if (err){
        self.FormControlValidation({
          'error': true
        , 'message': err.message
        , 'el': self.$el.find('[name="promo_code"]')
        });
      } else {
        self.FormControlValidation({
          'error': false
        , 'el': self.$el.find('[name="promo_code"]')
        });
        self.$el.find('[name="promo_code"]').val('');
      }
      ToggleLoader();
    });
  };

  gb.view['ToggleStep'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //error
      //show
      //editable
      //active
      //step
      //error_control
    });

    if (!a.o.step){
      self.ToggleStep(_.extend({}, a.o, {
        'step': 'shipping'
      }));
      self.ToggleStep(_.extend({}, a.o, {
        'step': 'payment'
      }));
      self.ToggleStep(_.extend({}, a.o, {
        'step': 'billing'
      }));
      return;
    }

    gb['$el'] = self.$el.find('#' + a.o.step);

    if (!Belt.isNull(a.o.show)){
      if (a.o.show){
        gb.$el.find('fieldset').removeClass('d-none');
        gb.$el.find('.checkout-step').addClass('d-none').removeClass('d-flex');
      } else {
        gb.$el.find('fieldset').addClass('d-none');
        gb.$el.find('.checkout-step').addClass('d-flex').removeClass('d-none');
      }
    }

    if (!Belt.isNull(a.o.error_control)){
      if (a.o.error_control){
        self.FormControlValidation({
          'error': true
        , 'el': gb.$el.find(a.o.error_control)
        });
      } else {
        self.FormControlValidation({
          'error': false
        });
      }
    }

    if (!Belt.isNull(a.o.error)){
      if (a.o.error){
        gb.$el.find('.alert').html(a.o.error).removeClass('d-none');
      } else {
        gb.$el.find('.alert').addClass('d-none');
      }
    }

    if (!Belt.isNull(a.o.editable)){
      if (a.o.editable){
        gb.$el.find('.checkout-step').addClass('checkout-step--done');
        if (a.o.active){
          gb.$el.find('.checkout-step__edit').addClass('d-none');
        } else {
          gb.$el.find('.checkout-step__edit').removeClass('d-none');
        }
      } else {
        gb.$el.find('.checkout-step').removeClass('checkout-step--done');
        gb.$el.find('.checkout-step__edit').addClass('d-none');
      }
    }
  };

  gb.view['FormControlValidation'] = function(options, calback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //el
      //error
      //message
    });

    if (!a.o.el) return $('.form-group').removeClass('form-group--has-error');

    gb['$group'] = $(a.o.el).parents('.form-group').first();
    gb.$group[a.o.error ? 'addClass' : 'removeClass']('form-group--has-error');

    if (a.o.message) gb.$group.find('.form-group-error-label').html(a.o.message);
  };

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
        gb['recipient'] = self.get().recipient || {};

        if (!gb.recipient.first_name){
          gb['error_control'] = '[name="recipient.first_name"]';
          return cb(new Error('First name is required'));
        }

        if (!gb.recipient.last_name){
          gb['error_control'] = '[name="recipient.last_name"]';
          return cb(new Error('Last name is required'));
        }

        if (!gb.recipient.street){
          gb['error_control'] = '[name="recipient.street"]';
          return cb(new Error('Address is required'));
        }

        if (!gb.recipient.city){
          gb['error_control'] = '[name="recipient.city"]';
          return cb(new Error('City is required'));
        }

        if (!gb.recipient.region){
          gb['error_control'] = '[name="recipient.region"]';
          return cb(new Error('State is required'));
        }

        if (!gb.recipient.postal_code){
          gb['error_control'] = '[name="recipient.postal_code"]';
          return cb(new Error('Postal code is required'));
        }

        if (!gb.recipient.phone){
          gb['error_control'] = '[name="recipient.phone"]';
          return cb(new Error('Phone is required'));
        }

        cb();
      }
    ], function(err){
      self.FormControlValidation();

      if (err){
        self.ToggleStep({
          'error': err.message
        , 'error_control': gb.error_control
        , 'step': 'shipping'
        });
      } else {
        self.ToggleStep({
          'error': false
        , 'error_control': false
        , 'step': 'shipping'
        });
      }

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

$(document).ready(function(){
  GB['view'] = new CheckoutView({

  });

  GB.view.set(Belt.objFlatten(GB.doc));

  GB.view.ToggleStep({
    'show': true
  , 'active': true
  , 'step': 'shipping'
  });

  ToggleLoader();
});
