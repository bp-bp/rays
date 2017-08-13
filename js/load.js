var rays_app;
window.addEventListener("load", function() {
	var canvas = document.getElementById("main_canvas");
	var map_canvas = document.getElementById("map_canvas");
	var fps_field = document.getElementById("fps_field");
	rays_app = new Rays.app({canvas: canvas, map_canvas: map_canvas, fps_field: fps_field});
});
