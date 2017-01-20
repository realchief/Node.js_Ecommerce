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

        var self = this;

        Controllers[GB.model.name].Update(self.get(), function(err, doc){
          if (err) return bootbox.alert(err.message);
        });
      }
    , 'click [name="upload_new_media"]': function(e){
        e.preventDefault();

        var self = this
          , file = $('[name="new_media"]')[0].files[0];

        Controllers[GB.model.name].MediaCreate({
          '_id': self.get('_id')
        , 'file': file
        }, function(err, doc){
          if (err) return bootbox.alert(err.message);
        });
      }
    , 'click [name="delete"]': function(e){
        e.preventDefault();

        var self = this;

        bootbox.confirm('Are you sure you want to delete this ' + GB.model.name + '?'
        , function(conf){
          if (!conf) return;

          Controllers[GB.model.name].Delete(self.get(), function(err, doc){
            if (err) return bootbox.alert(err.message);

            return document.location = '/admin/' + GB.model.name + '/list';
          });
        });
      }
    , 'click [name="add_new_category"]': function(e){
        e.preventDefault();

        var category = this.$el.find('[name="new_category"]').val()
          , subcategory = this.$el.find('[name="new_subcategory"]').val() || null;

        if (!category) return;

        this.set({
          'categories': this.get('categories').concat([
            {
              'category': category
            , 'subcategory': subcategory
            }
          ])
        });
      }
    , 'click [name="delete_category"]': function(e){
        e.preventDefault();
        $(e.target).parents('.list-group-item').remove();
        this.set({
          'categories': this.get('categories')
        });
      }
    , 'change [name="new_category"]': function(e){
        var val = $(e.target).val();
        if (!val) this.$el.find('[name="new_subcategory"]').val('').trigger('change');
        this.$el.find('[name="new_subcategory"]').prop('disabled', val ? false : true);
      }
    }
  , 'transformers': {
      'set:self': function(val, $el){
        $el.attr('data-id', this.data._id);
      }
    , 'get:colors': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'set:colors': function(val, $el){
        $el.val((val || []).join(','));
        $el.tagsinput({
          'tagClass': 'label label-primary'
        });
      }
    , 'get:sizes': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'set:sizes': function(val, $el){
        $el.val((val || []).join(','));
        $el.tagsinput({
          'tagClass': 'label label-primary'
        });
      }
    , 'get:materials': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'set:materials': function(val, $el){
        $el.val((val || []).join(','));
        $el.tagsinput({
          'tagClass': 'label label-primary'
        });
      }
    , 'get:models': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'set:models': function(val, $el){
        $el.val((val || []).join(','));
        $el.tagsinput({
          'tagClass': 'label label-primary'
        });
      }
    , 'get:brands': function(val){
        return _.map(Belt.arrayDefalse(val.split(',')), function(v){
          return {
            'name': v
          };
        });
      }
    , 'set:brands': function(val, $el){
        $el.val(_.pluck(val, 'name').join(','));
        $el.tagsinput({
          'tagClass': 'label label-primary'
        });
      }
    , 'set:categories': function(val, $el){
        if (_.any(val)){
          this.$el.find('.new-category-column').addClass('col-sm-offset-2');
        } else {
          this.$el.find('.new-category-column').removeClass('col-sm-offset-2');
        }

        return _.any(val) ? Templates.admin_product_category_list({
          'categories': val
        }) : '';
      }
    , 'get:categories': function(val, $el){
        return $el.find('.list-group-item').map(function(i, e){
          var $e = $(e)
            , category = $e.find('[name="category"] strong').html()
            , subcategory = $e.find('[name="subcategory"] strong').html()
            , obj = Belt.objDefalse({
                'category': category
              , 'subcategory': subcategory
              });

          return obj;
        }).toArray() || [];
      }
    , 'set:media': function(val, $el){
        if (_.any(val)){
          this.$el.find('.new-media-column').addClass('col-sm-offset-2');
        } else {
          this.$el.find('.new-media-column').removeClass('col-sm-offset-2');
        }

        return _.any(val) ? Templates.admin_product_media_list({
          'media': val
        }) : '';
      }
    }
  });

  gb['view'] = new Bh.View(a.o);

  /*
  gb.view.$el.find('.i-checks').iCheck({
    'checkboxClass': 'icheckbox_square-green'
  });
  */

  gb.view.$el.find('[name="new_category"]').select2({
    'ajax': {
      'url': function(d){
        return '/category/list.json'
      }
    , 'data': function(d){
        return {
          'query': {
            'name': {
              '$regex': d.term
            , '$options': 'i'
            }
          }
        };
      }
    , 'processResults': function(res){
        var items = _.map(Belt.get(res, 'data') || [], function(v){
          return {
            'id': v.name
          , 'text': v.name
          };
        });

        items.push({
          'id': ''
        , 'text': ''
        });

        return {
          'results': items
        };
      }
    }
  });

  gb.view.$el.find('[name="new_subcategory"]').select2({
    'ajax': {
      'url': function(d){
        return '/category/list.json'
      }
    , 'data': function(d){
        return {
          'query': {
            'name': gb.view.$el.find('[name="new_category"]').val()
          }
        };
      }
    , 'processResults': function(res){
        var items = _.map(Belt.get(res, 'data.0.subcategories') || [], function(v){
          return {
            'id': v.name
          , 'text': v.name
          };
        });

        items.push({
          'id': ''
        , 'text': ''
        });

        return {
          'results': items
        };
      }
    }
  }).prop('disabled', true);

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  Controllers[GB.model.name].Read({'_id': GB._id}, function(err, doc){
    GB['data'] = doc;

    if (err || !GB.data) return document.location = '/admin/' + GB.model.name + '/list';

    GB['view'] = View({
      'data': GB.data
    });

    Socket.emit('room:join', {
      'room': GB.model.name + ':' + GB._id
    });

    Socket.on(GB.model.name + ':' + GB._id + ':update', function(data){
      GB.view.set(data);
    });

    Socket.on(GB.model.name + ':' + GB._id + ':delete', function(data){
      return document.location = '/admin/' + GB.model.name + '/list';
    });

    GB.view.set(GB.data);
  });
});
