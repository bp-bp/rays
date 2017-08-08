function Main(init) {
	var main = this;
	
	// drawing
	main.canvas = init.canvas || null;
	main.map_canvas = init.map_canvas || null;
	main.view_ctx = main.canvas.getContext("2d");
	main.map_ctx = main.map_canvas.getContext("2d");
	main.map_ctx.imageSmoothingEnabled = false;
	main.map_ctx.translate(0.5, 0.5);
	main.map_img = null; // loaded in Main.load_map()
	main.last_tick = Date.now();
	main.fps_field = init.fps_field || null;
	main.fps_samples = [];
	
	// constants etc
	main.focal_length = 0.8;
	main.fov = Math.PI * 0.4;
	main.max_view_dist = 20.0;
	main.num_columns = 100;
	main.move_speed = 5.0; // in map units per second
	main.turn_rate = Math.PI * 0.5; // in radians per second
	main.wall_color = new Color("#828282");
	
	// events
	document.addEventListener("keydown", main.handle_keypress.bind(main, true), false);
	document.addEventListener("keyup", main.handle_keypress.bind(main, false), false);
	
	// movement state 
	main.move_state = {forward: false, backward: false, turn_left: false, turn_right: false};
	
	// *********** objects
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
		//console.log("init: ", init);
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
		
		// both loc and dir are Pt objects. loc is x,y coords on the map
		// dir is view direction angle in radians
		play.loc = init.loc || null;
		//this.dir = init.dir || null;
		
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
		
		//console.log("move");
		if (main.move_state.forward || main.move_state.backward) {
			var move_vec = new main.Pt({x: Math.cos(play.dir), y: Math.sin(play.dir)});
			// given framerate of (hopefully) 30fps
			move_vec.mul(main.move_speed / 30.0);
			if (main.move_state.forward) {
				
				play.loc.x += move_vec.x;
				play.loc.y += move_vec.y;
			}
			else if (main.move_state.backward) {
				play.loc.x -= move_vec.x;
				play.loc.y -= move_vec.y;
			}
		}
		if (main.move_state.turn_left || main.move_state.turn_right) {
			var turn_ang = main.turn_rate / 30.0;
			if (main.move_state.turn_left) {
				play.dir -= turn_ang;
			}
			else if (main.move_state.turn_right) {
				play.dir += turn_ang;
			}
			//console.log("angle: ", play.dir/Math.PI);
		}
	};
	
	// app objects
	main.map_data = null;
	main.int = null;
	main.player = new main.Player({loc: new main.Pt({x: 2.0, y: 2.0}), dir: Math.PI * 0.25});
}

Main.prototype.draw_point = function(ctx, pt, color) {
	var main = this;
	
	ctx.beginPath();
	ctx.fillStyle = color;
	ctx.fillRect(pt.x, pt.y, 2, 2);
};

Main.prototype.draw_line = function(ctx, pt1, pt2, color) {
	var main = this;
	
	if (! ctx) {
		throw new Error("error in Main.draw_line -- no ctx available");
	}
	
	ctx.strokeStyle = color;
	ctx.beginPath();
	ctx.moveTo(Math.floor(pt1.x) , Math.floor(pt1.y));
	ctx.lineTo(Math.floor(pt2.x), Math.floor(pt2.y));
	ctx.stroke();
};

Main.prototype.draw_minimap_point = function(pt, color) {
	var main = this;
	
	var res_factor_x = main.map_canvas.width / main.map_img.width;
	var res_factor_y = main.map_canvas.height / main.map_img.height;
	var draw_pt = new main.Pt({x: pt.x * res_factor_x, y: pt.y * res_factor_y});
	
	main.draw_point(main.map_ctx, draw_pt, color);
};

Main.prototype.draw_minimap_line = function(pt1, pt2, color) {
	var main = this;
	
	var res_factor_x = main.map_canvas.width / main.map_img.width;
	var res_factor_y = main.map_canvas.height / main.map_img.height;
	var draw_pt1 = new main.Pt({x: pt1.x * res_factor_x, y: pt1.y * res_factor_y});
	var draw_pt2 = new main.Pt({x: pt2.x * res_factor_x, y: pt2.y * res_factor_y});
	
	main.draw_line(main.map_ctx, draw_pt1, draw_pt2, color);
};

Main.prototype.draw_minimap = function() {
	var main = this; 
	
	
	
	// draw the map image scaled-up on the map canvas
	main.map_ctx.drawImage(main.map_img, 0, 0, main.map_canvas.width, main.map_canvas.height);
	
	// grid
	
	var x, y;
	for (x = 0; x < main.map_img.width; x++) {
		main.draw_minimap_line(new main.Pt({x: x, y: 0}), new main.Pt({x: x, y: main.map_img.height}), "gray");
		for (y = 0; y < main.map_img.height; y++) {
			main.draw_minimap_line(new main.Pt({x: 0, y: y}), new main.Pt({x: main.map_img.width, y: y}), "gray");
		}
	}
	
	
	// now draw player's position
	//main.draw_minimap_point(main.player.loc, "#f44242");
	var end_pt = new main.Pt({x: main.player.loc.x + Math.cos(main.player.dir)
							, y: main.player.loc.y + Math.sin(main.player.dir)});
	main.draw_minimap_line(main.player.loc, end_pt, "red");
	
};

