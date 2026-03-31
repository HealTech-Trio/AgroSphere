import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Platform,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';

const FARM_3D_HTML = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no"/>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{overflow:hidden;background:#0a1030;touch-action:none;font-family:-apple-system,sans-serif;width:100vw;height:100vh}
canvas{display:block;width:100vw;height:100vh}
#info{position:absolute;top:60px;left:3vw;z-index:10;background:rgba(15,32,39,0.85);color:#fff;padding:2vw 3vw;border-radius:10px;font-size:clamp(8px,2.4vw,12px);border-left:3px solid #2EC4B6;backdrop-filter:blur(8px);max-width:44vw;line-height:1.4}
#info h3{margin:0 0 2px;font-size:clamp(9px,2.6vw,13px);color:#2EC4B6}
#legend{position:absolute;bottom:3vh;left:3vw;z-index:10;background:rgba(15,32,39,0.85);color:#ccc;padding:2vw 3vw;border-radius:10px;font-size:clamp(7px,2.2vw,11px);backdrop-filter:blur(8px);border-top:2px solid #2EC4B6;line-height:1.4;max-width:50vw}
#detail{position:absolute;bottom:3vh;right:3vw;z-index:10;background:rgba(15,32,39,0.9);color:#ffd966;padding:2vw 3vw;border-radius:10px;font-size:clamp(7px,2.2vw,11px);font-weight:600;border-right:3px solid #ffaa33;backdrop-filter:blur(8px);max-width:40vw;text-align:right;line-height:1.4;transition:opacity 0.3s}
#controls{position:absolute;top:60px;right:3vw;z-index:10;display:flex;flex-direction:column;gap:1.5vw}
.ctrl-btn{width:clamp(30px,8vw,40px);height:clamp(30px,8vw,40px);border-radius:50%;background:rgba(15,32,39,0.8);border:1px solid rgba(46,196,182,0.3);color:#2EC4B6;font-size:clamp(13px,4vw,18px);display:flex;align-items:center;justify-content:center;cursor:pointer;backdrop-filter:blur(8px);-webkit-tap-highlight-color:transparent}
.ctrl-btn:active{background:rgba(46,196,182,0.3)}
@media(max-height:500px){#info{display:none}#legend{bottom:2vh;padding:1.5vw 2vw}#detail{bottom:2vh;padding:1.5vw 2vw}}
@media(max-width:360px){#legend{max-width:44vw;font-size:7px}#detail{max-width:38vw;font-size:7px}#info{max-width:38vw;font-size:8px;padding:1.5vw 2vw}#controls{right:2vw}.ctrl-btn{width:28px;height:28px;font-size:13px}}
</style>
</head>
<body>
<div id="info"><h3>AgriSphere 3D Farm</h3>IoT Sensors &bull; Soil Moisture<br>Robotic Weeder Active</div>
<div id="legend">
<strong style="color:#2EC4B6">Soil Moisture</strong><br>
&#x1F7E2; Optimal &nbsp; &#x1F7E1; Moderate &nbsp; &#x1F534; Dry<br>
&#x1F916; Weeder: <span id="ws">Patrolling</span>
</div>
<div id="detail">Tap a crop or sensor<br><span id="cd">&mdash;</span></div>
<div id="controls">
<div class="ctrl-btn" ontouchstart="zoomIn()" onclick="zoomIn()">+</div>
<div class="ctrl-btn" ontouchstart="zoomOut()" onclick="zoomOut()">&#x2212;</div>
<div class="ctrl-btn" ontouchstart="resetCam()" onclick="resetCam()">&#x21BA;</div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"><\/script>
<script>
// ---- SCENE SETUP ----
var scene=new THREE.Scene();
scene.background=new THREE.Color(0x0a1030);
scene.fog=new THREE.FogExp2(0x0a1030,0.006);

var W=window.innerWidth,H=window.innerHeight;
var isSmall=W<400;
var camera=new THREE.PerspectiveCamera(isSmall?60:50,W/H,0.1,500);
camera.position.set(10,8,12);
camera.lookAt(0,0,0);

var renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setSize(W,H);
renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// ---- TOUCH ORBIT CONTROLS (custom, no import needed) ----
var isDragging=false,prevTouch=null,camTheta=0.9,camPhi=0.6,camDist=16,camTarget=new THREE.Vector3(0,0.5,0);
var pinchDist=0,isPinching=false;

function updateCam(){
  camera.position.x=camTarget.x+camDist*Math.sin(camTheta)*Math.cos(camPhi);
  camera.position.y=camTarget.y+camDist*Math.sin(camPhi);
  camera.position.z=camTarget.z+camDist*Math.cos(camTheta)*Math.cos(camPhi);
  camera.lookAt(camTarget);
}
updateCam();

function zoomIn(){camDist=Math.max(5,camDist-2);updateCam()}
function zoomOut(){camDist=Math.min(30,camDist+2);updateCam()}
function resetCam(){camTheta=0.9;camPhi=0.6;camDist=16;camTarget.set(0,0.5,0);updateCam()}

var el=renderer.domElement;
el.addEventListener('touchstart',function(e){
  if(e.touches.length===2){isPinching=true;var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;pinchDist=Math.sqrt(dx*dx+dy*dy);return}
  isDragging=true;prevTouch={x:e.touches[0].clientX,y:e.touches[0].clientY};
},{passive:true});
el.addEventListener('touchmove',function(e){
  if(isPinching&&e.touches.length===2){var dx=e.touches[0].clientX-e.touches[1].clientX,dy=e.touches[0].clientY-e.touches[1].clientY;var d=Math.sqrt(dx*dx+dy*dy);camDist=Math.max(5,Math.min(30,camDist-(d-pinchDist)*0.05));pinchDist=d;updateCam();return}
  if(!isDragging||!prevTouch)return;
  var t=e.touches[0];var dx=t.clientX-prevTouch.x,dy=t.clientY-prevTouch.y;
  camTheta-=dx*0.008;camPhi=Math.max(0.1,Math.min(1.4,camPhi+dy*0.008));
  prevTouch={x:t.clientX,y:t.clientY};updateCam();
},{passive:true});
el.addEventListener('touchend',function(){isDragging=false;prevTouch=null;isPinching=false},{passive:true});

// Mouse support too
el.addEventListener('mousedown',function(e){isDragging=true;prevTouch={x:e.clientX,y:e.clientY}});
el.addEventListener('mousemove',function(e){if(!isDragging)return;var dx=e.clientX-prevTouch.x,dy=e.clientY-prevTouch.y;camTheta-=dx*0.008;camPhi=Math.max(0.1,Math.min(1.4,camPhi+dy*0.008));prevTouch={x:e.clientX,y:e.clientY};updateCam()});
el.addEventListener('mouseup',function(){isDragging=false});
el.addEventListener('wheel',function(e){camDist=Math.max(5,Math.min(30,camDist+e.deltaY*0.01));updateCam()},{passive:true});

// ---- LIGHTING ----
scene.add(new THREE.AmbientLight(0x404060,0.8));
var sun=new THREE.DirectionalLight(0xfff5e0,1.2);
sun.position.set(8,12,5);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.near=0.5;sun.shadow.camera.far=30;
sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;
scene.add(sun);
scene.add(new THREE.PointLight(0x2EC4B6,0.3,20));
var rim=new THREE.PointLight(0xffaa66,0.4);rim.position.set(-3,4,-5);scene.add(rim);

// ---- STARFIELD ----
var starGeo=new THREE.BufferGeometry();var starPos=new Float32Array(600);
for(var i=0;i<600;i+=3){starPos[i]=(Math.random()-0.5)*80;starPos[i+1]=Math.random()*30+5;starPos[i+2]=(Math.random()-0.5)*80}
starGeo.setAttribute('position',new THREE.BufferAttribute(starPos,3));
scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0x88aaff,size:0.08,transparent:true,opacity:0.5})));

