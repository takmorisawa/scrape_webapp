var cb = function() {
	var fa_css = document.createElement('link'); fa_css.rel = 'stylesheet';
	fa_css.href = 'https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css';
	var insert_fa_css = document.getElementsByTagName('head')[0]; insert_fa_css.parentNode.insertBefore(fa_css, insert_fa_css);
};
var raf = requestAnimationFrame || mozRequestAnimationFrame ||
	webkitRequestAnimationFrame || msRequestAnimationFrame;
if (raf) raf(cb);
else window.addEventListener('load', cb);