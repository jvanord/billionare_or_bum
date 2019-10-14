var BILLIONAIRE = 'BILLIONAIRE';
var BUM = 'BUM';

var app = function () {

	function run() {
		console.log('Loading App ...');
		if (!window.jQuery) return disaster('JQuery didn\'t load - it\'s all fucked up. Maybe try relaoding the page?');
		db.load(onLoaded);
	}

	function onLoaded() {
		$('#loading').hide();
		$('#main').removeClass('hidden');
		updateProgress();
		refreshQuestions();
		console.log('App Loaded');
	}

	function disaster(message) {
		$('#main').hide();
		$('#disaster-text').html(message);
		$('#disaster').removeClass('hidden');
	}

	function updateProgress() {
		var user = db.getUser();
		var possible = db.getPossiblePoints();
		$('#daysleft-days').text(getDaysLeft());
		$('#daysleft-name').text(user.name);
		$('#daysleft-points').text(user.points || 0);
		$('#daysleft-possible').text(possible);
		var totalW = $('#progress').width() - $('#loser').width() - $('#winner').width();
		if (user.points > 0) {
			var percent = user.points / possible;
			if (percent >= 100) {
				percent = 100;
				$('#youwin').removeClass('hidden');
			}
			$('#progress-bar').removeClass('noprogress').animate({
				width: totalW * percent
			}).text(Math.round(percent * 100) + '%');
		} else {
			$('#progress-bar').addClass('noprogress').css({
				'width': totalW + 'px'
			}).text('NO PROGRESS');
		}
	}

	function getDaysLeft() {
		var now = new Date();
		var end = new Date(2019, 11, 28);
		return Math.round((end - now) / (1000 * 60 * 60 * 24));
	}

	function refreshQuestions() {
		$('#answered,#unanswered').html('');
		var unanswered = db.getUnansweredQuestions();
		if (!unanswered.length) {
			$('#unanswered').append($('<li/>').addClass('none')
				.text('You have answered every quiz available so far. Come back tomorrow for a new one.'));
		}
		for (var i = 0; i < unanswered.length; i++) {
			$('#unanswered').append($createUnansweredLi(unanswered[i]));
		}
		var answered = db.getAnsweredQuestions();
		for (var i = 0; i < answered.length; i++) {
			$('#answered').append($createAnsweredLi(answered[i]));
		}
	}

	function $createUnansweredLi(q) {
		return $('<li/>')
			.append($('<h2/>').text('Billionaire or Bum?'))
			.append($('<img/>').attr('src', q.image))
			.append($('<div/>').addClass('buttons')
				.append($('<a/>').text('Billionaire').attr('href', '#').click(function (e) {
					e.preventDefault();
					submitAnswer(q.qid, BILLIONAIRE);
				}))
				.append($('<a/>').text('Bum').attr('href', '#').click(function (e) {
					e.preventDefault();
					submitAnswer(q.qid, BUM);
				}))
			);
	}

	function $createAnsweredLi(q) {
		return $('<li/>').addClass(q.correct ? 'correct' : 'wrong')
			.append($('<img/>').attr('src', q.image))
			.append($('<h2/>').text(q.correctAnswer).append($('<span/>').text(q.correct ? 'CORRECT' : 'WRONG')))
			.append($('<p/>').text(q.description));
	}

	function submitAnswer(qid, answer) {
		if (!confirm('Is ' + answer + ' your final answer? You can\'t change it later.')) return;
		db.recordAnswer(qid, answer);
		refreshQuestions();
	};

	return {
		run,
		disaster
	};
}();

var db = function () {
	var DATA_KEY = 'dae90f9e-2a71-4e0e-bb3c-ed08e7c673cb';
	var NOW = new Date();
	var _internal = {};
	var _currentUser = null;

	function load(callback) {
		$.get('https://jsonstorage.net/api/items/' + DATA_KEY, function (data) {
			_internal = data;
			console.log('Data Loaded', _internal);
			var userEmail = prompt('Log in by entering your email address here:').trim();
			if (userEmail === 'Q') userEmail = 'jvanord@indasysllc.com';
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
				if (UPDATE.replace) _internal = {};
				$.extend(true, _internal, UPDATE);
				_internal.questions = _internal.questions.sort(function (a, b) {
					return new Date(b.available) - new Date(a.available);
				});
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
			success: function (data, textStatus, jqXHR) {

			},
			error: function (jqXHR, textStatus, errorThrown) {
				console.error('DB Save Error', {
					jqXHR,
					textStatus,
					errorThrown
				});
				app.disaster('There was an error saving the data.');
			}
		});
	}

	function getPossiblePoints() {
		return _internal.totalPoints;
	}

	function getUser() {
		return $.extend({}, _currentUser);
	}

	function getAnsweredQuestions() {
		var r = [];
		for (var i = 0; i < _internal.questions.length; i++) {
			var q = _internal.questions[i];
			if (new Date(q.available) > NOW) continue;
			if (!_currentUser.answers || !_currentUser.answers.length) continue;
			for (var j = 0; j < _currentUser.answers.length; j++) {
				var a = _currentUser.answers[j];
				if (a.qid !== q.qid) continue;
				if (a.answer) r.push($.extend({}, q, a));
				break;
			}
		}
		return r;
	}

	function getUnansweredQuestions() {
		var r = [];
		for (var i = 0; i < _internal.questions.length; i++) {
			var q = _internal.questions[i];
			if (new Date(q.available) > NOW) continue;
			if (!_currentUser.answers || !_currentUser.answers.length) {
				r.push($.extend({}, q));
				continue;
			}
			for (var j = 0; j < _currentUser.answers.length; j++) {
				var a = _currentUser.answers[j];
				if (a.qid !== q.qid) continue;
				if (!a.answer) r.push($.extend({}, q, a));
				break;
			}
		}
		return r;
	}

	function recordAnswer(qid, answer) {
		var question, match;
		for (var i = 0; i < _internal.questions.length; i++) {
			if (_internal.questions[i].qid === qid) {
				question = _internal.questions[i];
				break;
			}
		}
		if (!question) app.disaster('The question you answered could not be found.');
		var correct = answer === question.correctAnswer;
		if (correct)
			_currentUser.points += question.points;
		var newAnswer = {
			qid,
			answer,
			correct
		};
		if (!_currentUser.answers || !_currentUser.answers.length)
			_currentUser.answers = [];
		for (var i = 0; i < _currentUser.answers.length; i++) {
			if (_currentUser.answers[i].qid === qid) {
				match = _currentUser.answers[i];
				break;
			}
		}
		if (match)
			_currentUser.answers[i] = newAnswer;
		else
			_currentUser.answers.push(newAnswer);
		save();
	}

	return {
		load,
		getPossiblePoints,
		getUser,
		getAnsweredQuestions,
		getUnansweredQuestions,
		recordAnswer
	};
}();
