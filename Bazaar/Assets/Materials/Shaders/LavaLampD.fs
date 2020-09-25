/*
Recommended:
    grabbble: off
    collides: off

Example User Data:
{
  "ProceduralEntity": {
    "shaderUrl": "atp:/LavaLampD.fs",
    "version": 2,
    "uniforms": {
      "cap_color": [0,0,0,1],
      "wireframe": 0.9
    },
    "channels": []
  }
}

{
  "ProceduralEntity": {
    "shaderUrl": "atp:/LavaLampD.fs",
    "version": 2,
    "uniforms": {
      "cap_color": [0,0,0,1],
      "wireframe": 0
    },
    "channels": []
  }
}


*/

float smin( float a, float b, float k )
{
    float h = max( k-abs(a-b), 0.0 );
    return min( a, b ) - h*h*0.25/k;
}

const float PI = 3.14159;
const float TAU= PI * 2;

uniform float KEY = 3;
uniform vec4 cap_color = vec4(1,0,0,1);
uniform float wireframe = 0;


float rand(float n){return fract(sin(n) * 43758.5453123);}

float interpolate(float a, float b, float c, float d, float t) {
// data: a--b--c--d
// time:    0--1
    float m1 = (c-a)/2;
    float m2 = (d-b)/2;
    float t2 = t*t;
    float t3 = t2*t;
    return dot(vec4(b,m1,c,m2), vec4(2*t3-3*t2+1, t3-2*t2+t, 3*t2-2*t3, t3-t2));
}

float srand(float n) {
    float i = floor(n);
    float t = fract(n);
    return interpolate(rand(i-1), rand(i), rand(i+1), rand(i+2), t);
}

float SDF(vec3 pos) {
    float r = min(iWorldScale.x, min(iWorldScale.y, iWorldScale.z));
    
    float displacement = sin(10*pos.x)*sin(10*pos.y - iGlobalTime)*sin(10*pos.z)*.03* r;
    float best = length(pos*vec3(1,2,1))-r/2+displacement;
    pos.y -= iWorldScale.y/2; // center the blobs vertically


    //center.y += abs(sin(iGlobalTime*TAU));
    //float best = 10000;
    int blobs = 10;

    
    for(int blob = 1 ; blob <= blobs ; blob++){
        vec3 blob_pos = (vec3(rand(blob), srand(iGlobalTime*.1 + blob*1.618), rand(blob+1)) -.5) * iWorldScale;
        float blob_r = (.1+ .05 * abs(rand(blob*1.0)))*r;
        blob_pos.xz /= 2;
        float dist = length(pos - blob_pos) - blob_r + displacement;
        best = smin(best, dist, 0.3);
    }
    return best;
}

vec3 estimateNormal(vec3 p) {
    float EPSILON = .001;
    return normalize(vec3(
        SDF(vec3(p.x + EPSILON, p.y, p.z)) - SDF(vec3(p.x - EPSILON, p.y, p.z)),
        SDF(vec3(p.x, p.y + EPSILON, p.z)) - SDF(vec3(p.x, p.y - EPSILON, p.z)),
        SDF(vec3(p.x, p.y, p.z  + EPSILON)) - SDF(vec3(p.x, p.y, p.z - EPSILON))
    ));
}
float getProceduralColors(inout vec3 diffuse, inout vec3 specular, inout float shininess) {
    specular = vec3(0);
    shininess = 127;
    
    vec3 surface_pos = _position.xyz*iWorldScale;
    vec3 eye_pos = inverse(iWorldOrientation)*(getEyeWorldPos()-iWorldPosition);
    surface_pos.y +=  iWorldScale.y/2;
    eye_pos.y +=  iWorldScale.y/2;
    // eye/surface space:
    // WorldScale
    // ObjectOrientation
    // Origin is bottom center

    
    vec3 ray_dir = normalize(surface_pos - eye_pos);
    int max_steps = 20;
    int step = 0;
    float total_distance = 0;
    float eps = .01;
    vec3 pos;
    for(step = 0 ; step < max_steps; step ++ ){
        pos = surface_pos + ray_dir * total_distance;
        float d = SDF(pos);
        if(d < eps) {
            d = clamp(d,0,eps);
            if(d<wireframe*eps)
                discard;
            total_distance = d/2;
            break;
        }
        total_distance += d;
    }
    if(step == max_steps) {
        //diffuse = vec3(
        //    0,0,.5*dot(ray_dir.xz, surface_pos.xz)*dot(ray_dir.xz, surface_pos.xz)
        //);

        discard;
    } else {
        float v =-dot(ray_dir, estimateNormal(pos));
        vec3 t = vec3(.618, 1, 1.618) * iGlobalTime;
        diffuse = mix(cos(t), sin(t), v)*.5+.5;
    }
    return 1;
}
