var View = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'el': $('#container')
  , 'triggers': {
      'submit form': function(e){
        e.preventDefault();
      }
    , 'click [name="submit"]': function(e){
        e.preventDefault();

        Create(this.get(), function(err, doc){
          if (err) return bootbox.alert(err.message);

          document.location = '/admin/' + GB.model.name + '/' + doc._id + '/read';
        });
      }
    }
  , 'transformers': {
      'get:subcategories': function(val){
        return _.map(Belt.arrayDefalse(val.split(',')), function(v){
          return {
            'name': v
          };
        });
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view.$el.find('[data-get="subcategories"]').tagsinput({
    'tagClass': 'label label-primary'
  });

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = View({

  });
});
