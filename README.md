# rays
This is a simple implementation of ray-casting in an HTML5 2d canvas. The result is a pseudo-3d first-person view of a room full of walls. It's "pseudo-3d" because there's really no 3-dimensional information here -- just a 2d "map" in the form of a .png file (map.png). 

The canvas is divided into narrow vertical strips. We calculate the view angle for each strip, then cast out a "ray" along that angle until it intersects a wall on the map (i.e. the x,y position of a point on the ray falls on a white pixel in the .png file). If it does, we draw a vertical line in that canvas slice scaled by the length of the ray. That's it. 

The real code here is the rays.js file. The rest is just a test bed I slapped together for, ah, testing.
