/*
import * as THREE from 'https://cdn.skypack.dev/three@128.js';
import { OrbitControls } from 'https://cdn.skypack.dev/three@128/examples/jsm/controls/OrbitControls.js';
const controls = new OrbitControls();
const scene = new THREE.Scene();
*/

import { WEBGL } from "./webgl.js";

let camera,renderer;
let mouse = new THREE.Vector2;
let resolution = new THREE.Vector2;
let feedbackScene,feedbackObject,textureA,textureB;

function vertexShader() {
    return `
    void main() {
      gl_Position = vec4( position, 1.0 );
  }
    `
  }

function feedbackFrag(){
    return `
    #define S(d) smoothstep(0., -20./iResolution.y, d);
    #define PI 3.141592653;
    uniform vec2 iResolution;
    uniform sampler2D ping;
	uniform float iTime;
    uniform vec2 iMouse;

    vec3 pal( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d ) {
        return a + b*cos( 6.28318*(c*t+d) );
        }
    vec3 spectrum(float n) {
        return pal( n, vec3(0.5,0.5,0.5),vec3(0.5,0.5,0.5),vec3(1.0,1.0,1.0),vec3(0.0,0.33,0.67) );
        }

	void main() {
	  vec2 fragCoord = gl_FragCoord.xy;
      vec2 texuv = fragCoord/iResolution.xy;
      texuv -= .5;
      texuv *= 1.01;
      texuv += .5;
      vec2 uv = (fragCoord-.5*iResolution.xy) /iResolution.y;
      vec2 gv = fract(uv*10.)-.5;
      vec2 av = fract(uv*11.)-.5;
      vec2 pv = vec2(atan(uv.x,uv.y),length(uv));
      vec2 pm = vec2(atan(iMouse.x,iMouse.y),length(iMouse));
      vec3 loopOut = vec3(0);
      float m = 0.;
      float n = 0.;
      float delayAmt = 2.;
      float otherTime = (iTime+2.);
      float t = iTime*5.;
      float tDel = (iTime-(t*delayAmt))*.1;
      for (float y=-1.; y<=1.; y++){for(float x=-1.; x<=1.; x++){
          vec2 offset = vec2(x, y);
          float d = length(gv-offset);
          float altD = length(av-offset);
          float r = mix(.32, .5, 
            sin(((-t*.5)+
              ((sin((iMouse.x*.001))*2.+3.)))+
              length(sin(uv*2.))*40.));
          m += S(d-r);
          float rDel = mix(.2, .5, sin((tDel*.5+.5)+length(sin(uv*10.))*20.));
          n += S(altD-rDel);
          
            }}
        loopOut = m*spectrum(
          (
          (sin((pv.x-(uv.x,-uv.y))*sin(iTime*.8)))+((pm.x+pm.y)*.01)*.02)
            *sin(iTime*.25)+pv.y
            *.2)*(n*spectrum(sin(iTime)*.2+(pm.x/iResolution.y)*.2*pv.y))*4.;
        loopOut = loopOut*(vec3(length(uv*.4))+.4);
        gl_FragColor = vec4(loopOut,1.0)+texture2D(ping,texuv)*.9;

		 }`
}

function onWindowResize() {
  let threeDiv = document.getElementById('threeDiv');
  renderer.setSize( window.innerWidth, Math.max(threeDiv.scrollHeight,window.innerHeight) );
  resolution.set(renderer.domElement.width,renderer.domElement.height);
}

function sceneSetup(){
  camera = new THREE.Camera();
  renderer = new THREE.WebGLRenderer({ canvas: threeCanvas })
  renderer.setSize( window.innerWidth, window.innerHeight );
  renderer.setPixelRatio( window.devicePixelRatio );
  document.body.appendChild(renderer.domElement);
  onWindowResize();
  document.onmousemove = function(e){
    mouse.x = e.pageX
    mouse.y = e.pageY
  }
  textureA = new THREE.WebGLRenderTarget(resolution.x, resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
  textureB = new THREE.WebGLRenderTarget( resolution.x, resolution.y, { minFilter: THREE.LinearFilter, magFilter: THREE.NearestFilter});
}

function feedbackSetup(){
  feedbackScene = new THREE.Scene();
  let feedbackMaterial = new THREE.ShaderMaterial( {
      uniforms: {
        ping: {value: textureA.texture },
        iResolution : { value: resolution},
        iTime: { value: 0},
        iMouse: {value: mouse}
      },
      vertexShader:vertexShader(),
      fragmentShader: feedbackFrag()
  } );
  let feedbackPlane = new THREE.PlaneBufferGeometry( 2,2 );
  feedbackObject = new THREE.Mesh( feedbackPlane, feedbackMaterial );
  feedbackScene.add(feedbackObject);
}

function render(time) {
  time *= 0.001;  // convert to seconds

  feedbackObject.material.uniforms.iTime.value = time;
  onWindowResize();
  renderer.setRenderTarget(textureB)
  textureB.setSize(resolution.x,resolution.y);
  renderer.render(feedbackScene,camera);
  renderer.setRenderTarget(null);
  renderer.clear();
  let t = textureA; // Temporary holder 
  textureA = textureB; // Swap Buffer A for previous value
  textureB = t; // Move previous value to temporary holder
  feedbackObject.material.uniforms.ping.value = textureA.texture;
  renderer.render(feedbackScene,camera);
  requestAnimationFrame(render);
  
}

function init(){
  sceneSetup();
  feedbackSetup();
  render();
}

if ( WEBGL.isWebGLAvailable() ) {

	// Initiate function or other initializations here
	window.addEventListener('load',init);

} else {

	const warning = WEBGL.getWebGLErrorMessage();
	document.getElementById( 'threeDiv' ).appendChild( warning );

}
