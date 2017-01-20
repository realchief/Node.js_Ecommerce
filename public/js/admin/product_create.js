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

        Controllers[GB.model.name].Create(this.get(), function(err, doc){
          if (err) return bootbox.alert(err.message);

          document.location = '/admin/' + GB.model.name + '/' + doc._id + '/read';
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
    }
  , 'transformers': {
      'get:colors': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'get:sizes': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'get:materials': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'get:models': function(val){
        return Belt.arrayDefalse(val.split(','));
      }
    , 'get:brands': function(val){
        return _.map(Belt.arrayDefalse(val.split(',')), function(v){
          return {
            'name': v
          };
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
    }
  });

  gb['view'] = new Bh.View(a.o);

  gb.view.$el.find('[data-get="colors"]').tagsinput({
    'tagClass': 'label label-primary'
  });

  gb.view.$el.find('[data-get="sizes"]').tagsinput({
    'tagClass': 'label label-primary'
  });

  gb.view.$el.find('[data-get="materials"]').tagsinput({
    'tagClass': 'label label-primary'
  });

  gb.view.$el.find('[data-get="models"]').tagsinput({
    'tagClass': 'label label-primary'
  });

  gb.view.$el.find('[data-get="brands"]').tagsinput({
    'tagClass': 'label label-primary'
  });

  gb.view.$el.find('.i-checks').iCheck({
    'checkboxClass': 'icheckbox_square-green'
  });

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

        return {
          'results': items
        };
      }
    }
  });

  gb.view.emit('load');

  return gb.view;
};

$(document).ready(function(){
  GB['view'] = View({

  });
});
