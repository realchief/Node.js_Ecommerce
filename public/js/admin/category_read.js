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
      'set:subcategories': function(val, $el){
        $el.val(_.pluck(val, 'name').join(','));
        $el.tagsinput({
          'tagClass': 'label label-primary'
        });
      }
    , 'set:self': function(val, $el){
        $el.attr('data-id', this.data._id);
      }
    , 'get:subcategories': function(val){
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
  $.get('/fixture/category/' + GB._id + '/read.json', function(res){
    GB['data'] = Belt.get(res, 'data');

    GB['view'] = View({
      'data': GB.data
    });

    GB.view.set(GB.data);
  });
});
