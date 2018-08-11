var Rect = (function() {
	var store = {
		empties: [],
		actives: [],
		persist: []
	};
	
	var proto = {
		init: function(init) {
			this.x = init.x;
			this.y = init.y;
			this.width = init.width;
			this.height = init.height;
			this.in_use = init.in_use !== undefined ? init.in_use : true;
		},
		top: function() {
			return this.y;
		},
		bottom: function() {
			return this.y + this.height;
		},
		left: function() {
			return this.x;
		},
		right: function() {
			return this.x + this.width;
		},
		center: function() {
			if (arguments.length) {
				// if we were passed a Pt
				// fix this too
				if (arguments.length === 1) {// && (arguments[0] instanceof main.Pt)) {
					this.x = arguments[0].x - (this.width / 2.0);
					this.y = arguments[0].y - (this.height / 2.0);
				}
				// if we were passed x,y
				else if (arguments.length === 2 && (typeof arguments[0] === "number") && (typeof arguments[1] === "number")) {
					this.x = arguments[0] - (this.width / 2.0);
					this.y = arguments[1] - (this.height / 2.0);
				}
			}

			// think about how to handle persist here!
			return Pt({x: this.x, y: this.y});
		}
	};

	function flip_actives() {
		//console.log('rect actives.length was: ', store.actives.length);
		//console.log('rect persist.length is: ', store.persist.length);
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
		return create(init, true);
	}

	function create(init, persist) {
		var rect;
		
		if (! init) {
			rect = Object.create(proto);
			rect.x = null;
			rect.y = null;
			rect.width = null;
			rect.height = null;
			rect.in_use = false;
			if (! persist) {
				store.empties.push(rect);
				rect.id = store.empties.length - 1;
			} else {
				store.persist.push(rect);
				rect.id = store.persist.length - 1;
			}
			return rect;
		}
		
		rect = get_empty() || Object.create(proto);
		rect.init(init);
		if (! persist) {
			store.actives.push(rect);
			rect.id = store.actives.length - 1;
		} else {
			store.persist.push(rect);
			rect.id = store.persist.length - 1;
		}
		return rect;
		
	}

	create.get_empty = get_empty.bind(create);
	create.flip_actives = flip_actives.bind(create);
	create.create_persist = create_persist.bind(create);

	return create;
})();
