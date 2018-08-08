var Pt = (function() {
	var store = {};

	var empty_cnt = 0;
	var active_cnt = 0;
	var empties = new Map();
	var actives = new Map();
	
	var proto = {
		// not sure I'm going to use this
		clear: function() {
			this.x = 0;
			this.y = 0;
		},
		free: function() {
			actives.delete(this.id);
			empties.set(this.id, this);
		},
		add: function(val) {
			if (typeof val != "number") {
				throw new Error("problem in Pt.add, val passed is not a number. val: " + val.toString());
			}

			this.x += val;
			this.y += val;
		},
		// multiplies both x and y by scalar
		mul: function(val) {
			if (typeof val != "number") {
				throw new Error("problem in Pt.add, val passed is not a number. val: " + val.toString());
			}

			this.x = this.x * val;
			this.y = this.y * val;
		}
	};

	function check_params(init) {
		if (init.x != undefined && init.y != undefined && (typeof init.x === "number") && (typeof init.y === "number")) {
			return;
		}
		// otherwise error
		throw new Error("problem with Pt init, no or invalid xy or Pt provided.");
	};

	for (var q = 0; q < 1000; q++) {
		create();
	}

	function create(init) {
		var pt;
		
		// if there's no init, we're creating a blank Pt to go in empties
		if (! init) {
			empty_cnt += 1;
			pt = Object.create(proto);
			pt.x = null;
			pt.y = null;
			pt.id = empty_cnt;
			pt.in_use = false;
			empties.set(empty_cnt, pt);
			return pt;
		}
		
		// otherwise, check that we got a valid init object and make one
		check_params(init);

		active_cnt += 1;
		pt = Object.create(proto);
		pt.x = init.x;
		pt.y = init.y;
		pt.id = active_cnt;
		pt.in_use = true;
		console.log("active_cnt: ", active_cnt);
		actives.set(active_cnt, pt);
		return pt;
	}
	create.empties = empties;
	create.actives = actives;

	return create;
})();
