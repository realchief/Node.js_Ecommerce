_.extend(GB, {
  'views': {}
, 'container': $('tbody')
});

var View = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    'template': Templates.admin_category_list_row
  , 'triggers': {
      'click [name="delete"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure you want to delete this ' + GB.model.name + '?'
        , function(conf){
          if (!conf) return;

          Delete(self.get(), function(err, doc){
            if (err) return bootbox.alert(err.message);

            return document.location = '/admin/' + GB.model.name + '/list';
          });
        });
      }
    }
  , 'transformers': {
      'set:subcategories': function(val){
        return _.pluck(val || [], 'name').join(', ');
      }
    , 'set:self': function(val, $el){
        $el.attr('data-id', val._id);
      }
    , 'renderActions': function(val){
        return Templates.admin_list_row_actions({
          'model': 'category'
        , '_id': val
        });
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view.emit('load');

  return gb.view;
};

var LoadView = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //data
  });

  return Async.waterfall([
    function(cb){
      if (GB.views[a.o.data._id]){
        gb['view'] = GB.views[a.o.data._id];
      } else {
        gb['view'] = View(a.o);
        gb.view.setEl(gb.view.template(a.o.data));
        GB.container.append(gb.view.$el);
      }

      gb.view.set(a.o.data);

      return cb();
    }
  ], function(err){
    return a.cb(err);
  });
};

$(document).ready(function(){
  List(function(err, docs){
    GB['data'] = docs;

    Async.eachSeries(GB.data, function(d, cb){
      return LoadView({
        'data': d
      }, cb);
    }, Belt.np);
  });
});