// ---- CLOUDS ----
var cloudMat=new THREE.MeshStandardMaterial({color:0xddddff,emissive:0x1B3A4B,transparent:true,opacity:0.5});
function mkCloud(x,y,z){var g=new THREE.Group();var s=new THREE.SphereGeometry(0.5,7,7);
var a=new THREE.Mesh(s,cloudMat);a.scale.set(1.3,0.7,1);g.add(a);
var b=new THREE.Mesh(s,cloudMat);b.position.set(0.7,-0.15,0.3);b.scale.set(0.9,0.6,0.9);g.add(b);
var c=new THREE.Mesh(s,cloudMat);c.position.set(-0.5,-0.1,-0.3);c.scale.set(0.8,0.6,0.8);g.add(c);
g.position.set(x,y,z);scene.add(g);return g}
var clouds=[mkCloud(-5,7.5,-4),mkCloud(4,7,-2),mkCloud(7,7.5,-6),mkCloud(-2,7,5)];

// ---- GROUND ----
var ground=new THREE.Mesh(new THREE.PlaneGeometry(24,24),new THREE.MeshStandardMaterial({color:0x6B4226,roughness:0.95}));
ground.rotation.x=-Math.PI/2;ground.position.y=-0.2;ground.receiveShadow=true;scene.add(ground);

