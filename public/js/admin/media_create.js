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
          };
          fr.onerror = ocb;

        } else {
          cb(new Error('No media selected'));
        }
      }
    , function(cb){
        self.media_dropzone.removeAllFiles();
        self.$el.find('[name="media_url"]').val('');

        self['file'] = gb.image;

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

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = View({

  });
});
