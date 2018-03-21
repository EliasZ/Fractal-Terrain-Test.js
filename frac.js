function rand_range(max, min)
{
	return Math.random() * (max-min) + min;
}

var canvas;
var context;

var keyOn = [];

FractalTerrain = new function()
{
	var MINHEIGHT = (-20000);
	var MAXHEIGHT = 20000;
	
    // Fiddle with these two to make different types of landscape at different distances
	var RANGE_CHANGE = 13000;
	var REDUCTION = 0.7;
	
	var heightmap = [];
	var screen;
	
	var width;
	var height;
	
	var interval;
	
	var newrender;
	
	this.run = function()
	{
		canvas = document.getElementById('canvas');		
		context = canvas.getContext('2d')
		
		width = canvas.width;
		height = canvas.height;
		
		screen = context.createImageData(canvas.width, canvas.height);
		
		var i, e;
		
		for (e = 0; e < height; ++e)
			for (i = 0; i < width; ++i)
				heightmap[i] = [];
		
		make_map();

		interval = setInterval(render, 30/1000);
	}
	
	function render()
	{
		if (keyOn[107] || keyOn[187]) // +
			shift_all(100);
		else if (keyOn[109] || keyOn[189]) // -
			shift_all(-100);
		else if (keyOn[32]) // spacebar
			make_map();
		
		if (!newrender)
			return;

		heightmap_to_screen();

		context.clearRect(0, 0, canvas.width, canvas.height);
		context.putImageData(screen, 0, 0);
		
		newrender = false;
	}

	// color = [red, green, blue, alpha]
	function set_point(x, y, color)
	{
		screen.data[(x + y * screen.width) * 4] = color[0];
		screen.data[(x + y * screen.width) * 4 + 1] = color[1];
		screen.data[(x + y * screen.width) * 4 + 2] = color[2];
		screen.data[(x + y * screen.width) * 4 + 3] = color[3];
	}
	
	function height_to_colour(height)
	{
		var value;
		var range;

		range = MAXHEIGHT - MINHEIGHT;
    
		if (height < MINHEIGHT)
			height = MINHEIGHT;
		else if (height > MAXHEIGHT)
			height = MAXHEIGHT;
		
		value = ((height - MINHEIGHT) / range) * 255;
		
		if (height < 0)
			return [0, 0, value, 255];
		
		return [30, value, 30, 255];
		return [value, value, value, 255];
	}
	
	function heightmap_to_screen()
	{
		var i, e;

		for (e = 0; e < height; ++e)
			for (i = 0; i < width; ++i)
				set_point(i, e, height_to_colour(heightmap[i][e]));
	}
	
	function rect_avg_heights(r) 
	{
		var total;
		
		total = heightmap[r.x][r.y];
		total += heightmap[(r.x + r.w) % width][r.y];
		total += heightmap[r.x][r.y + r.h];
		total += heightmap[(r.x + r.w) % width][r.y + r.h];
		
		return total / 4;
	}
	
	function diam_avg_heights(r) 
	{
		var total;
		var divisors;

		divisors = 1;
		total = 0;
		
		// TOP
		if (r.y >= 0)
		{
			total += heightmap[r.x + r.w / 2][r.y];
			divisors++;
		}
   
		// LEFT
		if (r.x >= 0)
		{
			total += heightmap[r.x][r.y + r.h / 2];
			divisors++;
		}
		
		// RIGHT
		total += heightmap[(r.x + r.w) % width][r.y + r.h / 2];
		
		// BOTTOM
		if (r.y + r.h < height)
		{
			total += heightmap[r.x + r.w / 2][r.y + r.h];
			divisors++;
		}

		if (!divisors)
		{
			console.log('Floating point error in diam_avg_heights. Exiting cleanly.');
			return (interval = clearInterval(interval));
		}

		return total / divisors;
	}
	
	function draw_all_squares(w, h, deviance) 
	{
		// >implying SDL_Rect
		var r = new Object;
		r.w = w;
		r.h = h;

		for (r.y = 0; r.y < height; r.y += r.h)
			for (r.x = 0; r.x < width; r.x += r.w)
				heightmap[r.x + r.w / 2][r.y + r.h / 2] = rect_avg_heights(r) + rand_range(-RANGE_CHANGE, RANGE_CHANGE) * deviance;
	}

	function draw_all_diamonds(w, h, deviance) 
	{
		var r = new Object;
		r.w = w;
		r.h = h;

		for (r.y = 0 - r.h / 2; r.y < height; r.y += r.h)
			for (r.x = 0; r.x < width; r.x += r.w)
				heightmap[r.x + r.w / 2][r.y + r.h / 2] = diam_avg_heights(r) + rand_range(-RANGE_CHANGE, RANGE_CHANGE) * deviance;
		
		for (r.y = 0; r.y < height; r.y += r.h)
			for (r.x = 0 - r.w / 2; r.x + r.w / 2 < width; r.x += r.w)
				heightmap[r.x + r.w / 2][r.y + r.h / 2] = diam_avg_heights(r) + rand_range(-RANGE_CHANGE, RANGE_CHANGE) * deviance;
	}
	
	// Resets the whole heightmap to the minimum height
	function sanitise_map() 
	{
		for (var e = 0; e < height; ++e) 
		{
			for (var i = 0; i < width; ++i) 
			{
				if (heightmap[i][e] < MINHEIGHT)
					heightmap[i][e] = MINHEIGHT;
				if (heightmap[i][e] > MAXHEIGHT)
					heightmap[i][e] = MAXHEIGHT;
			}
		}
	}

	function shift_all(amnt) 
	{
		for (var e = 0; e < height; ++e)
			for (var i = 0; i < width; ++i)
				heightmap[i][e] += amnt;
			
		newrender = true;
	}
	
	function make_map()
	{
		var w = width;
		var h = height;
		var deviance;

		// Reset the whole heightmap to the minimum height
		for (var e = 0; e < height; ++e)
			for (var i = 0; i < width; ++i)
				heightmap[i][e] = MINHEIGHT;
		
		heightmap[0][0] = rand_range(-RANGE_CHANGE, RANGE_CHANGE);
		heightmap[0][height] = rand_range(-RANGE_CHANGE, RANGE_CHANGE);

		deviance = 1.0;
		
		while (1) 
		{
			draw_all_squares(w, h, deviance);
			draw_all_diamonds(w, h, deviance);

			w /= 2;
			h /= 2;

			if (w < 2 && h < 2)
				break;

			if (w < 2)
				w = 2;
			if (h < 2)
				h = 2;
			
			deviance *= REDUCTION;
		}
		
		newrender = true;
	}	
}

window.onload = function()
{
	document.addEventListener('keydown', function(event)
	{
		keyOn[event.keyCode] = true;
	}, false);
	
	document.addEventListener('keyup', function(event)
	{
		keyOn[event.keyCode] = false;
	}, false);
	
	FractalTerrain.run();
};
