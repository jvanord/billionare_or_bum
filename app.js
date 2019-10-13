var app = function() {
  function run() {
    console.log('Loading App ...');
    if (!window.jQuery) return disaster('JQuery didn\'t load - it\'s all fucked up. Maybe try relaoding the page?');
    db.load(onLoaded);
  }

  function onLoaded() {
    $('#loading').hide();
    $('#main').removeClass('hidden');
    showProgress();
    console.log('App Loaded');
  }

  function disaster(message) {
    $('#main').hide();
    $('#disaster-text').html(message);
    $('#disaster').removeClass('hidden');
  }

  function showProgress() {
    var user = db.getUser();
    var possible = db.totalPoints();
    $('#daysleft-days').text(getDaysLeft());
    $('#daysleft-name').text(user.name);
    var totalW = $('#progress').width() - $('#loser').width() - $('#winner').width();
    if (user.points > 0) {
      var percent = user.points / possible;
      $('#progress-bar').removeClass('noprogress').animate({
        width: totalW * percent
      }).text(Math.round(percent * 100) + '%');
    } else {
      $('#progress-bar').addClass('noprogress').css({
        'width': totalW + 'px',
      }).text('NO PROGRESS');
    }
  }

  function showQuestions() {
		
  }

  function getDaysLeft() {
    var now = new Date();
    var end = new Date(2019, 11, 28);
    return Math.round((end - now) / (1000 * 60 * 60 * 24));
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
      if (userEmail == 'Q') userEmail = 'jvanord@indasysllc.com';
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
    load,
    totalPoints: function() {
      return _internal.totalPoints;
    },
    getUser: function() {
      return $.extend({}, _currentUser);
    }
  };
}();
