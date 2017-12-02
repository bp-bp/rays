var rays_app;
window.addEventListener("load", function() {
	var canvas = document.getElementById("main_canvas");
	var map_canvas = document.getElementById("map_canvas");
	var map_bg_canvas = document.getElementById("map_bg_canvas");
	var fps_field = document.getElementById("fps_field");
	var controls_container = document.getElementById("rays_controls_container");
	rays_app = new Rays.app({	canvas: canvas
								, map_canvas: map_canvas
								, map_bg_canvas: map_bg_canvas
								, use_minimap: true
								, map_file_name: "map.png"
								, wall_tex_file_name: "wall_tex.png"
								, renderer: "pixi" 
								, max_view_dist: 20.0
								, column_width: 12.0
								, move_speed: 10.0
								, fps_field: fps_field
								, controls_container: controls_container});
	
	
	/*var solid_button = document.getElementById("solid_mode_button");
	var edges_button = document.getElementById("edge_mode_button");
	solid_button.addEventListener("click", rays_app.solid_mode.bind(rays_app));
	edges_button.addEventListener("click", rays_app.edges_mode.bind(rays_app));*/
});