// Grass ring around farm
var grassRing=new THREE.Mesh(new THREE.RingGeometry(10,12,32),new THREE.MeshStandardMaterial({color:0x3a6b35,roughness:0.9,side:THREE.DoubleSide}));
grassRing.rotation.x=-Math.PI/2;grassRing.position.y=-0.18;scene.add(grassRing);

// Soil rows
var rowMat=new THREE.MeshStandardMaterial({color:0x8B5E3C,roughness:0.85});
var rows=5,cols=6,sX=-4.5,sZ=-3.5,dX=1.8,dZ=1.8;
for(var r=0;r<rows;r++){var row=new THREE.Mesh(new THREE.BoxGeometry(cols*dX+0.5,0.08,0.9),rowMat);row.position.set(sX+(cols-1)*dX/2,-0.15,sZ+r*dZ);row.receiveShadow=true;scene.add(row)}

// ---- CROPS ----
var crops=[];
var moisture=[];for(var i=0;i<rows*cols;i++){var rn=Math.random();moisture.push(rn<0.25?0:rn<0.55?1:2)}
function mColor(l){return l===0?0xd94f30:l===1?0xe5c65c:0x4CAF50}
function mHealth(l){return l===0?'Dry - Stressed (40%)':l===1?'Moderate - Fair (70%)':'Optimal - Thriving (95%)'}
function mEmoji(l){return l===0?'\\u{1F534}':l===1?'\\u{1F7E1}':'\\u{1F7E2}'}

