var ProductView = function(options, callback){
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
          self.throttledUpdateStocks();
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

        var self = this;

        if (self.method === 'update'){
          self.update(function(err, gb){
            if (err) return bootbox.alert(err.message);

            self.loadDoc({
              'doc': gb.doc
            });
          });
        } else {
          self.create(function(err, gb){
            if (err) return bootbox.alert(err.message);

            document.location = '/admin/product/' + gb.doc._id + '/read';
          });
        }
      }
    }
  , 'transformers': {
      'split_lines': function(val){
        return Belt.arrayDefalse((val || '').split(/\n+/g));
      }
    , 'join_lines': function(val){
        return (val || []).join('\n');
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

        var ms = val.split(',')[0].split(':')[1].split(';')[0]
          , ia = new Uint8Array(bs.length);

        for (var i = 0; i < bs.length; i++){
          ia[i] = bs.charCodeAt(i);
        }

        return new Blob([ia], {
          'type': ms
        });
      }
    , 'set:options': function(val){
        var count = 0;
        return _.map(val, function(v, k){
          return Templates.admin_product_option({
            'option': k
          , 'path_prefix': 'options.' + k + '.'
          , 'index': count++
          });
        });
      }
    , 'set:stocks': function(val){
        return _.map(val, function(v, k){
          return Templates.admin_product_stock({
            'path_prefix': 'stocks.' + k + '.'
          , 'index': k
          , '_id': v._id
          , 'options': v.options
          });
        });
      }
    , 'set:media': function(val){
        return _.map(val, function(v, k){
          return Templates.admin_product_media({
            'path_prefix': 'media.' + k + '.'
          , 'index': k
          , '_id': v._id
          , 'url': v.url
          , 'filename': ''
          , 'options': v.options
          });
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
          , attr = $e2.attr('name').replace(/^options\.[^\.]+\./, '');

        $e2.attr('name', 'options.' + i + '.' + attr);
      });

      $e.find('[data-get^="options."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-get').replace(/^options\.[^\.]+\./, '');

        $e2.attr('data-get', 'options.' + i + '.' + attr);
      });

      $e.find('[data-set^="options."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-set').replace(/^options\.[^\.]+\./, '');

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

  gb.view['updateStocks'] = function(){
    var self = gb.view;

    self.$el.find('[name="stocks"] [name="stock"]').each(function(i, e){
      var $e = $(e);

      $e.attr('data-index', i);
      if ($e.attr('data-get')) $e.attr('data-get', 'stocks.' + i + '._id');

      $e.find('[name^="stocks."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('name').replace(/^stocks\.[^\.]+\./, '');

        $e2.attr('name', 'stocks.' + i + '.' + attr);
      });

      $e.find('[data-get^="stocks."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-get').replace(/^stocks\.[^\.]+\./, '');

        $e2.attr('data-get', 'stocks.' + i + '.' + attr);
      });

      $e.find('[data-set^="stocks."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-set').replace(/^stocks\.[^\.]+\./, '');

        $e2.attr('data-set', 'stocks.' + i + '.' + attr);
      });
    });
  };

  gb.view['updateMedia'] = function(){
    var self = gb.view;

    self.$el.find('[name="medias"] [name="media"]').each(function(i, e){
      var $e = $(e);

      $e.attr('data-index', i);
      if ($e.attr('data-get')) $e.attr('data-get', 'media.' + i + '._id');

      $e.find('[name^="media."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('name').replace(/^media\.[^\.]+\./, '');

        $e2.attr('name', 'media.' + i + '.' + attr);
      });

      $e.find('[data-get^="media."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-get').replace(/^media\.[^\.]+\./, '');

        $e2.attr('data-get', 'media.' + i + '.' + attr);
      });

      $e.find('[data-set^="media."]').each(function(i2, e2){
        var $e2 = $(e2)
          , attr = $e2.attr('data-set').replace(/^media\.[^\.]+\./, '');

        $e2.attr('data-set', 'media.' + i + '.' + attr);
      });
    });
  };

  gb.view['throttledUpdateOptions'] = _.throttle(gb.view.updateOptions, 250, {
    'leading': false
  , 'trailing': true
  });

  gb.view['throttledUpdateStocks'] = _.throttle(gb.view.updateStocks, 250, {
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
          , 'filename': u.split('/').pop()
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
            , 'filename': f.name
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
            if (Belt.get(json, 'error')) return cb2(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(a.o.data.media, function(e, cb2){
          if (e.remote_url){
            $.post('/product/' + gb.doc._id + '/media/create.json', e, function(json){
              if (Belt.get(json, 'error')) return cb2(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              cb2();
            });
          } else if (e.file) {
            var fd = new FormData()
              , ocb2 = _.once(cb2);

            fd.append('json', JSON.stringify(_.omit(e, [
              'file'
            ])));
            fd.append('file', e.file, e.filename);

            $.ajax({
              'url': '/product/' + gb.doc._id + '/media/create.json'
            , 'type': 'POST'
            , 'data': fd
            , 'cache': false
            , 'dataType': 'json'
            , 'processData': false
            , 'contentType': false
            , 'success': function(json){
                if (Belt.get(json, 'error')) return ocb2(new Error(json.error));

                gb['doc'] = Belt.get(json, 'data');

                ocb2();
              }
            });
          }
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view['loadDoc'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //doc
    });

    self.set(Belt.objFlatten(a.o.doc));
    self.throttledUpdateOptions();
    self.throttledUpdateStocks();
    self.throttledUpdateMedia();
    self['doc'] = a.o.doc;
  };

  gb.view['update'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['data'] = self.get();

    gb['update'] = _.pick(gb.data, [
      'name'
    , 'label'
    , 'description'
    , 'vendors'
    , 'brands'
    , 'categories'
    ].concat(self.update_media ? [
      'media'
    ] : []));

    gb.update['options'] = self.getOptions();

    gb.update = _.omit(gb.update, function(v, k){
      return Belt.equal(v, self.doc[k]);
    });

    gb['new_stocks'] = _.filter(gb.data.stocks, function(s){
      return !s._id;
    });

    gb['update_stocks'] = _.chain(gb.data.stocks)
                           .filter(function(s){
                             return s._id;
                           })
                           .filter(function(s){
                             var ex_stock = _.find(self.doc.stocks, function(s2){
                               return s2._id === s._id;
                             });

                             return !Belt.equal(s, _.pick(ex_stock, _.keys(s)));
                           })
                           .value();

    gb['delete_stocks'] = _.chain(self.doc.stocks)
                           .filter(function(s){
                             return !_.some(gb.data.stocks, function(s2){
                               return s2._id === s._id
                             });
                           })
                           .pluck('_id')
                           .value();

    gb['new_media'] = _.filter(gb.data.media, function(s){
      return !s._id;
    });

    gb.data.media = _.filter(gb.data.media, function(s){
      return s._id;
    });

    if (!self.update_media){
      gb['update_media'] = _.chain(gb.data.media)
                            .filter(function(s){
                              return s._id;
                            })
                            .map(function(s){
                              return _.omit(s, [
                                'remote_url'
                              , 'filename'
                              , 'file'
                              ]);
                            })
                            .filter(function(s){
                              var ex = _.find(self.doc.media, function(s2){
                                return s2._id === s._id;
                              });

                              return !Belt.equal(s, _.pick(ex, _.keys(s)));
                            })
                            .value();

      gb['delete_media'] = _.chain(self.doc.media)
                            .filter(function(s){
                              return !_.some(gb.data.media, function(s2){
                                return s2._id === s._id
                              });
                            })
                            .pluck('_id')
                            .value();
    }

    delete self.update_media;

    Async.waterfall([
      function(cb){
        $.post('/product/' + self._id + '/update.json', gb.update, function(json){
          if (Belt.get(json, 'error')) return cb(new Error(json.error));

          gb['doc'] = Belt.get(json, 'data');

          cb();
        });
      }
    , function(cb){
        Async.eachSeries(gb.delete_stocks, function(e, cb2){
          var ocb2 = _.once(cb2);

          $.ajax({
            'url': '/product/' + gb.doc._id + '/stock/' + e + '/delete.json'
          , 'type': 'DELETE'
          , 'cache': false
          , 'dataType': 'json'
          , 'processData': false
          , 'contentType': false
          , 'success': function(json){
              if (Belt.get(json, 'error')) return ocb2(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              ocb2();
            }
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(gb.update_stocks, function(e, cb2){
          $.post('/product/' + gb.doc._id + '/stock/' + e._id + '/update.json', _.omit(e, [
            '_id'
          ]), function(json){
            if (Belt.get(json, 'error')) return cb2(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(gb.new_stocks, function(e, cb2){
          $.post('/product/' + gb.doc._id + '/stock/create.json', e, function(json){
            if (Belt.get(json, 'error')) return cb2(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(gb.delete_media, function(e, cb2){
          var ocb2 = _.once(cb2);

          $.ajax({
            'url': '/product/' + gb.doc._id + '/media/' + e + '/delete.json'
          , 'type': 'DELETE'
          , 'cache': false
          , 'dataType': 'json'
          , 'processData': false
          , 'contentType': false
          , 'success': function(json){
              if (Belt.get(json, 'error')) return ocb2(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              ocb2();
            }
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(gb.update_media, function(e, cb2){
          $.post('/product/' + gb.doc._id + '/media/' + e._id + '/update.json', _.omit(e, [
            '_id'
          ]), function(json){
            if (Belt.get(json, 'error')) return cb2(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb2();
          });
        }, Belt.cw(cb, 0));
      }
    , function(cb){
        Async.eachSeries(gb.new_media, function(e, cb2){
          if (e.remote_url){
            $.post('/product/' + gb.doc._id + '/media/create.json', e, function(json){
              if (Belt.get(json, 'error')) return cb2(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              cb2();
            });
          } else if (e.file) {
            var fd = new FormData()
              , ocb2 = _.once(cb2);

            fd.append('json', JSON.stringify(_.omit(e, [
              'file'
            ])));
            fd.append('file', e.file, e.filename);

            $.ajax({
              'url': '/product/' + gb.doc._id + '/media/create.json'
            , 'type': 'POST'
            , 'data': fd
            , 'cache': false
            , 'dataType': 'json'
            , 'processData': false
            , 'contentType': false
            , 'success': function(json){
                if (Belt.get(json, 'error')) return ocb2(new Error(json.error));

                gb['doc'] = Belt.get(json, 'data');

                ocb2();
              }
            });
          }
        }, Belt.cw(cb, 0));
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view['sortable_media'] = new Sortable(gb.view.$el.find('[name="medias"]')[0], {
    'onUpdate': function(){
      gb.view.updateMedia();
      gb.view['update_media'] = true;
    }
  });

  gb.view['method'] = a.o.method;
  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};
