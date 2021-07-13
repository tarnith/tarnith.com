//import * as THREE from './three.js';
//import {WEBGL} from './webgl.js';

window.addEventListener('load',init)

let scene,camera,renderer;
let sceneObjects = [];

// Uniform declaration has to be in global script scope to read properly into function calls
const uniforms = {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector3() },
    iMouse: { type: "v2", value: new THREE.Vector2()}
  };


function init(){
    scene = new THREE.Scene();
    camera = new THREE.Camera();
    camera.position.z = 1;   
    
    renderer = new THREE.WebGLRenderer({ canvas: testCanvas })
    renderer.setPixelRatio( window.devicePixelRatio );
    //document.body.appendChild(renderer.domElement)
    onWindowResize();
    window.addEventListener( 'resize', onWindowResize, false );
    //addExperimentalCube(uniforms)
    addShaderPlane(uniforms);
    render();
  }


function vertexShader() {
    return `
    void main() {
      gl_Position = vec4( position, 1.0 );
  }
    `
  }

function fragmentShader() {
    return `
    #define S(d) smoothstep(0., -20./iResolution.y, d);
    uniform vec2 iResolution;
        uniform float iTime;
        vec3 rgb2hsv(in vec3 c) {
          vec4 K = vec4(0., -.33333333333333333333, .6666666666666666666, -1.);
      
      
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
      
      
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6. * d + e)), 
                      d / (q.x + e), 
                      q.x);
      }
      vec3 hsv2rgb(in vec3 hsb) {
        vec3 rgb = clamp(abs(mod(hsb.x * 6. + vec3(0., 4., 2.), 
                                6.) - 3.) - 1.,
                          0.,
                          1.);
        
        rgb = rgb*rgb*(3. - 2. * rgb);
        
        return hsb.z * mix(vec3(1.), rgb, hsb.y);
    }
      vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
      return a + b*cos( 6.28318*(c*t+d) );
      }
      
        vec3 spectrum(float n) {
      return pal( n, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
      }
      
      
      vec3 hueShift(in vec3 color, in float amount) {
        vec3 hsv = rgb2hsv(color);
        hsv.r += amount;
        return hsv2rgb(hsv);
      }
      
        void main() {
          vec2 fragCoord = gl_FragCoord.xy;
          // vec4 color = texture(sTD2DInputs[0], vUV.st);
          vec2 uv = (fragCoord-.5*iResolution.xy) /iResolution.y;
            
          vec3 col = vec3(0.);
          
          vec2 gv = fract(uv*10.)-.5;
          vec2 av = fract(uv*11.)-.5;
          
          vec3 loopOut = vec3(0);
        
          float m = 0.;
          float n = 0.;
                 
          float delayAmt = 2.;
        
          float otherTime = (iTime+2.);
        
        
          float t = iTime*5.;
          float tDel = (iTime-(t*delayAmt))*.1;
          float tDel2 = (iTime-(delayAmt*2.))*.1;
        
          for (float y=-1.; y<=1.; y++){for(float x=-1.; x<=1.; x++){
              
              vec2 offset = vec2(x, y);
        
              float d = length(gv-offset);
              float altD = length(av-offset);
          
              float r = mix(.32, .5, sin((-t*.5+.5)+length(sin(uv))*40.));
              m += S(d-r);
              float rDel = mix(.2, .5, sin((tDel*.5+.5)+length(sin(uv*10.))*20.));
              n += S(altD-rDel);//mod(smoothstep(rDel, rDel*.9,altD),10.);
              

              
        
              
                }	
          }
          loopOut = m*spectrum(iTime*.25)*(n*spectrum(iTime*.2));
          //loopOut = vec3(m*spectrum(iTime));
            
          vec4 color = vec4(loopOut, 1.0);
          gl_FragColor = color;
        }
`
}

function addShaderPlane(uniforms){
  
  let geometry = new THREE.PlaneBufferGeometry( 2, 2 );
  let  material = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: vertexShader(),
      fragmentShader: fragmentShader()
  } );
  let mesh = new THREE.Mesh (geometry, material);
  scene.add(mesh);
  sceneObjects.push(mesh);
}
function onWindowResize( event ) {
  renderer.setSize( window.innerWidth, window.innerHeight );
  uniforms.iResolution.value.x = renderer.domElement.width;
  uniforms.iResolution.value.y = renderer.domElement.height;
}
function render(time) {
  time *= 0.001;  // convert to seconds
  const canvas = renderer.domElement;
  uniforms.iResolution.value.set(canvas.width, canvas.height, 1);
  uniforms.iTime.value = time;
 
  renderer.render(scene, camera);
  for(let object of sceneObjects) {
    object.rotation.x += 0.005
    object.rotation.y += 0.015
  }
  requestAnimationFrame(render);
}
