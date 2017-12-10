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
								, wall_tex_file_name: "wall_tex2.png"
								//, wall_tex_file_name: "stone_wall_posterized.png"
								, renderer: "pixi" // options are "vanilla" and "pixi"
								, max_view_dist: 20.0
								, column_width: 4.0
								, move_speed: 10.0
								, move_anim_duration: 1000.0
								, move_anim_psuedo_frame_count: 1.0
								, move_mode: "step" // options are "step" and "smooth"
								, fps_field: fps_field
								, controls_container: controls_container});
});
