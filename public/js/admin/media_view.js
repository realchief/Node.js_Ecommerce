var MediaView = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('#container')
  , 'triggers': {
      'click [name="media_create"]': function(e){
        e.preventDefault();

        this.loadMedia();
      }
    , 'click canvas': function(e){
        e.preventDefault();

        var index = this.$el.find('[name="products"] [name="product"]').length || 0
          , coords = this.getCoordinatesOfCanvasClick({
            'event': e
          });

        this.$el.find('[name="products"]').append(Templates.admin_media_product({
          'index': index
        , 'path_prefix': 'products.' + index + '.'
        }));

        this.set(_.object([
          'products.' + index + '.label'
        , 'products.' + index + '.x_coordinate'
        , 'products.' + index + '.y_coordinate'
        ], [
          index
        , coords.x
        , coords.y
        ]));

        this.throttledRenderCanvas();
      }
    , 'click [name="product"] [name="delete"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure?', function(yes){
          if (!yes) return;

          $(e.currentTarget).parents('[name="product"]').remove();

          self.throttledRenderCanvas();
        });
      }
    , 'change [placeholder="product"]': function(e){
        this.loadProductPreview({
          'el': e.currentTarget
        });
      }
    , 'change [data-get*="_coordinate"]': function(e){
        this.throttledRenderCanvas();
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

            document.location = '/admin/media/' + gb.doc._id + '/read';
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
    , 'set:products': function(val){
        var count = 0;
        return _.map(val, function(v, k){
          return Templates.admin_media_product({
            'option': k
          , 'path_prefix': 'products.' + k + '.'
          , 'index': count++
          , '_id': v._id
          });
        });
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

  gb.view['loadMedia'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    return Async.waterfall([
      function(cb){
        if (self.$el.find('[name="media_url"]').val()){
          gb['image'] = new Image();
          gb.image.onload = function(){
            cb();
          };
          gb.image.src = self.$el.find('[name="media_url"]').val();
        } else if (Belt.get(self, 'media_dropzone.files.0')){
          var fr = new FileReader()
            , ocb = _.once(cb);

          fr.readAsDataURL(self.media_dropzone.files[0]);
          fr.onload = function(){
            gb['image'] = new Image();
            gb.image.onload = function(){
              ocb();
            };
            gb.image.src = fr.result;
            self['filename'] = self.media_dropzone.files[0].name;
          };
          fr.onerror = ocb;

        } else {
          cb(new Error('No media selected'));
        }
      }
    , function(cb){
        self['file'] = gb.image;
        self['filename'] = Belt.get(self, 'media_dropzone.files.0.name');

        self.media_dropzone.removeAllFiles();
        self.$el.find('[name="media_url"]').val('');
        self.$el.find('[name="products"]').html('');

        self.setCanvasBackgroundImage({
          'image': self.file
        });

        cb();
      }
    ], function(err){
      a.cb(err);
    });
  };

  gb.view['loadImage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //url
    });

    gb['image'] = new Image();
    gb.image.onload = function(){
      self['file'] = gb.image;
      self.setCanvasBackgroundImage({
        'image': self.file
      });
      a.cb();
    };
    gb.image.src = a.o.url;
  };

  gb.view['setCanvasBackgroundImage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'canvas_container': self.$el.find('[name="canvas"]')
    , 'max_width': self.$el.find('.ibox-content').width()
      //image
    });

    a.o.canvas_container.html('<canvas></canvas>');
    gb['canvas'] = a.o.canvas_container.find('canvas')[0];

    self['canvas'] = gb.canvas;

    gb.canvas.width = 445; //_.min([a.o.image.width, a.o.max_width]);
    gb.canvas.height = (a.o.image.height * gb.canvas.width) / a.o.image.width;

    gb['context'] = gb.canvas.getContext('2d');
    gb.context.drawImage(a.o.image, 0, 0, gb.canvas.width, gb.canvas.height);

    a.o.canvas_container.css({
      'display': 'block'
    });
  };

  gb.view['getCoordinatesOfCanvasClick'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //event
      'canvas': self.$el.find('canvas')
    });

    var coff = a.o.canvas.offset();
    return {
      'x': a.o.event.clientX + document.body.scrollLeft + document.documentElement.scrollLeft - coff.left
    , 'y': a.o.event.clientY + document.body.scrollTop + document.documentElement.scrollTop - coff.top + 1
    };
  };

  gb.view['getImageCoordinatesFromCanvas'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'canvas': self.canvas
    , 'image': self.file
      //x
      //y
    });

    return {
      'x': (a.o.x * a.o.image.width) / a.o.canvas.width
    , 'y': (a.o.y * a.o.image.height) / a.o.canvas.height
    };
  };

  gb.view['getCanvasCoordinatesFromImage'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'canvas': self.canvas
    , 'image': self.file
      //x
      //y
    });

    return {
      'x': (a.o.x * a.o.canvas.width) / a.o.image.width
    , 'y': (a.o.y * a.o.canvas.height) / a.o.image.height
    };
  };

  gb.view['drawCanvasTarget'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //coordinates
      //label
      'color': '#61d2fe'//Please.make_color()[0]
    , 'canvas': self.$el.find('canvas')[0]
    });

    a.o.coordinates = _.mapObject(a.o.coordinates, function(c){
      return Belt.cast(c, 'number');
    });

    gb['context'] = a.o.canvas.getContext('2d');
    gb.context.beginPath();
    gb.context.arc(a.o.coordinates.x + 8, a.o.coordinates.y + 8, 8, 0, 2 * Math.PI);
    gb.context.fillStyle = a.o.color;
    gb.context.fill();

