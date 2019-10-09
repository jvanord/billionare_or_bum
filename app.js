app = {
	onLoaded: function (){
		document.getElementById('loading').style.display = 'none';
		document.getElementById('main').classList.remove('hidden');
	},
	run: function(){
		setTimeout(app.onLoaded, 3000);
	}
};
app.run();