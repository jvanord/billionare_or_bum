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
			.append($('<h2/>').text('Billionaire or Bum?').append($('<span/>').text(q.points+'pts')))
			.append($('<img/>').attr('src', q.image))
			.append($('<div/>').addClass('buttons')
				.append($('<a/>')
					.text('Billionaire')
					.attr('href', '#')
					.data('qid', q.qid)
					.click(onChooseBillionaire))
				.append($('<a/>')
					.text('Bum')
					.attr('href', '#')
					.data('qid', q.qid)
					.click(onChooseBum))
			);
	}

	function $createAnsweredLi(q) {
		return $('<li/>').addClass(q.correct ? 'correct' : 'wrong')
			.append($('<img/>').attr('src', q.image))
			.append($('<h2/>').text(q.correctAnswer).append($('<span/>').text(q.correct ? 'CORRECT' : 'WRONG')))
			.append($('<p/>').text(q.description));
	}

	function onChooseBillionaire(e){
		e.preventDefault();
		var qid = $(e.currentTarget).data('qid');
		if (!qid) return disaster('Could not get the ID of the question being answered.') && false;
		submitAnswer(qid, BILLIONAIRE);
	}

	function onChooseBum(e){
		e.preventDefault();
		var qid = $(e.currentTarget).data('qid');
		if (!qid) return disaster('Could not get the ID of the question being answered.') && false;
		submitAnswer(qid, BUM);
	}

	function submitAnswer(qid, answer) {
		if (!confirm('Is ' + answer + ' your final answer? You can\'t change it later.')) return;
		db.recordAnswer(qid, answer, function () {
			refreshQuestions();
			updateProgress();
		});
	};

	function onResize(){
		updateProgress();
	}

	return {
		run,
		disaster,
		onResize
	};
}();

var db = function () {
	var DATA_KEY = 'https://jsonstorage.net/api/items/dae90f9e-2a71-4e0e-bb3c-ed08e7c673cb';
	var STORAGE_LOC = 'https://www.jsonstore.io/b89c315ae764b9b42978d649f0c99bb8f90409901a6b26bdfbf42e69afd9e768';
	var NOW = new Date();
	var _internal = {};
	var _currentUser = null;

	function load(callback) {
		$.get(STORAGE_LOC, function (data) {
			_internal = data.ok ? data.result : data;
			console.log('Data Loaded', _internal);
			if (!!window.UPDATE) {
				if (UPDATE.replace) _internal = {};
				$.extend(true, _internal, UPDATE);
				_internal.questions = _internal.questions.sort(function (a, b) {
					return new Date(b.available) - new Date(a.available);
				});
				console.log('Data Updated', _internal);
			}
			var userEmail = prompt('Log in by entering your email address here:');
			if (!userEmail) app.disaster('You can\'t play if you don\'t log in. Reload the page to try again.');
			if (userEmail === 'Q') userEmail = 'jvanord@indasysllc.com';
			userEmail = userEmail.trim().toLowerCase();
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
			if (typeof callback === 'function')
				callback.call();
		});
	}

	function save(callback) {
		$.ajax({
			url: STORAGE_LOC,
			type: 'PUT',
			data: JSON.stringify(_internal),
			contentType: 'application/json; charset=utf-8',
			dataType: 'json',
			success: function (data, textStatus, jqXHR) {
				if (typeof callback === 'function')
					callback.call();
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
			var answered = false;
			var q = _internal.questions[i];
			if (new Date(q.available) > NOW) continue;
			if (_currentUser.answers && _currentUser.answers.length) {
				for (var j = 0; j < _currentUser.answers.length; j++) {
					var a = _currentUser.answers[j];
					if (a.qid !== q.qid) continue;
					answered = answered || !!a.answer;
				}
			}
			if (!answered) r.push($.extend({}, q));
		}
		return r;
	}

	function recordAnswer(qid, answer, callback) {
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
			_currentUser.points += question.points; //givePoints(_currentUser.email, question.points);
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
		save(callback);
	}

	function givePoints(email, points) {
		for (var i = 0; i < _internal.users.length; i++) {
			if (_internal.users[i].email === email) {
				_internal.users[i].points = _internal.users[i].points + points;
				break;
			}
		}
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
