var app = function() {
  function run() {
    console.log('Loading App ...');
    if (!window.jQuery) throw new Error('JQuery didn\'t load - it\'s all fucked up.');
    db.load(onLoaded);
  }

  function onLoaded() {
    $('#loading').hide();
    $('#main').removeClass('hidden');
    console.log('App Loaded');
  }

  function disaster(message) {
    $('#main').hide();
    $('#disaster-text').html(message);
    $('#disaster').removeClass('hidden');
  }
  return {
    run,
    disaster
  };
}();

var db = function() {
  var DATA_KEY = 'dae90f9e-2a71-4e0e-bb3c-ed08e7c673cb';
  var _internal = {};
  var _currentUser = null;

  function load(callback) {
    $.get('https://jsonstorage.net/api/items/' + DATA_KEY, function(data) {
      _internal = data;
      console.log('Data Loaded', _internal);
      var userEmail = prompt('Log in by entering your email address here:').trim();
      for (var u = 0; u < _internal.users.length; u++) {
        if (_internal.users[u].email === userEmail) {
          _currentUser = _internal.users[u];
          break;
        }
      }
      if (!_currentUser)
        return app.disaster('That email is not registered as a valid user. Reload the page to try again.') && false;
      _currentUser.lastLogin = new Date();
      save();
      if (UPDATE) {
        $.extend(true, _internal, UPDATE);
        save();
        console.log('Data Updated', _internal);
      }
      if (typeof callback === 'function')
        callback.call();
    });
  }

  function save() {
    $.ajax({
      url: 'https://jsonstorage.net/api/items/' + DATA_KEY,
      type: 'PUT',
      data: JSON.stringify(_internal),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json',
      success: function(data, textStatus, jqXHR) {

      },
      error: function(jqXHR, textStatus, errorThrown) {
        console.error('DB Save Error', {
          jqXHR,
          textStatus,
          errorThrown
        });
        app.disaster('There was an error saving the data.');
      }
    });
  }
  return {
    load
  };
}();