Main.prototype.load_map = function(url) {
	var main = this;
	
	var temp = document.createElement("canvas");
	var temp_ctx = temp.getContext("2d");
	//var map = main.map_canvas.getContext("2d");
	var img_data;
	
	main.map_img = new Image();
	main.map_img.src = url;
	
	var img_data_prom = new Promise((resolve, reject) => {
		main.map_img.onload = function() {
			// grab data from image
			temp_ctx.drawImage(this, 0, 0);
			img_data = temp_ctx.getImageData(0, 0, main.map_img.width, main.map_img.height);
			
			// now draw it scaled-up on the map canvas
			main.draw_minimap();
			
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

Main.prototype.handle_keypress = function(val, e) {
	var main = this;
	
	if (e.code === "KeyW") {
		main.move_state.forward = val;
	}
	else if (e.code === "KeyS") {
		main.move_state.backward = val;
	}
	else if (e.code === "KeyA") {
		main.move_state.turn_left = val;
	}
	else if (e.code === "KeyD") {
		main.move_state.turn_right = val;
	}
};

Main.prototype.draw_column = function(col) {
	var main = this;
	
	if (! col.is_wall) {
		return;
	}
	
	var draw_height = main.canvas.height / (col.dist);
	var draw_width = main.canvas.width / main.num_columns;
	
	var init = {x: 0, y: 0, width: draw_width, height: draw_height};
	var draw_rect = new main.Rect(init);
	var center = new main.Pt({x: (draw_width * col.idx) - (draw_width / 2.0), y: main.canvas.height / 2.0});
	draw_rect.center(center);
	
	// set color darkness by distance
	var this_color = new Color(main.wall_color.toString());
	var dark_factor = 40 * (col.dist / main.max_view_dist);
	this_color.darken(dark_factor);
	
	main.view_ctx.fillStyle = this_color.toString();
	main.view_ctx.fillRect(draw_rect.x, draw_rect.y, draw_rect.width, draw_rect.height);
};

// parallel-to-wall problem is in here -- when on negative side of wall,
// rays pointing away from wall will have cos or sin < 0 and check the wrong square
Main.prototype.get_square = function(x, y, cos, sin) {
	var main = this;
	
	var idx, ret = {};
	
	var lookup_x, lookup_y;
	if (cos <= 0) {
		lookup_x = Math.ceil(x);
	}
	else {
		lookup_x = Math.floor(x);
	}
	
	if (sin <= 0) {
		lookup_y = Math.ceil(y);
	}
	else {
		lookup_y = Math.floor(y);
	}
	
	idx = (lookup_x + (lookup_y * main.map_img.height)) * 4;
	ret.r = main.map_data.data[idx];
	ret.g = main.map_data.data[idx + 1];
	ret.b = main.map_data.data[idx + 2];
	ret.a = main.map_data.data[idx + 3];
	
	ret.is_wall = !!ret.r;
	ret.x = x;
	ret.y = y;
	return ret;
};

Main.prototype.get_dist = function(pt1, pt2) {
	var x_diff = Math.abs(pt1.x - pt2.x);
	var y_diff = Math.abs(pt1.y - pt2.y);
	var dist = Math.sqrt(x_diff * x_diff + y_diff * y_diff);
	
	return dist;
};

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
		//console.log("view_ang: ", to_deg(view_ang));
		col = nearest_wall(view_ang);
		col.idx = c;
		col.ang = view_ang;
		columns.push(col);
	}
	
	//console.log(columns);
	return columns;
	
	function outside_map(pt) {
		return (pt.x < 0 || pt.y < 0) || (pt.x > main.map_img.width || pt.y > main.map_img.height);
	}
	
	function nearest_wall(ang) {
		var cur = {ang: ang, is_wall: false};
		var temp_pt = new main.Pt({x: main.player.loc.x, y: main.player.loc.y});;
		var dist, stop = false, cnt = 0;
		var cos = Math.cos(ang), sin = Math.sin(ang);
		
		while (! cur.is_wall && ! stop && ! outside_map(cur)) {
			temp_pt = next_grid(cos, sin, temp_pt.x, temp_pt.y);
			cur = main.get_square(temp_pt.x, temp_pt.y, cos, sin);
			dist = dist = main.get_dist(main.player.loc, temp_pt);
			cur.dist = dist;
			if (dist > main.max_view_dist) {
				stop = true;
			}
		}
		
		cur.x = temp_pt.x;
		cur.y = temp_pt.y;
		
		// illuminate ray endpoint
		main.draw_minimap_point(cur, "#76ff00");
		
		return cur;
	}
	
	function next_whole(num) {
		if (num % 1.0 === 0) {
			return num + 1.0;
		}
		return Math.ceil(num);
	}
	
	function next_whole_down(num) {
		if (num % 1.0 === 0) {
			return num - 1.0;
		}
		return Math.floor(num);
	}
	
	function next_grid(run, rise, x, y) {
		var temp_x, temp_y, whole_x, whole_x_y, whole_y, whole_y_x;
		
		temp_x = run >= 0 ? next_whole(x) - x : next_whole_down(x) - x;
		temp_y = temp_x * (rise/run);
		whole_x = temp_x + x;
		whole_x_y = temp_y + y;
		
		temp_y = rise >= 0 ? next_whole(y) - y : next_whole_down(y) - y;
		temp_x = temp_y * (run/rise);
		whole_y = temp_y + y;
		whole_y_x = temp_x + x;
		
		var whole_x_pt = new main.Pt({x: whole_x, y: whole_x_y});
		var whole_y_pt = new main.Pt({x: whole_y_x, y: whole_y});
		
		var init_pt = new main.Pt({x: x, y: y});
		var whole_x_dist = main.get_dist(init_pt, whole_x_pt);
		var whole_y_dist = main.get_dist(init_pt, whole_y_pt);
		
		var ret = whole_x_dist <= whole_y_dist ? new main.Pt({x: whole_x, y: whole_x_y}) : new main.Pt({x: whole_y_x, y: whole_y});
		// illuminate ray
		main.draw_minimap_point(ret, "#76ff00");
		return ret;
	}
}

function mean(arr) {
	function sum_up(tot, n) {
		return tot + n;
	}
	var total = arr.reduce(sum_up);
	return total / arr.length;
}

Main.prototype.tick = function() {
	var main = this;
	
	// clear view screen
	main.view_ctx.clearRect(0, 0, main.canvas.width, main.canvas.height);
	main.view_ctx.fillStyle = "#000000";
	main.view_ctx.rect(0, 0, main.canvas.width, main.canvas.height);
	main.view_ctx.fill();
	
	// clear mini map
	main.map_ctx.clearRect(0, 0, main.map_canvas.width, main.map_canvas.height);
	main.map_ctx.fillStyle = "#000000";
	main.map_ctx.rect(0, 0, main.map_canvas.width, main.map_canvas.height);
	main.map_ctx.fill();
	
	// handle movement
	main.player.move();
	// draw the minimap with the player's new position
	main.draw_minimap();
	
	// draw our columns
	var columns = main.get_columns();
	columns.forEach(function(col) {
		main.draw_column(col);
	});
	
	var now = Date.now();
	var fps = 1000.0 / (now - main.last_tick);
	var avg;
	main.last_tick = now;
	
	main.fps_samples.push(now);
	
	// update avg fps if samples have accumulated over 2 seconds
	if (now - main.fps_samples[0] > 2000) {
		var i, accum = [];
		for (i = 1; i < main.fps_samples.length; i++) {
			accum.push(main.fps_samples[i] - main.fps_samples[i - 1]);
		}
		fps = mean(accum);
		main.fps_field.innerHTML = fps.toFixed(0);
		main.fps_samples = [];
	}
	
	//main.fps_field.innerHTML = fps.toString();
	//console.log(columns);
	//main.pause();
};

Main.prototype.pause = function() {
	var main = this;
	
	console.log("pausing");
	window.clearInterval(main.int);
	main.int = null;
};

Main.prototype.resume = function() {
	var main = this;
	
	console.log("resuming");
	main.int = window.setInterval(main.tick.bind(main), 33);
};

Main.prototype.run = function() {
	var main = this;
	
	main.load_map("map.png").then(
		// start stuff
		function() {
			console.log("player angle: ", to_deg(main.player.dir));
			console.log("player loc: " + main.player.loc);
			
			//main.int = window.setInterval(main.tick.bind(main), 33);
			main.resume();
			
			/*
			main.view_ctx.clearRect(0, 0, main.canvas.width, main.canvas.height);
			main.view_ctx.fillStyle = "#000000";
			main.view_ctx.rect(0, 0, main.canvas.width, main.canvas.height);
			main.view_ctx.fill();

			var columns = main.get_columns();
			columns.forEach(function(col) {
				main.draw_column(col);
			});
			*/
		}
	);
};

function to_deg(rad) {
	return (180.0/Math.PI) * rad;
};

// returns 1 if num is positive (or zero), -1 if negative
function sign(num) {
	return (num >= 0) ? 1 : -1;;
}

var app;
window.addEventListener("load", function() {
	var canvas = document.getElementById("main_canvas");
	var map_canvas = document.getElementById("map_canvas");
	var fps_field = document.getElementById("fps_field");
	app = new Main({canvas: canvas, map_canvas: map_canvas, fps_field: fps_field});
});
