if (typeof module === "object" && module.exports) {
	var Color = require("color-js");
	var Promise = require("es6-promise").Promise;
} 
else { // otherwise assume these modules are loaded globally
	var Color = tinycolor; // color needs special handling
}

var Rays = (function() {
	function Main(init) {
		var main = this;
		
		// Pt -- simple x,y container
		main.Pt = function(init) {
			var pt = this;

			pt.check_params(init);

			if (init.pt) {
				pt.x = init.pt.x;
				pt.y = init.pt.y;
			}
			else {
				pt.x = init.x;
				pt.y = init.y;
			}
		};

		// check params will throw an error if unhappy with the Pt's init object, otherwise return nothing
		main.Pt.prototype.check_params = function(init) {
			// we could initialize with another Pt
			if (init.pt != undefined && (init.pt instanceof main.Pt)) {
				return;
			}
			// or with x,y
			if (init.x != undefined && init.y != undefined && (typeof init.x === "number") && (typeof init.y === "number")) {
				return;
			}
			// otherwise error
			throw new Error("problem with Pt init, no or invalid xy or Pt provided.");
		};

		// adds a scalar value to both x and y
		main.Pt.prototype.add = function(val) {
			var pt = this;

			if (typeof val != "number") {
				throw new Error("problem in Pt.add, val passed is not a number. val: " + val);
			}

			pt.x += val;
			pt.y += val;
		};

		// multiples both x and y by a scalar value
		main.Pt.prototype.mul = function(val) {
			var pt = this;

			if (typeof val != "number") {
				throw new Error("problem in Pt.mul, val passed is not a number. val: " + val);
			}

			pt.x = pt.x * val;
			pt.y = pt.y * val;
		};

		// do I want a divide method here?

		main.Pt.prototype.toString = function() {
			var pt = this;

			return pt.x.toString() + "," + pt.y.toString();
		};

		main.Rect = function(init) {
			var rect = this;

			rect.x = null;
			rect.y = null;
			rect.width = null;
			rect.height = null;

			// could init with a point then width, height
			if (init.pt && (init.pt instanceof main.Pt)) {
				rect.x = init.pt.x;
				rect.y = init.pt.y;
			}
			// or with x,y,width,height
			else if (init.x != undefined && (typeof init.x === "number") && init.y != undefined && (typeof init.y === "number")) {
				rect.x = init.x;
				rect.y = init.y;
			}
			else {
				throw new Error("problem in Rect init: x, y, or pt are not present or invalid.");
			}
			// now width,height
			if (init.width != undefined && (typeof init.width === "number") && init.height != undefined && (typeof init.height === "number")) {
				rect.width = init.width;
				rect.height = init.height;
			}
			else {
				throw new Error("problem in Rect init: width or height are not present or not numbers.");
			}
		};
		
		// should be getters/setters, just getters right now
		main.Rect.prototype.top = function() {
			var rect = this;
			
			return rect.y;
		};
		main.Rect.prototype.bottom = function() {
			var rect = this;
			
			return rect.y + rect.height;
		};
		main.Rect.prototype.left = function() {
			var rect = this;
			
			return rect.x;
		};
		main.Rect.prototype.right = function() {
			var rect = this;
			
			return rect.x + rect.width;
		};

		// getter/setter, couple of different signatures here
		main.Rect.prototype.center = function() {
			var rect = this;

			if (arguments.length) {
				// if we were passed a Pt
				if (arguments.length === 1 && (arguments[0] instanceof main.Pt)) {
					rect.x = arguments[0].x - (rect.width / 2.0);
					rect.y = arguments[0].y - (rect.height / 2.0);
				}
				// if we were passed x,y
				else if (arguments.length === 2 && (typeof arguments[0] === "number") && (typeof arguments[1] === "number")) {
					rect.x = arguments[0] - (rect.width / 2.0);
					rect.y = arguments[1] - (rect.height / 2.0);
				}
			}

			return new main.Pt({x: rect.x, y: rect.y});
		};

		// the player
		main.Player = function(init) {
			var play = this;

			// loc is a Pt object, representing x,y coords on the map
			play.loc = init.loc || null;

			// dir is view direction angle in radians
			var dir;
			Object.defineProperty(play, "dir", {
				get: function() {
					return dir;
				},
				set: function(val) {
					var reduced = val;
					if (val > Math.PI * 2.0) {
						reduced = val % (Math.PI * 2.0);
					}
					else if (val < 0.0) {
						reduced = val;
						reduced = Math.abs(reduced);
						reduced = reduced % (Math.PI * 2.0);
						reduced = reduced * -1.0;
						// then convert to a positive angle
						reduced = (Math.PI * 2.0) + reduced;
					}
					dir = reduced;
				}
			});

			play.dir = init.dir || null;
		};

		main.Player.prototype.is_moving = function() {
			var play = this;

			if (main.move_state.forward || main.move_state.backward || main.move_state.turn_left || main.move_state.turn_right) {
				return true;
			}
			return false;
		};

		main.Player.prototype.move = function() {
			var play = this;

			if (! play.is_moving()) {
				return;
			}

			if (main.move_state.forward || main.move_state.backward) {
				var move_vec = new main.Pt({x: Math.cos(play.dir), y: Math.sin(play.dir)});
				move_vec.mul(main.move_speed * (main.dt() / 1000.0));

				if (main.move_state.forward) {

					var x_move_square = main.get_square(play.loc.x + move_vec.x, play.loc.y, move_vec.x, 0);
					var y_move_square = main.get_square(play.loc.x, play.loc.y + move_vec.y, 0, move_vec.y);
					var x_outside = (play.loc.x + move_vec.x) > main.map_img.width || (play.loc.x + move_vec.x) < 0;
					var y_outside = (play.loc.y + move_vec.y) > main.map_img.height || (play.loc.y + move_vec.y) < 0;

					if (!x_move_square.is_wall && !x_outside) {
						play.loc.x += move_vec.x;
					}
					if (!y_move_square.is_wall && !y_outside) {
						play.loc.y += move_vec.y;
					}
				}
				else if (main.move_state.backward) {
					var x_move_square = main.get_square(play.loc.x - move_vec.x, play.loc.y, move_vec.x, 0);
					var y_move_square = main.get_square(play.loc.x, play.loc.y - move_vec.y, 0, move_vec.y);
					var x_outside = (play.loc.x - move_vec.x) > main.map_img.width || (play.loc.x - move_vec.x) < 0;
					var y_outside = (play.loc.y - move_vec.y) > main.map_img.height || (play.loc.y - move_vec.y) < 0;

					if (!x_move_square.is_wall && !x_outside) {
						play.loc.x -= move_vec.x;
					}
					if (!y_move_square.is_wall && !y_outside) {
						play.loc.y -= move_vec.y;
					}
				}
			}
			if (main.move_state.turn_left || main.move_state.turn_right) {
				var turn_ang = main.turn_rate * (main.dt() / 1000.0);
				if (main.move_state.turn_left) {
					play.dir -= turn_ang;
				}
				else if (main.move_state.turn_right) {
					play.dir += turn_ang;
				}
			}
			
			main.needs_draw = true;
		};

		// initialize everything
		main.init(init);
	}
	
	Main.prototype.init = function(init) {
		var main = this;
		
		// handle init options
		main.canvas = init.canvas || null;
		main.map_canvas = init.map_canvas || null;
		main.map_bg_canvas = init.map_bg_canvas || null;
		main.fps_field = init.fps_field || null;
		main.map_file_name = init.map_file_name || null;
		if (! main.map_file_name) {
			throw new Error("you must provide a map file");
		}
		
		if (! init.use_minimap) {
			main.use_minimap = false;
		}
		else {
			// if we were told to use a minimap, check that we got both minimap canvases passed in
			if ((! main.map_canvas || ! main.map_bg_canvas)
				|| (main.map_canvas && main.map_canvas.nodeName != "CANVAS")
				|| (main.map_bg_canvas && main.map_bg_canvas.nodeName != "CANVAS")) {
				throw new Error("use_minimap set to true but map_canvas and/or map_bg_canvas not provided");
			}
			main.use_minimap = true;
		}
		
		// for drawing
		main.view_ctx = main.canvas.getContext("2d");
		main.view_batched_rects = {}; // for solid draw mode -- keys are colors, values are Rects
		main.view_batched_edges = {}; // for edge draw mode -- keys are squares...
		main.map_ctx = main.map_canvas.getContext("2d");
		main.map_ctx.imageSmoothingEnabled = false;
		main.map_ctx.msImageSmoothingEnabled = false;
		main.map_ctx.mozImageSmoothingEnabled = false;
		main.map_ctx.webkitImageSmoothingEnabled = false;
		main.map_ctx.translate(0.5, 0.5);
		main.map_bg_ctx = main.map_bg_canvas.getContext("2d");
		main.map_bg_ctx.imageSmoothingEnabled = false;
		main.map_bg_ctx.msImageSmoothingEnabled = false;
		main.map_bg_ctx.mozImageSmoothingEnabled = false;
		main.map_bg_ctx.webkitImageSmoothingEnabled = false;
		main.map_bg_ctx.translate(0.5, 0.5);
		main.minimap_batched_lines = {}; // keys are colors, values are {pt1, pt2}
		main.minimap_batched_rects = {}; // keys are colors, values are Rects
		main.map_img = null; // loaded in Main.load_map()
		main.last_tick = Date.now();
		main.current_tick = Date.now();
		
		main.fps_samples = [];
		main.needs_draw = true; 
		main.anim = null; // return value from requestAnimationFrame

		// constants etc
		main.fov = Math.PI * 0.4;
		main.max_view_dist = 100.0;//20.0;
		main.num_columns = (main.canvas.width / 6);//100;
		main.move_speed = 10.0; // in map units per second
		main.turn_rate = Math.PI * 1.0; // in radians per second
		main.wall_color = new Color("#828282");
		main.map_res_factor_x = null; // these will be filled in once the map is loaded and its dimensions are known
		main.map_res_factor_y = null; // these will be filled in once the map is loaded and its dimensions are known
		main.cos_calls = {}; // caches calls to Math.cos, keys are angles and values are Math.cos(angle)
		main.sin_calls = {}; // same for Math.sin
		
		// events
		document.addEventListener("keydown", main.handle_keypress.bind(main, true), false);
		document.addEventListener("keyup", main.handle_keypress.bind(main, false), false);
		main.canvas.addEventListener("touchstart", main.handle_touch.bind(main, true), false);
		main.canvas.addEventListener("touchend", main.handle_touch.bind(main, false), false);
		window.addEventListener("blur", main.on_blur.bind(main));
		window.addEventListener("focus", main.on_focus.bind(main));
		
		// input/movement state 
		main.move_state = {forward: false, backward: false, turn_left: false, turn_right: false};
		
		// app stuff
		main.map_data = null;
		main.paused = false;
		main.blur_paused = false;
		main.player = new main.Player({loc: new main.Pt({x: 1.0, y: 1.0}), dir: Math.PI * 0.25});
		main.draw_mode = "edges"; // options are "solid" and "edges"
	};

	Main.prototype.dt = function() {
		var main = this; 
		return main.current_tick - main.last_tick;
	};
	
	Main.prototype.solid_mode = function() {
		var main = this;
		main.draw_mode = "solid";
		main.needs_draw = true;
	};
	
	Main.prototype.edges_mode = function() {
		var main = this;
		main.draw_mode = "edges";
		main.needs_draw = true;
	};
	
	// for solid mode
	Main.prototype.batch_view_rect = function(rc, color) {
		var main = this;

		if (main.view_batched_rects[color] == undefined) {
			main.view_batched_rects[color] = [];
		}
		main.view_batched_rects[color].push(rc);
	};
	
	// for edge mode -- should I even specify color here?
	Main.prototype.batch_view_edge = function(rc, col, color) {
		var main = this;
		
		var sq_key = col.square_pt.toString();
		if (main.view_batched_edges[sq_key]) {
			main.view_batched_edges[sq_key].tops.push(new main.Pt({x: rc.left(), y: rc.top()}));
			main.view_batched_edges[sq_key].bottoms.push(new main.Pt({x: rc.left(), y: rc.bottom()}));
		}
		else {
			main.view_batched_edges[sq_key] = {tops: [], bottoms: []};
			main.view_batched_edges[sq_key].tops.push(new main.Pt({x: rc.left(), y: rc.top()}));
			main.view_batched_edges[sq_key].bottoms.push(new main.Pt({x: rc.left(), y: rc.bottom()}));
		}
	}
	
	Main.prototype.draw_batched_view_edges = function() {
		var main = this;
		
		// for each square
		Object.keys(main.view_batched_edges).forEach(function(sq_key) {
			main.view_ctx.strokeStyle = "white";
			
			// first tops
			var first_pt = new main.Pt({x: main.view_batched_edges[sq_key].tops[0].x, y: main.view_batched_edges[sq_key].tops[0].y});
			main.view_ctx.beginPath();
			main.view_ctx.moveTo(first_pt.x, first_pt.y);
			var i;
			for (i = 1; i < main.view_batched_edges[sq_key].tops.length; i++) {
				main.view_ctx.lineTo(main.view_batched_edges[sq_key].tops[i].x, main.view_batched_edges[sq_key].tops[i].y);
			}
			
			// now bottoms, backwards
			for (i = main.view_batched_edges[sq_key].bottoms.length - 1; i >= 0; i--) {
				main.view_ctx.lineTo(main.view_batched_edges[sq_key].bottoms[i].x, main.view_batched_edges[sq_key].bottoms[i].y);
			}
			// one last line back up to the first point
			main.view_ctx.lineTo(first_pt.x, first_pt.y);
			main.view_ctx.closePath();
			main.view_ctx.stroke();
		});
		
		main.view_batched_edges = {};
	};

	Main.prototype.draw_batched_view_rects = function() {
		var main = this;

		Object.keys(main.view_batched_rects).forEach(function(col) {
			main.view_ctx.fillStyle = col;
			main.view_ctx.beginPath();
			main.view_batched_rects[col].forEach(function(rc) {
				main.view_ctx.rect(rc.x, rc.y, rc.width, rc.height);
			});
			main.view_ctx.fill();
			main.view_ctx.closePath();
		});
		main.view_batched_rects = {};
	};
	
	// minimap drawing functions
	Main.prototype.batch_minimap_point = function(pt, color) {
		var main = this;

		if (main.minimap_batched_rects[color] == undefined) {
			main.minimap_batched_rects[color] = [];
		}

		var draw_pt = new main.Pt({x: pt.x * main.map_res_factor_x, y: pt.y * main.map_res_factor_y});
		main.minimap_batched_rects[color].push(new main.Rect({pt: draw_pt, width: 2, height: 2}));
	};

	Main.prototype.draw_batched_minimap_rects = function() {
		var main = this;

		Object.keys(main.minimap_batched_rects).forEach(function(col) {
			main.map_ctx.fillStyle = col;
			main.map_ctx.beginPath();
			main.minimap_batched_rects[col].forEach(function(rc) {
				main.map_ctx.rect(rc.x, rc.y, rc.width, rc.height);
			});
			main.map_ctx.fill();
			main.map_ctx.closePath();
		});
		main.minimap_batched_rects = {};
	};


	Main.prototype.batch_minimap_line = function(pt1, pt2, color) {
		var main = this;
		if (main.minimap_batched_lines[color] == undefined) {
			main.minimap_batched_lines[color] = [];
		}

		var draw_pt1 = new main.Pt({x: pt1.x * main.map_res_factor_x, y: pt1.y * main.map_res_factor_y});
		var draw_pt2 = new main.Pt({x: pt2.x * main.map_res_factor_x, y: pt2.y * main.map_res_factor_y});

		main.minimap_batched_lines[color].push({pt1: draw_pt1, pt2: draw_pt2});
	};

	Main.prototype.draw_batched_minimap_lines = function() {
		var main = this;

		Object.keys(main.minimap_batched_lines).forEach(function(col) {
			main.map_ctx.strokeStyle = col;
			main.map_ctx.beginPath();
			main.minimap_batched_lines[col].forEach(function(ln) {
				main.map_ctx.moveTo(Math.floor(ln.pt1.x), Math.floor(ln.pt1.y));
				main.map_ctx.lineTo(Math.floor(ln.pt2.x), Math.floor(ln.pt2.y));
			});
			main.map_ctx.stroke();
			main.map_ctx.closePath();
		});

		main.minimap_batched_lines = {};
	};

	Main.prototype.draw_minimap = function() {
		var main = this; 

		// draw the map image scaled-up on the map background canvas
		//main.map_bg_ctx.clearRect(0, 0, main.map_bg_canvas.width, main.map_bg_canvas.height);
		//main.map_bg_ctx.drawImage(main.map_img, 0, 0, main.map_bg_canvas.width, main.map_bg_canvas.height);

		// draw the grid -- skippiing the grid for now
		/*
		var x, y; // lower bound 1, don't draw borders
		for (x = 1; x < main.map_img.width; x++) {
			main.batch_minimap_line(new main.Pt({x: x, y: 0}), new main.Pt({x: x, y: main.map_img.height}), "gray");
			for (y = 0; y < main.map_img.height; y++) {
				main.batch_minimap_line(new main.Pt({x: 0, y: y}), new main.Pt({x: main.map_img.width, y: y}), (y === 0 ? "black" : "gray"));
			}
		}
		*/
		// now draw player's position on the main map canvas
		var end_pt = new main.Pt({x: main.player.loc.x + Math.cos(main.player.dir)
								, y: main.player.loc.y + Math.sin(main.player.dir)});
		main.batch_minimap_line(main.player.loc, end_pt, "red");

		// paint everything to the canvas
		main.draw_batched_minimap_lines();

	};

	Main.prototype.touch_pos = function(e) {
		var main = this;

		var elem_rect = main.canvas.getBoundingClientRect();
		var touch_pt = new main.Pt({	x: Math.round((e.clientX - elem_rect.left) / (elem_rect.right - elem_rect.left) * main.canvas.width)
										, y: Math.round((e.clientY - elem_rect.top) / (elem_rect.bottom - elem_rect.top) * main.canvas.height) });
		return touch_pt;
	};

	Main.prototype.handle_touch = function(val, e) {
		var main = this; 
		
		e.preventDefault();
		
		if (! val) {
			main.zero_move_state();
			return;
		}
		
		var touch = e.touches[0];
		var touch_pt = main.touch_pos(touch);
		
		// forward/backward
		if (touch_pt.y < (main.canvas.height * 0.25)) {
			main.handle_keypress(val, {code: "KeyW"});
			return;
		}
		else if (touch_pt.y > (main.canvas.height * 0.75)) {
			main.handle_keypress(val, {code: "KeyS"});
			return;
		}
		
		// left and right turns
		if (touch_pt.x < (main.canvas.width * 0.25)) {
			main.handle_keypress(val, {code: "KeyA"});
		}
		else if (touch_pt.x > (main.canvas.width * 0.75)) {
			main.handle_keypress(val, {code: "KeyD"});
		}
		
	};

	Main.prototype.handle_keypress = function(val, e) {
		var main = this;

		if (e.code === "KeyW" || e.key === "w" || e.key === "W") {
			main.move_state.forward = val;
		}
		else if (e.code === "KeyS" || e.key === "s" || e.key === "S") {
			main.move_state.backward = val;
		}
		else if (e.code === "KeyA" || e.key === "a" || e.key === "A") {
			main.move_state.turn_left = val;
		}
		else if (e.code === "KeyD"|| e.key === "d" || e.key === "D") {
			main.move_state.turn_right = val;
		}
	};
	
	Main.prototype.zero_move_state = function() {
		var main = this;
		
		main.move_state.forward = false;
		main.move_state.backward = false;
		main.move_state.turn_left = false;
		main.move_state.turn_right = false;
	};
	
	// pause and resume the animation when tab loses/gains focus
	Main.prototype.on_blur = function() {
		var main = this;
		
		if (! main.blur_paused) {
			main.pause();
			main.blur_paused = true;
		}
	};
	
	Main.prototype.on_focus = function() {
		var main = this;
		
		if (main.blur_paused) {
			main.resume();
			main.blur_paused = false;
		}
	};

	Main.prototype.draw_column = function(col) {
		var main = this;

		if (! col.is_wall) {
			return;
		}

		var draw_height = (main.canvas.height / (Math.cos(col.mod_ang) * col.dist));
		var draw_width = main.canvas.width / main.num_columns;

		var init = {x: 0, y: 0, width: draw_width, height: draw_height};
		var draw_rect = new main.Rect(init);
		var center = new main.Pt({x: (draw_width * col.idx) - (draw_width / 2.0), y: main.canvas.height / 2.0});
		draw_rect.center(center);

		// set color darkness by distance
		var this_color = main.wall_color.clone();//new Color(main.wall_color.toString());
		var dark_factor = 100 * .9 * (col.dist / main.max_view_dist);
		this_color = this_color.darken(dark_factor);
		
		// done, add column to be drawn
		if (main.draw_mode === "solid") {
			main.batch_view_rect(draw_rect, this_color.toString());
		}
		else if (main.draw_mode === "edges") {
			main.batch_view_edge(draw_rect, col, "white");
		}
	};
	
	// given an x/y position and the cos and sin of the view angle, 
	// get the corresponding map square
	Main.prototype.get_square = function(x, y, cos, sin) {
		var main = this;

		var idx, ret = {};
		var lookup_x, lookup_y;

		// first round down
		lookup_x = Math.floor(x);
		lookup_y = Math.floor(y);

		// bump down one further unit on grid line if we're moving in negative direction
		if (cos < 0 && (x % 1.0 == 0)) {
			lookup_x -= 1;
		}
		if (sin < 0 && (y % 1.0 == 0)) {
			lookup_y -= 1;
		}

		// look up 
		idx = (lookup_x + (lookup_y * main.map_img.height)) * 4;
		ret.r = main.map_data.data[idx];
		ret.g = main.map_data.data[idx + 1];
		ret.b = main.map_data.data[idx + 2];
		ret.a = main.map_data.data[idx + 3];

		ret.is_wall = !!ret.r;
		ret.x = x;
		ret.y = y;
		ret.square_x = lookup_x;
		ret.square_y = lookup_y;
		ret.square_pt = new main.Pt({x: lookup_x, y: lookup_y});
		
		return ret;
	};
	
	// distance between two points
	Main.prototype.get_dist = function(pt1, pt2) {
		var x_diff = Math.abs(pt1.x - pt2.x);
		var y_diff = Math.abs(pt1.y - pt2.y);
		var dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff);

		return dist;
	};
	
	// casts rays and gets the contents of our view columns
	Main.prototype.get_columns = function() {
		var main = this;

		var c;
		var ang_unit = (main.fov / main.num_columns);
		var mod_ang, view_ang, col = {}, columns = [];
		for (c = 0; c < main.num_columns; c++) {
			// for each vertical column of our view, first get the angle
			mod_ang = c * ang_unit;
			mod_ang = mod_ang - (main.fov / 2.0);
			view_ang = main.player.dir + mod_ang;
			col = main.cast_ray(view_ang);
			col.idx = c;
			col.ang = view_ang;
			col.mod_ang = mod_ang;
			columns.push(col);
		}

		return columns;
	};

	Main.prototype.cast_ray = function(ang) {
		var main = this;
		
		// ang and is_wall are set here only for first loop of while down below
		var cur = {ang: ang, is_wall: false}, grid_points = [];
		var temp_pt = new main.Pt({x: main.player.loc.x, y: main.player.loc.y});;
		var dist, stop = false, cnt = 0;

		var cos, sin;
		if (main.cos_calls[ang] != undefined) {
			cos = main.cos_calls[ang];
		}
		else {
			cos = Math.cos(ang);
			main.cos_calls[ang] = cos;
		}
		if (main.sin_calls[ang] != undefined) {
			sin = main.sin_calls[ang];
		}
		else {
			sin = Math.sin(ang);
			main.sin_calls[ang] = sin;
		}

		while (! cur.is_wall && ! stop && ! main.outside_map(cur)) {
			temp_pt = main.next_grid(cos, sin, temp_pt.x, temp_pt.y);
			grid_points.push(temp_pt);
			cur = main.get_square(temp_pt.x, temp_pt.y, cos, sin);
			dist = dist = main.get_dist(main.player.loc, temp_pt);
			cur.dist = dist;
			if (dist > main.max_view_dist) {
				stop = true;
			}
		}

		cur.x = temp_pt.x;
		cur.y = temp_pt.y;
		grid_points.push(new main.Pt({x: cur.x, y: cur.y}));
		cur.grid_points = grid_points;
		
		return cur;
	};
	
	Main.prototype.outside_map = function(pt) {
		var main = this;
		
		return (pt.x < 0 || pt.y < 0) || (pt.x > main.map_img.width || pt.y > main.map_img.height);
	};
	
	Main.prototype.next_whole = function(num) {
		var main = this;
		
		if (num % 1.0 === 0) {
			return num + 1.0;
		}
		return Math.ceil(num);
	};

	Main.prototype.next_whole_down = function(num) {
		var main = this;
		
		if (num % 1.0 === 0) {
			return num - 1.0;
		}
		return Math.floor(num);
	};

	Main.prototype.next_grid = function(run, rise, x, y) {
		var main = this;
		
		var temp_x, temp_y, whole_x, whole_x_y, whole_y, whole_y_x;

		temp_x = run >= 0 ? main.next_whole(x) - x : main.next_whole_down(x) - x;
		temp_y = temp_x * (rise/run);
		whole_x = temp_x + x;
		whole_x_y = temp_y + y;

		temp_y = rise >= 0 ? main.next_whole(y) - y : main.next_whole_down(y) - y;
		temp_x = temp_y * (run/rise);
		whole_y = temp_y + y;
		whole_y_x = temp_x + x;

		var whole_x_pt = new main.Pt({x: whole_x, y: whole_x_y});
		var whole_y_pt = new main.Pt({x: whole_y_x, y: whole_y});

		var init_pt = new main.Pt({x: x, y: y});
		var whole_x_dist = main.get_dist(init_pt, whole_x_pt);
		var whole_y_dist = main.get_dist(init_pt, whole_y_pt);

		var ret = whole_x_dist <= whole_y_dist ? new main.Pt({x: whole_x, y: whole_x_y}) : new main.Pt({x: whole_y_x, y: whole_y});

		return ret;
	};

	/* little utilities */
	Main.prototype.mean = function(arr) {
		function sum_up(tot, n) {
			return tot + n;
		}
		var total = arr.reduce(sum_up);
		return total / arr.length;
	};
	
	// not really using this but I like having it for testing because I cannot into math
	Main.prototype.to_deg = function(rad) {
		return (180.0/Math.PI) * rad;
	};
	
	// callback for requestAnimationFrame
	Main.prototype.tick = function(time) {
		var main = this;
		
		// deal with time
		main.last_tick = main.current_tick;
		main.current_tick = time;
		
		// handle movement
		main.player.move();
		
		// handle drawing
		if (main.needs_draw) {
			// clear view screen
			main.view_ctx.clearRect(0, 0, main.canvas.width, main.canvas.height);
			main.view_ctx.fillStyle = "#000000";
			main.view_ctx.rect(0, 0, main.canvas.width, main.canvas.height);
			main.view_ctx.fill();

			// clear mini map
			main.map_ctx.clearRect(-1, -1, main.map_canvas.width + 1, main.map_canvas.height + 1);

			// draw the minimap with the player's new position
			if (main.use_minimap) {
				main.draw_minimap();
			}

			// draw our columns in the view screen
			var columns = main.get_columns();
			columns.forEach(function(col) {
				main.draw_column(col);
				// batch up minimap draw calls
				if (main.use_minimap) {
					col.grid_points.forEach(function(g) {
						main.batch_minimap_point(g, "#76ff00");
					});
				}
			});
			// draw minimap points
			if (main.use_minimap) {
				main.draw_batched_minimap_rects();
			}
			
			if (main.draw_mode === "solid") {
				main.draw_batched_view_rects();
			}
			else if (main.draw_mode === "edges") {
				main.draw_batched_view_edges();
			}
			
			main.needs_draw = false;
		}
		
		// fps stuff
		main.fps_samples.push(main.current_tick);

		// update avg fps if samples have accumulated over .5 seconds
		if (main.current_tick - main.fps_samples[0] > 500) {
			var i, accum = [];
			for (i = 1; i < main.fps_samples.length; i++) {
				accum.push(main.fps_samples[i] - main.fps_samples[i - 1]);
			}
			var fps = 1000.0 / main.mean(accum);
			main.fps_field.innerHTML = fps.toFixed(0);
			main.fps_samples = [];
		}
		
		// proceed to next tick
		if (! main.paused) {
			main.anim = window.requestAnimationFrame(main.tick.bind(main));
		}
		else {
			window.cancelAnimationFrame(main.anim);
		}
	};

	Main.prototype.pause = function() {
		var main = this;
		
		main.paused = true;
		window.cancelAnimationFrame(main.anim);
		main.fps_field.innerHTML = "&mdash;";
	};

	Main.prototype.resume = function() {
		var main = this;
		
		main.paused = false;
		main.fps_field.innerHTML = "";
		
		main.anim = window.requestAnimationFrame(main.tick.bind(main));
	};

	Main.prototype.load_map = function(url) {
		var main = this;

		var temp = document.createElement("canvas");
		var temp_ctx = temp.getContext("2d");
		var img_data;

		main.map_img = new Image();
		main.map_img.src = url;

		var img_data_prom = new Promise(function (resolve, reject) {
			main.map_img.onload = function() {
				// grab data from image
				temp.height = this.height;
				temp.width = this.width;
				temp_ctx.drawImage(this, 0, 0);
				img_data = temp_ctx.getImageData(0, 0, main.map_img.width, main.map_img.height);

				// now draw it scaled-up on the map canvas
				main.draw_minimap();

				// set some constants
				main.map_res_factor_x = main.map_canvas.width / main.map_img.width;
				main.map_res_factor_y = main.map_canvas.height / main.map_img.height;

				resolve(img_data);
			};

			main.map_img.onerror = function(err) {
				reject(err);
			}


		}).then(
			function(img_data) {
				main.map_data = img_data;
			}
		).catch(
			function(err) {
				throw new Error("problem loading map image: ", err);
			}
		);

		return img_data_prom;
	};

	Main.prototype.run = function() {
		var main = this;

		main.load_map(main.map_file_name).then(
			// start stuff running
			function() {
				main.map_bg_ctx.clearRect(0, 0, main.map_bg_canvas.width, main.map_bg_canvas.height);
				main.map_bg_ctx.drawImage(main.map_img, 0, 0, main.map_bg_canvas.width, main.map_bg_canvas.height);
				main.resume();
			}
		);
	};
	
	// expose
	var app;
	return {app: function(init) {
		if (!app) {
			app = new Main(init);
		}
		else if (init != undefined) {
			app.init(init);
		}
		return app;
	}};
})();

if (typeof module === "object" && module.exports) {
	module.exports = Rays;
}