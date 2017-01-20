Controllers[GB.model.name] = {};

Controllers[GB.model.name]['List'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {

  });

  return Async.waterfall([
    function(cb){
      return $.post('/' + GB.model.name + '/list.json', a.o, function(res){
        if (res.error) return cb(new Error(res.error));

        gb['docs'] = res.data;

        return cb();
      });
    }
  ], function(err){
    return a.cb(err, gb.docs);
  });
};

Controllers[GB.model.name]['Create'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //name
    //description
    //subcategories
  });

  return Async.waterfall([
    function(cb){
      if (!a.o.name) return cb(new Error('Name is required'));

      return $.post('/' + GB.model.name + '/create.json', a.o, function(res){
        if (res.error) return cb(new Error(res.error));

        gb['doc'] = res.data;

        return cb();
      });
    }
  ], function(err){
    return a.cb(err, gb.doc);
  });
};

Controllers[GB.model.name].Read = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //_id
  });

  return Async.waterfall([
    function(cb){
      return $.get('/' + GB.model.name + '/' + a.o._id + '/read.json'
      , function(res){
        if (res.error) return cb(new Error(res.error));

        gb['doc'] = res.data;

        return cb();
      });
    }
  ], function(err){
    return a.cb(err, gb.doc);
  });
};

Controllers[GB.model.name]['Update'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //_id
  });

  return Async.waterfall([
    function(cb){
      if (!a.o.name) return cb(new Error('Name is required'));

      gb['data'] = {
        '$set': _.pick(a.o, [
          'name'
        , 'description'
        , 'gender'
        , 'season'
        , 'limited_edition'
        , 'collaboration'
        ])
      , '$unset': []
      };

      _.each([
        'colors'
      , 'sizes'
      , 'materials'
      , 'models'
      , 'brands'
      , 'categories'
      ], function(v){
        if (!_.any(a.o[v])){
          gb.data.$unset.push(v);
        } else {
          gb.data.$set[v] = a.o[v];
        }
      });

      return $.post('/' + GB.model.name + '/' + a.o._id + '/update.json'
      , gb.data
      , function(res){
        if (res.error) return cb(new Error(res.error));

        gb['doc'] = res.data;

        return cb();
      });
    }
  ], function(err){
    return a.cb(err, gb.doc);
  });
};

Controllers[GB.model.name]['Delete'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //_id
  });

  return Async.waterfall([
    function(cb){
      return $.get('/' + GB.model.name + '/' + a.o._id + '/delete.json'
      , function(res){
        if (res.error) return cb(new Error(res.error));

        return cb();
      });
    }
  ], function(err){
    return a.cb(err);
  });
};

Controllers[GB.model.name]['MediaCreate'] = function(options, callback){
  var a = Belt.argulint(arguments)
    , self = this
    , gb = {};
  a.o = _.defaults(a.o, {
    //_id
    //file
  });

  return Async.waterfall([
    function(cb){
      if (!a.o._id) return cb(new Error('_id is required'));
      if (!a.o.file) return cb(new Error('file is required'));

      gb['fd'] = new FormData();

      gb.fd.append('file', a.o.file);

      var ocb = _.once(cb);

      $.ajax({
        'url': '/' + GB.model.name + '/' + a.o._id + '/media/create.json'
      , 'type': 'POST'
      , 'data': gb.fd
      , 'processData': false
      , 'contentType': false
      , 'success': function(){
          return cb();
        }
      , 'error': Belt.np
      });
    }
  ], function(err){
    return a.cb(err, gb.doc);
  });
};
