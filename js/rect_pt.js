function Pt(x, y) {
	this.type = "Pt";
	this.x = x;
	this.y = y;
}

function Rect(x, y, w, h) {
	this.init_self(x, y, w, h);
}

Rect.prototype.init_self = function(x, y, w, h) {
	this.x = x;
	this.y = y;
	this.width = w;
	this.height = h;
};

// getter/setter, couple of different signatures here
Rect.prototype.center = function() {
	// if we got passed a single Pt
	if (arguments.length === 1 && typeof arguments[0] === "object") {
		if (arguments[0].hasOwnProperty("x") && arguments[0].hasOwnProperty("y")) {
			this.x = arguments[0].x - (this.width/2);
			this.y = arguments[0].y - (this.height/2);
		}
	}
	// if we got two numbers (x, y)
	else if (arguments.length === 2 && !isNaN(arguments[0]) && !isNaN(arguments[1])) {
		this.x = arguments[0] - (this.width/2);
		this.y = arguments[1] - (this.height/2);
	}
	
	return new Pt(this.x + (this.width/2), this.y + (this.width/2));
};