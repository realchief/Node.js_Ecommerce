var View = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('#container')
  , 'triggers': {
      'click [name="media_create"]': function(e){
        e.preventDefault();

        this.loadMedia();
        this.throttledUpdateOptions();
      }
    }
  , 'transformers': {
      'split_lines': function(val){
        return (val || '').split(/\n+/g);
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['media_dropzone'] = new Dropzone('[name="media_file"]', {
    'url': '#'
  , 'method': 'post'
  , 'acceptedFiles': 'image/*,video/*'
  , 'dictDefaultMessage': 'Add image'
  , 'addRemoveLinks': true
  , 'maxFiles': 1
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
        , 'path_prefix': prefix + k
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
        , 'path_prefix': prefix + k
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

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = View({

  });
});
