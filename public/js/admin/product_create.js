var View = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('#container')
  , 'triggers': {
      'click [name="option_create"]': function(e){
        e.preventDefault();

        var index = this.$el.find('[name="options"] [name="option"]').length || 0;

        var view = Templates.admin_product_option({
          'option': ''
        , 'path_prefix': 'options.' + index + '.'
        , 'index': index
        });

        this.$el.find('[name="options"]').append(view);
        this.throttledUpdateOptions();
      }
    , 'keyup [name="option"] *': function(e){
        this.throttledUpdateOptions();
      }
    , 'click [name="option"] [name="delete"]': function(e){
        e.preventDefault();
        var self = this;

        bootbox.confirm('Are you sure?', function(yes){
          if (!yes) return;

          $(e.currentTarget).parents('[name="option"]').remove();
          self.throttledUpdateOptions();
        });
      }
    , 'click [name="stock_create"]': function(e){
        e.preventDefault();

        var self = this;

        var index = this.$el.find('[name="stocks"] [name="stock"]').length || 0;

        var view = Templates.admin_product_stock({
          'option': ''
        , 'path_prefix': 'stocks.' + index + '.'
        , 'index': index
        });

        self.$el.find('[name="stocks"]').append(view);
        self.throttledUpdateOptions();
      }
    , 'click [name="stock"] [name="delete"]': function(e){
        e.preventDefault();
        var self = this;

        bootbox.confirm('Are you sure?', function(yes){
          if (!yes) return;

          $(e.currentTarget).parents('[name="stock"]').remove();
        });
      }
    , 'click [name="media_create"]': function(e){
        e.preventDefault();

        this.loadMedia();
        this.throttledUpdateOptions();
      }
    , 'click [name="media"] [name="delete"]': function(e){
        e.preventDefault();
        var self = this;

        bootbox.confirm('Are you sure?', function(yes){
          if (!yes) return;

          $(e.currentTarget).parents('[name="media"]').remove();
          self.throttledUpdateMedia();
        });
      }
    , 'submit form': function(e){
        e.preventDefault();
      }
    , 'click [name="submit"]': function(e){
        e.preventDefault();

        this.create(function(err, gb){
          if (err) return bootbox.alert(err.message);

          console.log(gb);
        });
      }
    }
  , 'transformers': {
      'split_lines': function(val){
        return Belt.arrayDefalse((val || '').split(/\n+/g));
      }
    , 'to_number': function(val){
        return Belt.cast(val || 0, 'number');
      }
    , 'to_blob': function(val){
        var bs;

        if (val.split(',')[0].indexOf('base64') >= 0){
          bs = atob(val.split(',')[1]);
        } else {
          bs = unescape(val.split(',')[1]);
        }

        var ms = ms.split(',')[0].split(':')[1].split(';')[0]
          , ia = new Uint8Array(bs.length);

        for (var i = 0; i < bs.length; i++){
          ia[i] = bs.charCodeAt(i);
        }

        return new Blob([ia], {
          'type': ms
        });
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['media_dropzone'] = new Dropzone('[name="media_files"]', {
    'url': '#'
  , 'method': 'post'
  , 'acceptedFiles': 'image/*,video/*'
  , 'dictDefaultMessage': 'Add product images'
  , 'addRemoveLinks': true
  });

  gb.view['updateOptions'] = function(){
    var self = gb.view;

    self.$el.find('[name="options"] [name="option"]').each(function(i, e){
      var $e = $(e)
        , opt = $e.find('[data-get="name"]').val();

      $e.attr('data-index', i);
      $e.attr('data-option', opt);

      $e.find('[name^="options."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('name').replace(/^options\.\d+\./, '');

        $e2.attr('name', 'options.' + i + '.' + attr);
      });

      $e.find('[data-get^="options."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-get').replace(/^options\.\d+\./, '');

        $e2.attr('data-get', 'options.' + i + '.' + attr);
      });

      $e.find('[data-set^="options."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-set').replace(/^options\.\d+\./, '');

        $e2.attr('data-set', 'options.' + i + '.' + attr);
      });
    });

    var options = self.getOptions();

    self.$el.find('[name="stocks"] [name="stock"]').each(function(i, e){
      var $e = $(e)
        , index = $e.attr('data-index')
        , prefix = 'stocks.' + index + '.options.';

      var old_opts = [];

      $e.find('[name="stock_option"]').each(function(i2, e2){
        var $e2 = $(e2)
          , o = $e2.attr('data-option');

        if (!options[o]){
          $e2.remove();
        } else {
          old_opts.push(o);
        }
      });

      $e.find('[name="stock_options"]').append(_.map(_.omit(options, old_opts), function(v, k){
        return Templates.admin_product_stock_option({
          'option': k
        , 'path_prefix': prefix
        });
      }).join('\n'));
    });

    self.$el.find('[name="medias"] [name="media"]').each(function(i, e){
      var $e = $(e)
        , index = $e.attr('data-index')
        , prefix = 'media.' + index + '.options.';

      var old_opts = [];

      $e.find('[name="media_option"]').each(function(i2, e2){
        var $e2 = $(e2)
          , o = $e2.attr('data-option');

        if (!options[o]){
          $e2.remove();
        } else {
          old_opts.push(o);
        }
      });

      $e.find('[name="media_options"]').append(_.map(_.omit(options, old_opts), function(v, k){
        return Templates.admin_product_media_option({
          'option': k
        , 'path_prefix': prefix
        });
      }).join('\n'));
    });
  };

  gb.view['updateMedia'] = function(){
    var self = gb.view;

    self.$el.find('[name="medias"] [name="media"]').each(function(i, e){
      var $e = $(e);

      $e.attr('data-index', i);

      $e.find('[name^="media."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('name').replace(/^media\.\d+\./, '');

        $e2.attr('name', 'media.' + i + '.' + attr);
      });

      $e.find('[data-get^="media."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-get').replace(/^options\.\d+\./, '');

        $e2.attr('data-get', 'media.' + i + '.' + attr);
      });

      $e.find('[data-set^="media."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-set').replace(/^options\.\d+\./, '');

        $e2.attr('data-set', 'media.' + i + '.' + attr);
      });
    });
  };

  gb.view['throttledUpdateOptions'] = _.throttle(gb.view.updateOptions, 250, {
    'leading': false
  , 'trailing': true
  });

  gb.view['throttledUpdateMedia'] = _.throttle(gb.view.updateMedia, 250, {
    'leading': false
  , 'trailing': true
  });

  gb.view['getOptions'] = function(){
    var opts = (this.get().options || []);
    opts = _.filter(opts, function(v, k){ return v.name; });
    return _.object(_.pluck(opts, ['name']), opts);
  };

  gb.view['loadMedia'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'index': self.$el.find('[name="media"]').length
    });

    return Async.waterfall([
      function(cb){
        if (_.any(a.o.media)) return cb();

        a.o.media = _.map(Belt.arrayDefalse((self.$el.find('[name="media_urls"]').val() || '').split(/\n+/))
        , function(u){
          return {
            'url': u
          };
        });

        self.$el.find('[name="media_urls"]').val('');

        Async.map(self.media_dropzone.files, function(f, cb2){
          var fr = new FileReader()
            , ocb2 = _.once(cb2);
          fr.readAsDataURL(f);
          fr.onload = function(){
            ocb2(null, {
              'data': fr.result
            });
          };
          fr.onerror = ocb2;
        }, Belt.cs(cb, gb, 'media', 1, 0));
      }
    , function(cb){
        if (!_.any(gb.media)) return cb();

        a.o.media = (a.o.media || []).concat(gb.media);

        self.media_dropzone.removeAllFiles();

        cb();
      }
    , function(cb){
        self.$el.find('[name="medias"]').append(_.map(a.o.media, function(m){
          return Templates.admin_product_media(_.extend({}, m, {
            'path_prefix': 'media.' + a.o.index + '.'
          , 'index': a.o.index++
          }));
        }).join('\n'));

        cb();
      }
    ], function(err){
      a.cb(err);
    });
  };

  gb.view['create'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'data': self.get()
    });

    return Async.waterfall([
      function(cb){
        gb['initial_doc'] = _.pick(a.o.data, [
          'name'
        , 'label'
        , 'description'
        , 'brands'
        , 'categories'
        , 'vendors'
        ]);

        gb.initial_doc['options'] = self.getOptions();

        $.post('/product/create.json', gb.initial_doc, function(json){
          if (Belt.get(json, 'error')) return cb(new Error(json.error));

          gb['doc'] = Belt.get(json, 'data');

          cb();
        });
      }
    , function(cb){
        Async.eachSeries(a.o.data.stocks, function(e, cb2){
          $.post('/product/' + gb.doc._id + '/stock/create.json', e, function(json){
            if (Belt.get(json, 'error')) return cb(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(a.o.data.media, function(e, cb2){
          if (e.local_url){
            $.post('/product/' + gb.doc._id + '/media/create.json', e, function(json){
              if (Belt.get(json, 'error')) return cb(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              cb2();
            });
          } else {

          }
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = View({

  });
});
