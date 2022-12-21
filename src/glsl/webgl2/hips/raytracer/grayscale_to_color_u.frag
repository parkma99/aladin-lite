#version 300 es
precision highp float;
precision highp sampler2D;
precision highp usampler2D;
precision highp isampler2D;
precision mediump int;

in vec2 out_clip_pos;
in vec3 frag_pos;
out vec4 out_frag_color;

struct Tile {
    int uniq; // Healpix cell
    int texture_idx; // Index in the texture buffer
    float start_time; // Absolute time that the load has been done in ms
    float empty;
};

uniform Tile textures_tiles[12];

struct TileColor {
    Tile tile;
    vec4 color;
    bool found;
};

@include "../color_u.glsl"
@include "./healpix.glsl"

uniform float opacity;

vec4 get_tile_color(vec3 pos) {
    HashDxDy result = hash_with_dxdy(0, pos.zxy);
    int idx = result.idx;
    vec2 uv = vec2(result.dy, result.dx);

    Tile tile = textures_tiles[idx];

    int idx_texture = tile.texture_idx >> 6;
    int off = tile.texture_idx & 0x3F;
    float idx_row = float(off >> 3); // in [0; 7]
    float idx_col = float(off & 0x7); // in [0; 7]

    vec2 offset = (vec2(idx_col, idx_row) + uv)*0.125;
    vec3 UV = vec3(offset, float(idx_texture));

    vec4 color = get_color_from_grayscale_texture(UV);
    // For empty tiles we set the alpha of the pixel to 0.0
    // so that what is behind will be plotted
    color.a *= (1.0 - tile.empty);
    return color;
}

uniform sampler2D position_tex;
uniform mat4 model;

void main() {
    /*vec2 uv = out_clip_pos * 0.5 + 0.5;
    vec3 n = texture(position_tex, uv).rgb;

    vec3 frag_pos = vec3(model * vec4(n, 1.0));*/

    vec4 c = get_tile_color(frag_pos);
    out_frag_color = c;
    out_frag_color.a = out_frag_color.a * opacity;
}