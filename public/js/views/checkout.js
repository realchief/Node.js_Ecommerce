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

        if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': '#shipping'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 100
          }
        });

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': 1
        , 'option': 'shipping_edit'
        });

        if (FSEnabled()){
          FS.setUserVars({
            'shipping_edit': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'checkout_option', {
            'status': 'shipping_edit'
          });
        }
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
            'step': 'billing'
          , 'show': true
          , 'active': true
          });

          if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
            'target': '#billing'
          , 'animation': true
          , 'duration': 300
          , 'offset': {
              'y': 100
            }
          });

          if (GAEnabled()) ga('ec:setAction','checkout_option', {
            'step': 2
          , 'option': 'billing_next'
          });

          if (FSEnabled()){
            FS.setUserVars({
              'billing_next': true
            });
          }

          if (FBEnabled()){
            fbq('trackCustom', 'checkout_option', {
              'status': 'billing_next'
            });
          }
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

        if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': '#payment'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 100
          }
        });

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': 2
        , 'option': 'payment_edit'
        });

        if (FSEnabled()){
          FS.setUserVars({
            'payment_edit': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'checkout_option', {
            'status': 'payment_edit'
          });
        }
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

          if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
            'target': '#billing'
          , 'animation': true
          , 'duration': 300
          , 'offset': {
              'y': 100
            }
          });

          if (GAEnabled()) ga('ec:setAction','checkout_option', {
            'step': 3
          , 'option': 'billing_edit'
          });

          if (FSEnabled()){
            FS.setUserVars({
              'billing_edit': true
            });
          }

          if (FBEnabled()){
            fbq('trackCustom', 'checkout_option', {
              'status': 'billing_edit'
            });
          }
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

        if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': '#billing'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 100
          }
        });

        if (GAEnabled()) ga('ec:setAction','checkout_option', {
          'step': 3
        , 'option': 'billing_edit'
        });

        if (FSEnabled()){
          FS.setUserVars({
            'billing_edit': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'checkout_option', {
            'status': 'billing_edit'
          });
        }
      }
    , 'click #billing [name="next"]': function(e){
        e.preventDefault();

        var self = this;

        self.ValidateBilling(function(err){
          if (err) return;

          self.ToggleStep({
            'step': 'billing'
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

          if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
            'target': '#payment'
          , 'animation': true
          , 'duration': 300
          , 'offset': {
              'y': 100
            }
          });

          if (GAEnabled()) ga('ec:setAction','checkout_option', {
            'step': 2
          , 'option': 'payment_next'
          });

          if (FSEnabled()){
            FS.setUserVars({
              'payment_next': true
            });
          }

          if (FBEnabled()){
            fbq('trackCustom', 'checkout_option', {
              'status': 'payment_next'
            });
          }
        });
      }
    , 'click [name="place_order"]': function(e){
        var self = this;
        self.PlaceOrder();
      }
    , 'change [data-get="buyer.email"], [data-get="recipient.region"], [data-get="recipient.country"], [data-get="buyer.region"], [data-get="buyer.country"]': function(e){
//    , 'change [data-get="buyer.email"], [data-get="buyer.region"], [data-get="buyer.country"]': function(e){
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

        if (FSEnabled()){
          FS.setUserVars(_.object([
            'checkout_option_edit_' + name
          ], [
            true
          ]));
        }

        if (FBEnabled()){
          fbq('trackCustom', 'checkout_option', {
            'status': name
          });
        }
      }
    , 'change [name="recipient.country"]': function(e){
        var val = $(e.currentTarget).val();

        this.$el.find('select[name="recipient.region"]').html(_.map(GB.localities[val].regions, function(v){
          return '<option value="' + v.shortCode + '">' + v.name + '</option>';
        }).join('\n'));
      }
    , 'change [name="buyer.country"]': function(e){
        var val = $(e.currentTarget).val();

        this.$el.find('select[name="buyer.region"]').html(_.map(GB.localities[val].regions, function(v){
          return '<option value="' + v.shortCode + '">' + v.name + '</option>';
        }).join('\n'));
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
    /*, 'set:recipient.country': function(val){
        this.$el.find('select[name="recipient.region"]').html(_.map(GB.localities[val].regions, function(v){
          return '<option value="' + v.shortCode + '">' + v.name + '</option>';
        }).join('\n'));

        return val;
      }*/
    /*, 'set:buyer.country': function(val){
        this.$el.find('select[name="buyer.region"]').html(_.map(GB.localities[val].regions, function(v){
          return '<option value="' + v.shortCode + '">' + v.name + '</option>';
        }).join('\n'));

        return val;
      }*/
    }
  , 'events': {

    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['GetPaymentToken'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'number': $('[name="billing_cardnumber"]').val()
    , 'cvc': $('[name="billing_cvc"]').val()
    , 'exp_month': Belt.cast($('[name="billing_expiration_month"]').val(), 'number')
    , 'exp_year': Belt.cast($('[name="billing_expiration_year"]').val(), 'number')
    , 'name': $('[name="billing_cardholder_name"]').val()
    , 'address_line1': $('[name="buyer.street"]').val()
    , 'address_line2': $('[name="buyer.street_b"]').val()
    , 'address_city': $('[name="buyer.city"]').val()
    , 'address_state': $('[name="buyer.region"]').val()
    , 'address_zip': $('[name="buyer.postal_code"]').val()
    , 'address_country': $('[name="buyer.country"]').val()
    });

    Stripe.createToken(_.extend({
      'number': a.o.number
    , 'cvc': a.o.cvc
    , 'exp_month': a.o.exp_month
    , 'exp_year': a.o.exp_year
    , 'name': a.o.name
    }, a.o.check_address ? {
      'address_line1': a.o.address_line1
    , 'address_line2': a.o.address_line2
    , 'address_city': a.o.address_city
    , 'address_state': a.o.address_state
    , 'address_zip': a.o.address_zip
    , 'address_country': a.o.address_country
    } : {}), function(status, res){
      var token = Belt.get(res, 'id')
        , err = token ? undefined : new Error(Belt.get(res, 'error.message') || 'Billing information is invalid. Please check and re-try.');

      return a.cb(err, token);
    });
  };

  gb.view['UpdateStepRegions'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //step
      //country
    });

    if (!Belt.get(GB.localities[a.o.country], 'regions')) return;

    self.$el.find('select[name="' + a.o.step + '.region"]').html(_.map(GB.localities[a.o.country].regions, function(v){
      return '<option value="' + v.shortCode + '">' + v.name + '</option>';
    }).join('\n'));
  };

  gb.view['UpdateRegions'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //data
    });

    self.UpdateStepRegions({
      'step': 'recipient'
    , 'country': Belt.get(a.o.data, 'recipient.country')
    });

    self.UpdateStepRegions({
      'step': 'buyer'
    , 'country': Belt.get(a.o.data, 'buyer.country')
    });
  };

  gb.view['UpdateCart'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    $.post('/cart/session/update.json', self.get(), function(res){
      var err = Belt.get(res, 'error')
        , data = Belt.get(res, 'data') || {};

      if (err){
        GB.view.ToggleStep({
          'show': true
        , 'active': true
        });

        GB.view.ToggleStep({
          'step': 'shipping'
        , 'show': true
        , 'active': true
        , 'error': err
        });

        GB.view.$el.find('aside .alert').html(err).removeClass('d-none');

        if ($('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': 'body'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 0
          }
        });
      } else {
        GB.view.$el.find('#shipping .alert').addClass('d-none');
      }

      return a.cb(err ? new Error(err) : undefined, data);
    });
  };

  gb.view['ThrottleUpdateCart'] = _.throttle(function(){
    gb.view.UpdateCart(function(err, data){
      _.debounce(function(){
        gb.view.UpdateRegions({
          'data': data
        });

        gb.view.set(_.extend({}, Belt.objFlatten(_.omit(data, [
          'products'
        , 'line_items'
        ])), _.pick(data, [
          'products'
        , 'line_items'
        ])));
      })();
    });
  }, 500, {
    'leading': true
  , 'trailing': false
  });

  gb.view['PlaceOrder'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'payment_method': $('[name="payment_method"]:checked').val() || 'stripe'
    });

    ToggleLoader(true);

    return Async.waterfall([
      function(cb){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'order attempt');
        }

        if (FSEnabled()){
          FS.setUserVars({
            'order_attempt': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'order attempt', {

          });
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
        if (a.o.payment_method === 'paypal') return cb();

        self.ValidatePayment({
          'check_address': true
        }, function(err){
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
        if (a.o.payment_method === 'paypal'){
          self.CreatePayPalAuthorization(Belt.cw(cb, 0));
        } else {
          self.CreateOrder(Belt.cw(cb, 0));
        }
      }
    ], function(err){
      ToggleLoader();
    });
  };

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
        var res_callback = function(res){
          if (Belt.get(res, 'error')){
            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'order error', res.error);
            }

            if (FSEnabled()){
              FS.setUserVars({
                'order_error': res.error
              });
            }

            if (FBEnabled()){
              fbq('trackCustom', 'order error', {
                'status': res.error
              });
            }

            return cb(new Error(res.error));
          } else {

            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'order success');
            }

            if (FSEnabled()){
              FS.setUserVars({
                'order_success': true
              });
            }

            if (FBEnabled()){
              fbq('trackCustom', 'order success', {

              });
            }

            document.location = '/checkout/complete';
          }
        };

        $.post('/order/create.json', a.o.data, function(res){
          if (Belt.get(res, 'error') && res.error.match(/matching document/i)){
            self.GetPaymentToken(function(err, token){
              if (err) return res_callback({
                'error': err.message
              });

              a.o.data.token = token;

              $.post('/order/create.json', a.o.data, function(res){
                res_callback(res);
              });
            });
          } else {
            res_callback(res);
          }
        });
      }
    ], function(err){
      if (err){
        self.ToggleStep({
          'show': true
        , 'active': true
        });

        self.ToggleStep({
          'step': 'shipping'
        , 'show': true
        , 'active': true
        , 'error': err.message
        });

        self.$el.find('aside .alert').html(err.message).removeClass('d-none');

        if ($('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': 'body'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 0
          }
        });
      }

      a.cb(err);
    });
  };

  gb.view['CreatePayPalAuthorization'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'data': _.extend({}, self.get(), {
        'line_items': GB.doc.line_items
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
        var res_callback = function(res){
          if (Belt.get(res, 'error')){
            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'paypal order authorization error', res.error);
            }

            if (FSEnabled()){
              FS.setUserVars({
                'paypal_order_error': res.error
              });
            }

            if (FBEnabled()){
              fbq('trackCustom', 'paypal order authorization error', {
                'status': res.error
              });
            }

            return cb(new Error(res.error));
          } else {

            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'paypal order authorization success');
            }

            if (FSEnabled()){
              FS.setUserVars({
                'paypal_order_success': true
              });
            }

            if (FBEnabled()){
              fbq('trackCustom', 'paypal order authorization success', {

              });
            }

            document.location = res.data.redirect_url;
          }
        };

        $.post('/order/paypal/authorize.json', a.o.data, function(res){
          res_callback(res);
        });
      }
    ], function(err){
      if (err){
        self.ToggleStep({
          'show': true
        , 'active': true
        });

        self.ToggleStep({
          'step': 'shipping'
        , 'show': true
        , 'active': true
        , 'error': err.message
        });

        self.$el.find('aside .alert').html(err.message).removeClass('d-none');

        if ($('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': 'body'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 0
          }
        });
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

        self.UpdateCart(Belt.cw(cb));
      }
    , function(cb){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'promo code attempt', a.o.code.toLowerCase().replace(/\W/g, ''));
        }

        if (FSEnabled()){
          FS.setUserVars({
            'promo_code_attempt': a.o.code.toLowerCase().replace(/\W/g, '')
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'promo code attempt', {
            'status': a.o.code.toLowerCase().replace(/\W/g, '')
          });
        }

        $.post('/cart/session/promo_code/' + encodeURIComponent(a.o.code) + '/create.json', {}, function(res){
          if (Belt.get(res, 'error')){
            if (GAEnabled()) {
              ga('send', 'event', 'Checkout', 'promo code error', res.error);
            }

            if (FSEnabled()){
              FS.setUserVars({
                'promo_code_error': res.error
              });
            }

            if (FBEnabled()){
              fbq('trackCustom', 'promo code error', {
                'status': res.error
              });
            }

            return cb(new Error(res.error));
          }

          var data = Belt.get(res, 'data');
          if (data){
            self.UpdateRegions({
              'data': data
            });

            self.set(_.extend({}, Belt.objFlatten(_.omit(data, [
              'products'
            , 'line_items'
            ])), _.pick(data, [
              'products'
            , 'line_items'
            ])));
          }

          if (GAEnabled()) {
            ga('send', 'event', 'Checkout', 'promo code success', a.o.code.toLowerCase().replace(/\W/g, ''));
          }

          if (FSEnabled()){
            FS.setUserVars({
              'promo_code_success': a.o.code.toLowerCase().replace(/\W/g, '')
            });
          }

          if (FBEnabled()){
            fbq('trackCustom', 'promo code success', {
              'status': a.o.code.toLowerCase().replace(/\W/g, '')
            });
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

        if (FSEnabled()){
          FS.setUserVars({
            'checkout_form_error': a.o.error
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'checkout error', {
            'status': a.o.error
          });
        }

        gb.$el.find('.alert').html(a.o.error).removeClass('d-none');

        if (!$('.hidden-sm-down:visible').length) simple.scrollTo({
          'target': '#' + a.o.step + ' .alert'
        , 'animation': true
        , 'duration': 300
        , 'offset': {
            'y': 100
          }
        });
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

      if (FSEnabled()){
        FS.setUserVars({
          'checkout_form_control_error': a.o.message
        });
      }

      if (FBEnabled()){
        fbq('trackCustom', 'checkout control error', {
          'status': a.o.message
        });
      }
    }
  };

  gb.view['CopyShipping'] = function(){
    var self = this;

    var rec = self.get().recipient || {};

    self.UpdateStepRegions({
      'step': 'buyer'
    , 'country': rec.country
    });

    _.each(rec, function(v, k){
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_shipping_attempt': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate shipping attempt', {

          });
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
          return cb(new Error('State / region is required'));
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_shipping_error': err.message
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate shipping error', {
            'status': err.message
          });
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_shipping_success': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate shipping success', {

          });
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
      //check_address
    });

    Async.waterfall([
      function(cb){
        if (GAEnabled()) {
          ga('send', 'event', 'Checkout', 'validate payment attempt');
        }

        if (FSEnabled()){
          FS.setUserVars({
            'validate_payment_attempt': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate payment attempt', {

          });
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

        self.GetPaymentToken({
          'check_address': a.o.check_address
        }, function(err, token){
          GB['token'] = token;

          if (err){
            gb['error_control'] = '[name="billing_cardnumber"]';
            return cb(err);
          }

          if (FBEnabled()){
            fbq('track', 'AddPaymentInfo', {
              'contents': _.map(GB.doc.products, function(p){
                return {
                  'id': p.sku
                , 'quantity': p.quantity
                , 'item_price': p.price
                };
              })
            , 'content_ids': _.pluck(GB.doc.products, 'sku')
            , 'value': GB.doc.total_price
            , 'currency': 'USD'
            });
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_payment_error': err.message
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate payment error', {
            'status': err.message
          });
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_payment_success': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate payment success', {

          });
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_billing_attempt': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate billing attempt', {

          });
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
          return cb(new Error('State / region is required'));
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

        if (FBEnabled()){
          fbq('trackCustom', 'validate billing error', {
            'status': err.message
          });
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

        if (FSEnabled()){
          FS.setUserVars({
            'validate_billing_success': true
          });
        }

        if (FBEnabled()){
          fbq('trackCustom', 'validate billing success', {

          });
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

  GB.view.set(_.extend({}, Belt.objFlatten(_.omit(GB.doc, [
    'products'
  , 'line_items'
  ])), _.pick(GB.doc, [
    'products'
  , 'line_items'
  ])));

  var err = GB.error || Belt.get(queryObject.get(), 'error');
  if (err){
    GB.view.ToggleStep({
      'show': true
    , 'active': true
    });

    GB.view.ToggleStep({
      'step': 'shipping'
    , 'show': true
    , 'active': true
    , 'error': err
    });

    GB.view.$el.find('aside .alert').html(err).removeClass('d-none');

    if ($('.hidden-sm-down:visible').length) simple.scrollTo({
      'target': 'body'
    , 'animation': true
    , 'duration': 300
    , 'offset': {
        'y': 0
      }
    });
  } else {
    GB.view.ToggleStep({
      'show': true
    , 'active': true
    , 'step': 'shipping'
    });
  }

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

if (FBEnabled()){
  fbq('track', 'InitiateCheckout', {
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
    'initiate_checkout': true
  });
}
