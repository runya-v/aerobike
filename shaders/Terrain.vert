uniform sampler2D height_texture;
uniform sampler2D route_curve;
uniform float height_scale;
varying float f_amount;
varying float f_uvx;
varying vec4 v_route;
varying vec2 v_uv;

void main() {
    v_uv = uv;
    f_uvx = uv.x;
    f_amount = texture2D(height_texture, uv).r;
    v_route = texture2D(route_curve, uv);
//    vec3 _new_pos = position + normal * height_scale * f_amount;
//    gl_Position = projectionMatrix * modelViewMatrix * vec4(_new_pos, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position + normal, 1.0);
}