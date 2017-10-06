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
        , 'editable': true
        });

        self.ToggleStep({
          'step': 'shipping'
        , 'show': true
        , 'active': true
        });

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': 1
        , 'option': 'shipping_edit'
        });
      }
    , 'click #shipping [name="next"]': function(e){
        e.preventDefault();

        var self = this;

        self.ValidateShipping(function(err){
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

          if (GAEnabled()) ga('ec:setAction','checkout_option', {
            'step': 2
          , 'option': 'payment_next'
          });
        });
      }
    , 'click #payment [name="edit"]': function(e){
        e.preventDefault();

        var self = this;

        self.ToggleStep({
          'show': false
        , 'editable': true
        });

        self.ToggleStep({
          'step': 'payment'
        , 'show': true
        , 'active': true
        });

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': 2
        , 'option': 'payment_edit'
        });
      }
    , 'click #payment [name="next"]': function(e){
        e.preventDefault();

        var self = this;

        ToggleLoader(true);

        self.ValidatePayment(function(err){
          ToggleLoader();

          if (err) return;

          self.ToggleStep({
            'step': 'payment'
          , 'editable': true
          , 'show': false
          , 'error': false
          , 'error_control': false
          });

          self.ToggleStep({
            'step': 'billing'
          , 'show': true
          , 'active': true
          });

          if (GAEnabled()) ga('ec:setAction','checkout_option', {
            'step': 3
          , 'option': 'billing_edit'
          });
        });
      }
    , 'click #billing [name="edit"]': function(e){
        e.preventDefault();

        var self = this;

        self.ToggleStep({
          'show': false
        , 'editable': true
        });

        self.ToggleStep({
          'step': 'billing'
        , 'show': true
        , 'active': true
        });

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': 3
        , 'option': 'billing_edit'
        });
      }
    , 'click [name="place_order"]': function(e){
        var self = this;

        ToggleLoader(true);

        return Async.waterfall([
          function(cb){
            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'order attempt');
            }

            self.ValidateShipping(function(err){
              if (err){
                self.ToggleStep({
                  'show': false
                , 'editable': true
                });

                self.ToggleStep({
                  'step': 'shipping'
                , 'show': true
                , 'active': true
                });
              }

              cb(err);
            });
          }
        , function(cb){
            self.ValidatePayment(function(err){
              if (err){
                self.ToggleStep({
                  'show': false
                , 'editable': true
                });

                self.ToggleStep({
                  'step': 'payment'
                , 'show': true
                , 'active': true
                });
              }

              cb(err);
            });
          }
        , function(cb){
            self.ValidateBilling(function(err){
              if (err){
                self.ToggleStep({
                  'show': false
                , 'editable': true
                });

                self.ToggleStep({
                  'step': 'billing'
                , 'show': true
                , 'active': true
                });
              }

              cb(err);
            });
          }
        , function(cb){
            self.CreateOrder(Belt.cw(cb, 0));
          }
        ], function(err){
          ToggleLoader();
        });
      }
    , 'change [data-get="buyer.email"], [data-get="buyer.region"]': function(e){
        var self = this;

        self.ThrottleUpdateCart();
      }
    , 'click [name="copy_shipping"]': function(e){
        e.preventDefault();

        this.CopyShipping();
      }
    , 'click [name="apply_promo_code"]': function(e){
        e.preventDefault();

        this.AddPromoCode();
      }
    , 'change [data-get]': function(e){
        var $el = $(e.currentTarget)
          , control = $el.attr('name')
          , step;

        if (name.match(/recipient/)) step = 1;
        if (name.match(/payment/)) step = 2;
        if (name.match(/billing/)) step = 3;

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': step
        , 'option': name
        });
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
        GB.doc.line_items = val;

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
      _.debounce(function(){
        gb.view.set(Belt.objFlatten(Belt.get(res, 'data')));
      })();
    });
  }, 500, {
    'leading': true
  , 'trailing': false
  });

  gb.view['CreateOrder'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'data': _.extend({}, self.get(), {
        'token': GB.token
      , 'line_items': GB.doc.line_items
      , 'products': _.map(GB.doc.products, function(p){
          return _.pick(p, [
            'product'
          , 'options'
          , 'quantity'
          , 'sku'
          , 'referring_list'
          , 'referring_media'
          ]);
        })
      })
    });

    Async.waterfall([
      function(cb){
        $.post('/order/create.json', a.o.data, function(res){
          if (Belt.get(res, 'error')){
            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'order error', res.error);
            }

            return cb(new Error(res.error));
          } else {

            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'order success');
            }

            document.location = '/checkout/complete';
          }
        });
      }
    ], function(err){
      if (err){
        self.$el.find('aside .alert').html(err.message).removeClass('d-none');
      }

      a.cb(err);
    });
  };

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

        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'promo code attempt', a.o.code.toLowerCase().replace(/\W/g, ''));
        }

        $.post('/cart/session/promo_code/' + a.o.code + '/create.json', {}, function(res){
          var data = Belt.get(res, 'data');
          if (data) self.set(Belt.objFlatten(data));

          if (Belt.get(res, 'error')){
            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'promo code error', res.error);
            }
            return cb(new Error(res.error));
          }

          if (GAEnabled()) {
            ga('send', 'event', 'Checkout', 'promo code success', a.o.code.toLowerCase().replace(/\W/g, ''));
          }

          if (GAEnabled()) ga('ec:setAction','checkout_option', {
            'option': 'promo code applied'
          , 'coupon': a.o.code.toLowerCase().replace(/\W/g, '')
          });

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
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'form error', a.o.error);
        }
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

    //self.ThrottleUpdateCart();
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

    if (a.o.message){
      gb.$group.find('.form-group-error-label').html(a.o.message);
      if (GAEnabled()) {
        ga('send', 'event', 'Checkout', 'form control error', a.o.message);
      }
    }
  };

  gb.view['CopyShipping'] = function(){
    var self = this;

    _.each(self.get().recipient, function(v, k){
      self.set(_.object(['buyer.' + k], [v]));
    });

    self.ThrottleUpdateCart();
  };

  gb.view['ValidateShipping'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate shipping attempt');
        }

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

        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate shipping error', err.message);
        }
      } else {
        self.ToggleStep({
          'error': false
        , 'error_control': false
        , 'step': 'shipping'
        });

        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate shipping success');
        }
      }

      a.cb(err);
    });
  };

  gb.view['ValidatePayment'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    Async.waterfall([
      function(cb){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate payment attempt');
        }

        if (!$('[name="billing_cardholder_name"]').val()){
          gb['error_control'] = '[name="billing_cardholder_name"]';
          return cb(new Error('Cardholder\'s name is required'));
        }

        if (!$('[name="billing_cardnumber"]').val()){
          gb['error_control'] = '[name="billing_cardnumber"]';
          return cb(new Error('Card number is required'));
        }

        if (!$('[name="billing_expiration_month"]').val()){
          gb['error_control'] = '[name="billing_expiration_month"]';
          return cb(new Error('Expiration month is required'));
        }

        if (!$('[name="billing_expiration_year"]').val()){
          gb['error_control'] = '[name="billing_expiration_year"]';
          return cb(new Error('Expiration month is required'));
        }

        if (!$('[name="billing_cvc"]').val()){
          gb['error_control'] = '[name="billing_cvc"]';
          return cb(new Error('Security code is required'));
        }

        Stripe.createToken({
          'number': $('[name="billing_cardnumber"]').val()
        , 'cvc': $('[name="billing_cvc"]').val()
        , 'exp_month': Belt.cast($('[name="billing_expiration_month"]').val(), 'number')
        , 'exp_year': Belt.cast($('[name="billing_expiration_year"]').val(), 'number')
        }, function(status, res){
          GB['token'] = Belt.get(res, 'id');

          if (!GB.token){
            var err = Belt.get(res, 'error.message') || 'Billing information is invalid. Please check and re-try.';

            gb['error_control'] = '[name="billing_cardnumber"]';
            return cb(new Error(err));
          }

          cb();
        });
      }
    ], function(err){
      self.FormControlValidation();

      if (err){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate payment error', err.message);
        }

        self.ToggleStep({
          'error': err.message
        , 'error_control': gb.error_control
        , 'step': 'payment'
        });
      } else {
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate payment success');
        }

        self.ToggleStep({
          'error': false
        , 'error_control': false
        , 'step': 'payment'
        });
      }

      self.ThrottleUpdateCart();

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
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate billing attempt');
        }

        gb['buyer'] = self.get().buyer || {};

        if (!gb.buyer.first_name){
          gb['error_control'] = '[name="buyer.first_name"]';
          return cb(new Error('First name is required'));
        }

        if (!gb.buyer.last_name){
          gb['error_control'] = '[name="buyer.last_name"]';
          return cb(new Error('Last name is required'));
        }

        if (!gb.buyer.street){
          gb['error_control'] = '[name="buyer.street"]';
          return cb(new Error('Address is required'));
        }

        if (!gb.buyer.city){
          gb['error_control'] = '[name="buyer.city"]';
          return cb(new Error('City is required'));
        }

        if (!gb.buyer.region){
          gb['error_control'] = '[name="buyer.region"]';
          return cb(new Error('State is required'));
        }

        if (!gb.buyer.postal_code){
          gb['error_control'] = '[name="buyer.postal_code"]';
          return cb(new Error('Postal code is required'));
        }

        if (!gb.buyer.phone){
          gb['error_control'] = '[name="buyer.phone"]';
          return cb(new Error('Phone is required'));
        }

        if (!gb.buyer.email){
          gb['error_control'] = '[name="buyer.email"]';
          return cb(new Error('Email is required'));
        }

        if (!gb.buyer.email.match(Belt.email_regexp)){
          gb['error_control'] = '[name="buyer.email"]';
          return cb(new Error('Email is invalid'));
        }

        cb();
      }
    ], function(err){
      self.FormControlValidation();

      if (err){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate billing error', err.message);
        }

        self.ToggleStep({
          'error': err.message
        , 'error_control': gb.error_control
        , 'step': 'billing'
        });
      } else {
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate billing success');
        }

        self.ToggleStep({
          'error': false
        , 'error_control': false
        , 'step': 'billing'
        });
      }

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

  ga('ec:setAction','checkout', {
    'step': 1
  });
}