/*
    gb['context'] = a.o.canvas.getContext('2d');
    gb.context.beginPath();
    gb.context.arc(a.o.coordinates.x, a.o.coordinates.y, 16, 0, 2 * Math.PI);
    gb.context.lineWidth = 2;
    gb.context.strokeStyle = a.o.color;
    gb.context.stroke();
*/

    gb['context'] = a.o.canvas.getContext('2d');
    gb.context.fillStyle = 'black';
    gb.context.strokeStyle = 'black';
    gb.context.font = '16px Arial';
    gb.context.fillText(a.o.label, a.o.coordinates.x + 4, a.o.coordinates.y + 14);
  };

  gb.view['renderCanvas'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    self.setCanvasBackgroundImage({
      'image': self.file
    });

    gb['targets'] = Belt.get(self.get(), 'products');

    _.each(gb.targets, function(t){
      self.drawCanvasTarget({
        'label': t.label
      , 'coordinates': {
          'x': t.x_coordinate
        , 'y': t.y_coordinate
        }
      });
    });
  };

  gb.view['throttledRenderCanvas'] = _.throttle(gb.view.renderCanvas, 500, {
    'trailing': true
  , 'leading': false
  });

  gb.view['getSelf'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    var obj = self.get();
    obj.products = _.chain(obj.products)
                    .reject(function(p){
                      return !p.product;
                    })
                    .map(function(p){
                      var p2 = Belt.copy(p);
                      delete p2.label;
                      var coords = self.getImageCoordinatesFromCanvas({
                        'x': p2.x_coordinate
                      , 'y': p2.y_coordinate
                      });
                      p2.x_coordinate = coords.x;
                      p2.y_coordinate = coords.y;
                      return p2;
                    })
                    .value();

    if (!self.file) return obj;

    if (self.file.src.match(/^http/)){
      obj['remote_url'] = self.file.src;
    } else {
      obj['file'] = self.transformers.to_blob(self.file.src);
      obj['filename'] = self.filename;
    }

    return obj;
  };

  gb.view['create'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      'data': self.getSelf()
    });

    return Async.waterfall([
      function(cb){
        if (a.o.data.remote_url){
          $.post('/media/create.json', a.o.data, function(json){
            if (Belt.get(json, 'error')) return cb(new Error(json.error));

            gb['doc'] = Belt.get(json, 'data');

            cb();
          });
        } else if (a.o.data.file) {
          var fd = new FormData()
            , ocb = _.once(cb);

          fd.append('json', JSON.stringify(_.omit(a.o.data, [
            'file'
          ])));
          fd.append('file', a.o.data.file, a.o.data.filename);

          $.ajax({
            'url': '/media/create.json'
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

    self.loadImage({
      'url': a.o.doc.url
    }, function(){
      self.$el.find('[name="media_new"]').hide('');

      _.each(a.o.doc.products, function(d){
        var coords = self.getCanvasCoordinatesFromImage({
          'x': Belt.cast(d.x_coordinate, 'number')
        , 'y': Belt.cast(d.y_coordinate, 'number')
        });

        d.x_coordinate = coords.x;
        d.y_coordinate = coords.y;
      });

      self.set(Belt.objFlatten(a.o.doc));

      self.$el.find('[name="product"] [placeholder="product"]').each(function(i, e){
        self.loadProductPreview({
          'el': e
        });
      });

      self.renderCanvas();

      self['doc'] = a.o.doc;
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

  gb.view['update'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {

    });

    gb['data'] = self.getSelf();

    gb['update'] = _.pick(gb.data, [
      'label'
    , 'slug'
    , 'hide'
    , 'description'
    , 'products'
    ]);

    gb.update.products = _.filter(gb.update.products, function(s){
      return s.product;
    });

    gb.update = _.omit(gb.update, function(v, k){
      return Belt.equal(v, self.doc[k]);
    });

    if (Belt.equal(gb.update.products, [])) gb.update.products = [''];

    Async.waterfall([
      function(cb){
        $.post('/media/' + self._id + '/update.json', gb.update, function(json){
          if (Belt.get(json, 'error')) return cb(new Error(json.error));

          gb['doc'] = Belt.get(json, 'data');

          cb();
        });
      }
    ], function(err){
      a.cb(err, gb);
    });
  };

  gb.view['method'] = a.o.method;
  gb.view['_id'] = a.o._id;

  gb.view.emit('load');

  return gb.view;
};