function mkPlant(x,z,ml){
  var g=new THREE.Group();
  // Soil mound
  var mound=new THREE.Mesh(new THREE.SphereGeometry(0.3,8,4,0,Math.PI*2,0,Math.PI/2),new THREE.MeshStandardMaterial({color:0x6B4226,roughness:0.9}));
  mound.position.y=0;g.add(mound);
  // Stem
  var stem=new THREE.Mesh(new THREE.CylinderGeometry(0.06,0.09,0.5+ml*0.15,6),new THREE.MeshStandardMaterial({color:0x558B2F}));
  stem.position.y=0.3+ml*0.05;stem.castShadow=true;g.add(stem);
  // Leaves
  var lc=mColor(ml);
  var head=new THREE.Mesh(new THREE.SphereGeometry(0.22+ml*0.05,8,8),new THREE.MeshStandardMaterial({color:lc,emissive:ml===0?0x441100:0x1B5E20,emissiveIntensity:ml===0?0.2:0.08}));
  head.position.y=0.6+ml*0.1;head.castShadow=true;g.add(head);
  // Side leaves
  var leafMat=new THREE.MeshStandardMaterial({color:0x66BB6A});
  var l1=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.1),leafMat);l1.position.set(0.2,0.4,0);l1.rotation.z=0.5;g.add(l1);
  var l2=new THREE.Mesh(new THREE.BoxGeometry(0.3,0.04,0.1),leafMat);l2.position.set(-0.2,0.4,0);l2.rotation.z=-0.5;g.add(l2);
  // Glow ring at base for status
  var ring=new THREE.Mesh(new THREE.RingGeometry(0.25,0.35,16),new THREE.MeshBasicMaterial({color:lc,transparent:true,opacity:0.3,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.y=0.01;g.add(ring);
  g.position.set(x,0,z);return g;
}

for(var r=0;r<rows;r++){for(var c=0;c<cols;c++){
  var idx=r*cols+c,ml=moisture[idx],x=sX+c*dX,z=sZ+r*dZ;
  var p=mkPlant(x,z,ml);scene.add(p);
  // Hitbox
  var hb=new THREE.Mesh(new THREE.SphereGeometry(0.5,4,4),new THREE.MeshBasicMaterial({visible:false}));
  hb.position.set(x,0.4,z);scene.add(hb);
  crops.push({mesh:p,hb:hb,ml:ml,r:r,c:c,hp:mHealth(ml)});
}}

// ---- IoT SENSORS ----
var sensors=[];
var sPos=[{x:sX-1,z:sZ-0.8,n:'Sensor A'},{x:sX+(cols-1)*dX+1,z:sZ-0.8,n:'Sensor B'},{x:sX-1,z:sZ+(rows-1)*dZ+0.8,n:'Sensor C'},{x:sX+(cols-1)*dX+1,z:sZ+(rows-1)*dZ+0.8,n:'Sensor D'},{x:sX+(cols-1)*dX/2,z:sZ+(rows-1)*dZ/2,n:'Central Hub'}];
var sData=[{m:32,t:24,h:58},{m:45,t:23,h:61},{m:28,t:25,h:54},{m:51,t:24,h:63},{m:42,t:24,h:59}];

sPos.forEach(function(sp,i){
  // Base
  var base=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.28,0.15,8),new THREE.MeshStandardMaterial({color:0xBDBDBD,metalness:0.8,roughness:0.2}));
  base.position.set(sp.x,0.08,sp.z);base.castShadow=true;scene.add(base);
  // Pole
  var pole=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.06,0.4,6),new THREE.MeshStandardMaterial({color:0x78909C}));
  pole.position.set(sp.x,0.3,sp.z);scene.add(pole);
  // LED
  var led=new THREE.Mesh(new THREE.SphereGeometry(0.1,8,8),new THREE.MeshStandardMaterial({color:0x2EC4B6,emissive:0x2EC4B6,emissiveIntensity:0.6}));
  led.position.set(sp.x,0.52,sp.z);scene.add(led);
  // Glow
  var glow=new THREE.PointLight(i===4?0xFFAA33:0x2EC4B6,0.3,3);glow.position.set(sp.x,0.6,sp.z);scene.add(glow);
  sensors.push({mesh:led,glow:glow,d:sData[i],n:sp.n,p:sp});
});

// ---- FENCE ----
var fenceMat=new THREE.MeshStandardMaterial({color:0x8D6E63,roughness:0.7});
function mkFence(x1,z1,x2,z2){
  var len=Math.sqrt((x2-x1)*(x2-x1)+(z2-z1)*(z2-z1));
  var f=new THREE.Mesh(new THREE.BoxGeometry(len,0.4,0.06),fenceMat);
  f.position.set((x1+x2)/2,0.2,(z1+z2)/2);
  f.rotation.y=Math.atan2(x2-x1,z2-z1)+Math.PI/2;
  f.castShadow=true;scene.add(f);
  // Posts
  var posts=5;for(var i=0;i<=posts;i++){
    var t=i/posts;var post=new THREE.Mesh(new THREE.CylinderGeometry(0.04,0.04,0.6,4),fenceMat);
    post.position.set(x1+(x2-x1)*t,0.3,z1+(z2-z1)*t);post.castShadow=true;scene.add(post);
  }
}
var fE=sX+(cols-1)*dX+2.5,fW=sX-2.5,fN=sZ-2,fS=sZ+(rows-1)*dZ+2;
mkFence(fW,fN,fE,fN);mkFence(fW,fS,fE,fS);mkFence(fW,fN,fW,fS);mkFence(fE,fN,fE,fS);

