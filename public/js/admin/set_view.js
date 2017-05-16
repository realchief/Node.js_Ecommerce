var SetView = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('#container')
  , 'triggers': {
      'click [name="featured_media_create"]': function(e){
        e.preventDefault();

        this.loadMedia();
      }
    , 'click [name="media_create"]': function(e){
        e.preventDefault();

        var self = this;

        var view = Templates.admin_set_media({

        });

        self.$el.find('[name="medias"]').append(view);
      }
    , 'click [name="product_create"]': function(e){
        e.preventDefault();

        var self = this;

        var view = Templates.admin_set_product({

        });

        self.$el.find('[name="products"]').append(view);
      }
    , 'click [name="product"] [name="delete"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure?', function(yes){
          if (!yes) return;

          $(e.currentTarget).parents('[name="product"]').remove();
        });
      }
    , 'click [name="media"] [name="delete"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure?', function(yes){
          if (!yes) return;

          $(e.currentTarget).parents('[name="media"]').remove();
        });
      }
    , 'change [name="product"] [name="_id"]': function(e){
        this.loadProductPreview({
          'el': e.currentTarget
        });
      }
    , 'change [name="media"] [name="_id"]': function(e){
        this.loadMediaPreview({
          'el': e.currentTarget
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

            document.location = '/admin/set/' + gb.doc._id + '/read';
          });
        }
      }
    }
  , 'transformers': {
      'split_lines': function(val){
        return (val || '').split(/\n+/g);
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
    , 'set:featured_media': function(val){
        if (val.url && val.url.match(/^http/)) val.url += '?i=' + Belt.uuid();
        return '<image src="' + val.url + '" class="img-responsive">';
      }
    , 'get:products': function(val, $el){
        var vals = [];

        $el.find('[name="_id"]').each(function(i, e){
          var v = $(e).val();
          if (v) vals.push(v);
        });
        return vals;
      }
    , 'set:products': function(val){
        var count = 0;
        return _.map(val, function(v, k){
          return Templates.admin_set_product({
            'path_prefix': 'products.' + k
          , '_id': v._id
          });
        });
      }
    , 'get:media': function(val, $el){
        var vals = [];
        $el.find('[name="_id"]').each(function(i, e){
          var val = $(e).val();
          if (val) vals.push(val);
        });
        return vals;
      }
    , 'set:media': function(val){
        var count = 0;
        return _.map(val, function(v, k){
          return Templates.admin_set_media({
            'path_prefix': 'media.' + k
          , '_id': v._id
          });
        });
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view['media_dropzone'] = new Dropzone('[name="featured_media_file"]', {
    'url': '#'
  , 'method': 'post'
  , 'acceptedFiles': 'image/*,video/*'
  , 'dictDefaultMessage': 'Add image'
  , 'addRemoveLinks': true
  , 'maxFiles': 1
  });

  gb.view['loadMedia'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        if (self.$el.find('[name="featured_media_url"]').val()){
          self['featured_media'] = {
            'remote_url': self.$el.find('[name="featured_media_url"]').val()
          };
          self.set({
            'featured_media': {
              'url': self.featured_media.remote_url
            }
          });
        } else if (Belt.get(self, 'media_dropzone.files.0')){
          var fr = new FileReader()
            , ocb = _.once(cb);

          fr.readAsDataURL(self.media_dropzone.files[0]);
          fr.onload = function(){
            self['featured_media'] = {
              'file': self.transformers.to_blob(fr.result)
            , 'filename': self.media_dropzone.files[0].name
            };
            self.set({
              'featured_media': {
                'url': fr.result
              }
            });
            ocb();
          };
          fr.onerror = ocb;

        } else {
          cb(new Error('No media selected'));
        }
      }
    , function(cb){
        self.media_dropzone.removeAllFiles();
        self.$el.find('[name="featured_media_url"]').val('');

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
      'data': _.extend({}, self.get(), self.featured_media)
    });

    return Async.waterfall([
      function(cb){
        if (Belt.get(a.o.data, 'remote_url')){
          $.post('/set/create.json', a.o.data, function(json){
            if (Belt.get(json, 'error')) return cb(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb();
          });
        } else if (Belt.get(a.o.data, 'file')){
          var fd = new FormData()
            , ocb = _.once(cb);

          var data = Belt.copy(a.o.data);
          Belt.delete(data, 'file');

          fd.append('json', JSON.stringify(_.omit(data, [
          ])));
          fd.append('file', a.o.data.file, a.o.data.filename);

          $.ajax({
            'url': '/set/create.json'
          , 'type': 'POST'
          , 'data': fd
          , 'cache': false
          , 'dataType': 'json'
          , 'processData': false
          , 'contentType': false
          , 'success': function(json){
              if (Belt.get(json, 'error')) return ocb(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              ocb();
            }
          });
        } else {
          cb(new Error('Featured media is required'));
        }
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

    self['doc'] = Belt.copy(a.o.doc);

    var doc = _.extend({}, a.o.doc, Belt.objFlatten(_.pick(a.o.doc, [
      'label'
    , 'description'
    ])));
    self.set(doc);

    self.$el.find('[name="product"] [name="_id"]').each(function(i, e){
      self.loadProductPreview({
        'el': e
      });
    });

    self.$el.find('[name="media"] [name="_id"]').each(function(i, e){
      self.loadMediaPreview({
        'el': e
      });
    });
  };

  gb.view['loadProductPreview'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //el
    });

    var $el = $(a.o.el)
      , val = $el.val();

    $.getJSON('/product/' + val + '/read.json', function(res){
      if (!Belt.get(res, 'data._id')){
        $el.val('')
        $el.parents('[name="product"]').find('[name="product_preview"]').html(
          '<div class="alert alert-warning">Product SKU not found</div>'
        );
      } else {
        $el.parents('[name="product"]').find('[name="product_preview"]').html(
          Templates.admin_product_preview(res.data)
        );
      }
    });
  };

  gb.view['loadMediaPreview'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //el
    });

    var $el = $(a.o.el)
      , val = $el.val();

    $.getJSON('/media/' + val + '/read.json', function(res){
      if (!Belt.get(res, 'data._id')){
        $el.val('')
        $el.parents('[name="media"]').find('[name="media_preview"]').html(
          '<div class="alert alert-warning">Media not found</div>'
        );
      } else {
        $el.parents('[name="media"]').find('[name="media_preview"]').html(
          Templates.admin_media_preview(res.data)
        );
      }
    });
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
    , 'products'
    , 'media'
    , 'brand'
    ]);

    if (self.featured_media){
      _.extend(gb.update, self.featured_media);
    }

    gb.update = _.omit(gb.update, function(v, k){
      return Belt.equal(v, self.doc[k]);
    });

    if (Belt.equal(gb.update.products, [])) gb.update.products = [''];
    if (Belt.equal(gb.update.media, [])) gb.update.media = [''];

    Async.waterfall([
      function(cb){
        if (Belt.get(gb.update, 'file')){
          var fd = new FormData()
            , ocb = _.once(cb);

          var data = Belt.copy(gb.update);
          Belt.delete(data, 'file');

          fd.append('json', JSON.stringify(_.omit(data, [
          ])));
          fd.append('file', gb.update.file, gb.update.filename);

          $.ajax({
            'url': '/set/' + self._id + '/update.json'
          , 'type': 'POST'
          , 'data': fd
          , 'cache': false
          , 'dataType': 'json'
          , 'processData': false
          , 'contentType': false
          , 'success': function(json){
              if (Belt.get(json, 'error')) return ocb(new Error(json.error));

              gb['doc'] = Belt.get(json, 'data');

              ocb();
            }
          });
        } else {
          $.post('/set/' + self._id + '/update.json', gb.update, function(json){
            if (Belt.get(json, 'error')) return cb(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb();
          });
        }
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view['sortable_products'] = new Sortable(gb.view.$el.find('[name="products"]')[0]);
  gb.view['sortable_media'] = new Sortable(gb.view.$el.find('[name="medias"]')[0]);

  gb.view['method'] = a.o.method;
  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};
