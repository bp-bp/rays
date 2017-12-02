<script id = "test_shader" type = "shader">
		precision mediump float;
		varying vec2 vTextureCoord;
		uniform sampler2D uSampler;
		uniform vec2 dimensions;
		uniform vec4 filterArea;
		uniform float px_tile_width;
		
		vec2 mapCoord( vec2 coord ) {
		
			coord *= filterArea.xy;
			coord += filterArea.zw;

			return coord;
		}

		vec2 unmapCoord( vec2 coord ) {
			coord -= filterArea.zw;
			coord /= filterArea.xy;

			return coord;
		}
		
		void main(void) {
			// get screen/px coord
			vec2 screen = mapCoord(vTextureCoord);
			
			// get px square coord
			vec2 raw = vec2((screen.x / px_tile_width), (screen.y / px_tile_width));
			vec2 px_square_coord = vec2(floor(raw.x) * px_tile_width, floor(raw.y) * px_tile_width);
			px_square_coord += 0.5;
			
			float bordx = 0.0;
			bordx = mod(screen.x, px_tile_width);
			bordx = step(1.0, bordx);
			float bordy = 0.0;
			bordy = mod(screen.y, px_tile_width);
			bordy = step(1.0, bordy);
			
			float border = bordx * bordy;
			
			// put it back
			vec2 orig = unmapCoord(screen);
			vec2 sq_coord = unmapCoord(px_square_coord);
			
			vec4 color = texture2D(uSampler, sq_coord);
			
			gl_FragColor = vec4(color.r * border, color.g * border, color.b * border, 1.0);
		}
	</script>
	
	
	
	<script id = "failed_atlas_test" type = "shader">
		varying vec2 vTextureCoord;
		
		uniform sampler2D uSampler;
		uniform sampler2D tile_tex_atlas;
		uniform float tile_tex_ratio_x;
		uniform float tile_tex_ratio_y;
		uniform vec2 dimensions;
		uniform vec4 filterArea;
		uniform float px_tile_width;
		
		
		vec2 mapCoord( vec2 coord ) {
			coord *= filterArea.xy;
			coord += filterArea.zw;

			return coord;
		}

		vec2 unmapCoord( vec2 coord ) {
			coord -= filterArea.zw;
			coord /= filterArea.xy;

			return coord;
		}
		
		void main(void){
			// get screen/px coord
			vec2 screen = mapCoord(vTextureCoord);
			
			// get px square coord
			vec2 raw = vec2((screen.x / px_tile_width), (screen.y / px_tile_width));
			vec2 px_square_coord = vec2(floor(raw.x) * px_tile_width, floor(raw.y) * px_tile_width);
			px_square_coord += 0.5; // prevents bleeding
			
			// put it back as a texture coord and get the square color
			vec2 orig = unmapCoord(screen);
			vec2 sq_coord = unmapCoord(px_square_coord);
			vec4 sq_color = texture2D(uSampler, sq_coord);
			
			// step colors
			float num_colors = 6.0;
			sq_color = floor(sq_color * num_colors) / num_colors;
			
			
			
			// get the various tile textures
			vec2 tile_tex_ratio = vec2(tile_tex_ratio_x, tile_tex_ratio_y); // used to calculate right spot on texture
			vec2 tile_texture_coord = vTextureCoord * 0.5; // shrunk to the size of each texture in the atlas, 1/4 of total
			
			// now adjust offsets one by one to get each of the four colors
			// first is top left
			tile_texture_coord.y += 0.5;
			vec4 tile_tex0_color = texture2D(tile_tex_atlas, tile_texture_coord * tile_tex_ratio);
			// now top right
			tile_texture_coord.x += 0.5;
			vec4 tile_tex1_color = texture2D(tile_tex_atlas, tile_texture_coord * tile_tex_ratio);
			// now bottom left
			tile_texture_coord.x -= 0.5;
			tile_texture_coord.y -= 0.5;
			vec4 tile_tex2_color = texture2D(tile_tex_atlas, tile_texture_coord * tile_tex_ratio);
			// and now bottom right
			tile_texture_coord.x += 0.5;
			vec4 tile_tex3_color = texture2D(tile_tex_atlas, tile_texture_coord * tile_tex_ratio);
			
			vec4 out_color;
			if (sq_color.r < 0.1) {
				out_color = tile_tex0_color;
			}
			else if (sq_color.r < 0.2) {
				out_color = tile_tex1_color;
			}
			else if (sq_color.r < 0.4) {
				out_color = tile_tex2_color;
			}
			else {
				out_color = tile_tex3_color;
			}
			
			/*
			// prep for flip
			float flip_factor = 1.0;
			float flip_neg = 1.0; // this guy negates flip_factor when flip condition does not apply
			if (sq_color.r > 0.1) {
				//flip_factor = abs(sin(time));
				flip_factor = fract(time);
			}
			else {
				flip_neg = 0.0;
			}
			*/
			// get border
			float modx = 0.0;
			modx = floor(mod(screen.x, px_tile_width));
			float bordx = step(1.0, modx);
			float mody = 0.0;
			mody = floor(mod(screen.y, px_tile_width));
			//float bordy = step(1.0, mody - (flip_factor * px_tile_width * flip_neg)); // flip is here
			float bordy = step(1.0, mody);
			float border = bordx * bordy;
			
			// sets flip color
			if (mody > 0.01 && modx > 0.01 && border < 0.01) {
				border = 1.0;
				out_color = tile_tex3_color;
			}
			
			gl_FragColor = vec4(out_color.r * border , out_color.g * border, out_color.b * border, 1.0);
			//gl_FragColor = vec4(0.0, fr[0], 0.0, 1.0);
		}
	</script>