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

    gb.canvas.width = _.min([a.o.image.width, a.o.max_width]);
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
      'x': (a.o.x * self.file.width) / self.canvas.width
    , 'y': (a.o.y * self.file.height) / self.canvas.height
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
      'x': (a.o.x * self.canvas.width) / self.image.width
    , 'y': (a.o.y * self.canvas.height) / self.image.height
    };
  };

  gb.view['drawCanvasTarget'] = function(options, callback){
    var a = Belt.argulint(arguments)
      , self = this
      , gb = {};
    a.o = _.defaults(a.o, {
      //coordinates
      //label
      'color': Please.make_color()[0]
    , 'canvas': self.$el.find('canvas')[0]
    });

    gb['context'] = a.o.canvas.getContext('2d');
    gb.context.beginPath();
    gb.context.arc(a.o.coordinates.x, a.o.coordinates.y, 10, 0, 2 * Math.PI);
    gb.context.fillStyle = a.o.color;
    gb.context.fill();

    gb['context'] = a.o.canvas.getContext('2d');
    gb.context.beginPath();
    gb.context.arc(a.o.coordinates.x, a.o.coordinates.y, 16, 0, 2 * Math.PI);
    gb.context.lineWidth = 2;
    gb.context.strokeStyle = a.o.color;
    gb.context.stroke();

    gb['context'] = a.o.canvas.getContext('2d');
    gb.context.fillStyle = 'black';
    gb.context.strokeStyle = 'black';
    gb.context.font = '20px Arial';
    gb.context.fillText(a.o.label, a.o.coordinates.x - 5, a.o.coordinates.y);
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

  gb.view.emit('load');

  return gb.view;
};