// ---- WATER TOWER ----
var towerBase=new THREE.Mesh(new THREE.CylinderGeometry(0.15,0.15,2.5,6),new THREE.MeshStandardMaterial({color:0x78909C,metalness:0.6}));
towerBase.position.set(sX-2,1.25,sZ-1.5);towerBase.castShadow=true;scene.add(towerBase);
var tank=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.5,0.8,8),new THREE.MeshStandardMaterial({color:0x42A5F5,metalness:0.4,roughness:0.3}));
tank.position.set(sX-2,2.8,sZ-1.5);tank.castShadow=true;scene.add(tank);

// ---- BARN ----
var barn=new THREE.Group();
var bWall=new THREE.Mesh(new THREE.BoxGeometry(2,1.5,1.5),new THREE.MeshStandardMaterial({color:0xC62828}));
bWall.position.y=0.75;bWall.castShadow=true;barn.add(bWall);
var bRoof=new THREE.Mesh(new THREE.ConeGeometry(1.6,0.8,4),new THREE.MeshStandardMaterial({color:0x5D4037}));
bRoof.position.y=1.9;bRoof.rotation.y=Math.PI/4;bRoof.castShadow=true;barn.add(bRoof);
var bDoor=new THREE.Mesh(new THREE.PlaneGeometry(0.5,0.8),new THREE.MeshStandardMaterial({color:0x4E342E}));
bDoor.position.set(0,0.4,0.76);barn.add(bDoor);
barn.position.set(sX+(cols-1)*dX+2,0,sZ+(rows-1)*dZ);scene.add(barn);

// ---- ROBOTIC WEEDER ----
var weeder=new THREE.Group();
var wBody=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.18,0.7),new THREE.MeshStandardMaterial({color:0x2EC4B6,metalness:0.7,roughness:0.2}));
wBody.castShadow=true;weeder.add(wBody);
var wMat=new THREE.MeshStandardMaterial({color:0x212121,metalness:0.4});
[[-0.22,-0.05,0.3],[0.22,-0.05,0.3],[-0.22,-0.05,-0.3],[0.22,-0.05,-0.3]].forEach(function(p){
  var w=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,0.08,10),wMat);w.rotation.z=Math.PI/2;w.position.set(p[0],p[1],p[2]);w.castShadow=true;weeder.add(w)});
var wLed=new THREE.Mesh(new THREE.SphereGeometry(0.08,6,6),new THREE.MeshStandardMaterial({color:0xFF5722,emissive:0xFF3300,emissiveIntensity:0.6}));
wLed.position.y=0.14;weeder.add(wLed);
var wGlow=new THREE.PointLight(0xFF5722,0.4,2);wGlow.position.y=0.2;weeder.add(wGlow);
scene.add(weeder);

// Waypoints
var wp=[];var yP=0.12;
for(var r=0;r<rows;r++){var zz=sZ+r*dZ;
  if(r%2===0){wp.push({x:sX-1.2,z:zz,y:yP});wp.push({x:sX+(cols-1)*dX+1.2,z:zz,y:yP})}
  else{wp.push({x:sX+(cols-1)*dX+1.2,z:zz,y:yP});wp.push({x:sX-1.2,z:zz,y:yP})}
}
wp.push({x:sX-1.2,z:sZ-1,y:yP});
var wpi=0,wSpd=0.02;
weeder.position.set(wp[0].x,wp[0].y,wp[0].z);

// ---- RAYCASTER (tap interaction) ----
var raycaster=new THREE.Raycaster(),mouse=new THREE.Vector2();
function onTap(cx,cy){
  mouse.x=(cx/W)*2-1;mouse.y=-(cy/H)*2+1;
  raycaster.setFromCamera(mouse,camera);
  var hbs=crops.map(function(c){return c.hb}).concat(sensors.map(function(s){return s.mesh}));
  var hits=raycaster.intersectObjects(hbs);
  if(hits.length>0){
    var h=hits[0].object;
    var cr=crops.find(function(c){return c.hb===h});
    if(cr){document.getElementById('cd').innerHTML='\\u{1F33E} Crop ['+((cr.r+1))+','+(cr.c+1)+']<br>'+mEmoji(cr.ml)+' '+mHealth(cr.ml);return}
    var sr=sensors.find(function(s){return s.mesh===h});
    if(sr){document.getElementById('cd').innerHTML='\\u{1F4E1} '+sr.n+'<br>\\u{1F4A7} '+sr.d.m+'% | \\u{1F321} '+sr.d.t+'\\u00B0C<br>\\u{1F4A8} Humidity: '+sr.d.h+'%';return}
  }
}
el.addEventListener('click',function(e){onTap(e.clientX,e.clientY)});
el.addEventListener('touchend',function(e){if(!isDragging&&e.changedTouches.length===1){var t=e.changedTouches[0];onTap(t.clientX,t.clientY)}},{passive:true});

