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
    }
  , 'transformers': {
      'get:subcategories': function(val){
        return _.map(val.split(','), function(v){
          return {
            'name': v
          };
        });
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = View({

  });
});
