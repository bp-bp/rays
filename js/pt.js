var Pt = (function() {
	var store = {};

	var empty_cnt = 0;
	var empties = [];//new Map();
	var actives = [];//new Map();
	var store = {
		empties: [],
		actives: [],
		persist: []
	};
	
	var proto = {
		// not sure I'm going to use this
		clear: function() {
			this.x = 0;
			this.y = 0;
		},
		// this one doesn't really work without the Map... I think the array plan is better
		// for right now though
		/*
		free: function() {
			actives.delete(this.id);
			empties.set(this.id, this);
		},
		*/
		init: function(init) {
			this.x = init.x;
			this.y = init.y;
			//this.id = init.id;
			this.in_use = init.in_use !== undefined ? init.in_use : true;
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
		},
		toString: function() {
			return this.x.toString() + "," + this.y.toString();
		}
	};

	function check_params(init) {
		if (init.x != undefined && init.y != undefined && (typeof init.x === "number") && (typeof init.y === "number")) {
			return;
		}
		// otherwise error
		throw new Error("problem with Pt init, no or invalid xy or Pt provided.");
	};

	/*
	for (var q = 0; q < 1000; q++) {
		create();
	}
	*/

	function flip_actives() {
		console.log('actives.length was: ', store.actives.length);
		console.log('persist.length is: ', store.persist.length);
		var empties = store.empties;
		var actives = store.actives;
		store.empties = actives;
		store.actives = empties;
	}

	function get_empty(init) {
		if (store.empties.length) {
			//console.log('got empty');
			return store.empties.pop();
		}
		return null;
	}

	function create_persist(init) {
		return pt = create(init, true);
	}

	function create(init, persist) {
		if (init.pt) {
			console.log('right heah');
		}
		//console.log('create');
		var pt;
		
		// if there's no init, we're creating a blank Pt to go in empties
		if (! init) {
			pt = Object.create(proto);
			pt.x = null;
			pt.y = null;
			pt.in_use = false;
			if (! persist) {
				store.empties.push(pt);
				pt.id = store.empties.length - 1;
			} else {
				store.persist.push(pt);
				pt.id = store.persist.length - 1;
			}
			return pt;
		}
		
		// otherwise, check that we got a valid init object and make one
		check_params(init);

		pt = get_empty() || Object.create(proto);
		
		pt.init(init);
		//pt.x = init.x;
		//pt.y = init.y;
		//pt.in_use = true;
		if (! persist) {
			store.actives.push(pt);
			pt.id = store.actives.length - 1;
		} else {
			store.persist.push(pt);
			pt.id = store.persist.length - 1;
		}
		return pt;
	}

	create.empties = empties;
	create.actives = actives;
	create.get_empty = get_empty.bind(create);
	create.flip_actives = flip_actives.bind(create);
	create.create_persist = create_persist.bind(create);

	return create;
})();