// ---- IoT SIMULATION ----
setInterval(function(){
  sensors.forEach(function(s){
    s.d={m:Math.floor(Math.random()*55)+20,t:+(20+Math.random()*8).toFixed(1),h:Math.floor(45+Math.random()*30)};
    s.mesh.material.emissiveIntensity=1;setTimeout(function(){s.mesh.material.emissiveIntensity=0.5},400);
  });
  var n=Math.floor(Math.random()*4)+2;
  for(var i=0;i<n;i++){
    var cr=crops[Math.floor(Math.random()*crops.length)];
    var nl=Math.random()<0.45?2:Math.random()<0.6?1:0;
    if(nl!==cr.ml){
      cr.ml=nl;cr.hp=mHealth(nl);
      var head=cr.mesh.children[2];if(head){head.material.color.setHex(mColor(nl));head.material.emissiveIntensity=nl===0?0.25:0.08}
      var ring=cr.mesh.children[5];if(ring)ring.material.color.setHex(mColor(nl));
    }
  }
  var msgs=['Patrolling rows','Weeding sector B','Scanning crops','Returning to base','Active - IoT sync'];
  document.getElementById('ws').textContent=msgs[Math.floor(Math.random()*msgs.length)];
},5000);

// ---- ANIMATE ----
var clock=new THREE.Clock();
function animate(){
  requestAnimationFrame(animate);
  var dt=clock.getDelta(),t=clock.getElapsedTime();
  
  // Weeder movement
  var tgt=wp[wpi],pos=weeder.position;
  var dx=tgt.x-pos.x,dz=tgt.z-pos.z,dist=Math.sqrt(dx*dx+dz*dz);
  if(dist<0.15){wpi=(wpi+1)%wp.length}else{
    var s=wSpd*Math.min(dt*60,2);pos.x+=dx/dist*s;pos.z+=dz/dist*s;
    weeder.rotation.y=Math.atan2(dx/dist,dz/dist);
  }
  pos.y=yP+Math.sin(t*4)*0.015;
  wLed.material.emissiveIntensity=0.4+Math.sin(t*6)*0.3;
  
  // Crop sway
  crops.forEach(function(cr,i){var head=cr.mesh.children[2];if(head)head.scale.y=1+Math.sin(t*2+i*0.7)*0.03});
  
  // Cloud drift
  clouds.forEach(function(c,i){c.position.x+=0.003*(i%2===0?1:-1);if(Math.abs(c.position.x)>12)c.position.x*=-1});
  
  // Sensor pulse
  sensors.forEach(function(s,i){s.glow.intensity=0.2+Math.sin(t*3+i)*0.15});
  
  renderer.render(scene,camera);
}
animate();

window.addEventListener('resize',function(){W=window.innerWidth;H=window.innerHeight;isSmall=W<400;camera.fov=isSmall?60:50;camera.aspect=W/H;camera.updateProjectionMatrix();renderer.setSize(W,H)});
<\/script>
</body>
</html>
`;

export default function FarmVisualizationScreen({ navigation }) {
  const webViewRef = useRef(null);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a1030" />
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.white} />
      </TouchableOpacity>

      <WebView
        ref={webViewRef}
        source={{ html: FARM_3D_HTML }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        originWhitelist={['*']}
        mixedContentMode="always"
        onError={(syntheticEvent) => {
          console.log('WebView error:', syntheticEvent.nativeEvent);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1030',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : (StatusBar.currentHeight || 0) + 12,
    left: 16,
    zIndex: 20,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(15,32,39,0.85)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46,196,182,0.3)',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a1030',
  },
});
