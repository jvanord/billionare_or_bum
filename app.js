DATA_KEY = 'dae90f9e-2a71-4e0e-bb3c-ed08e7c673cb';
app = {
	onLoaded: function (){
		document.getElementById('loading').style.display = 'none';
		document.getElementById('main').classList.remove('hidden');
	},
	run: function(){
		if (!window.jQuery) throw new Error('JQuery didn\'t load - it\'s all fucked up.');
		setTimeout(app.onLoaded, 3000);
	}
};
