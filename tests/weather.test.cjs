'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'Main browser script must exist');
const between=(start,end)=>{
 const a=script.indexOf(start),b=script.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing source anchor '+start);
 return script.slice(a,b);
};
const helpers=between('function smoothstep(','function drawAmbientParticles(')+
 between('function weatherForDay(','function drawWeather(');
const weatherForDay=new Function(helpers+';return weatherForDay;')();
const renderer=between('function drawWeather(','function drawAtmosphere(');
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function paint({day=3,phase=.5,width=390,visible=true,occupied=false,terrain=0,zoom=1,preview=false}={}){
 const calls={strokes:0,rings:0,shade:0};
 const ctx=new Proxy({},{
  get:(obj,key)=>key==='stroke'?()=>{calls.strokes++}:
   key==='ellipse'?()=>{calls.rings++}:
   key==='fillRect'?()=>{calls.shade++}:
   obj[key]||(()=>{}),
  set:(obj,key,value)=>{obj[key]=value;return true}
 });
 const render=new Function('ctx','game','dayClock','w','h','rnd','scale','tileAt','W','H','biome','visibleAt','at','weatherForDay','weatherPreview',renderer+';return drawWeather;')(
  ctx,{day},phase*25,width,844,rnd,zoom,()=>({x:15,y:15}),160,160,()=>terrain,()=>visible,()=>occupied?{t:'Ponte'}:null,weatherForDay,preview);
 render(15000);
 return calls;
}
test('script syntax and weather renderer integration',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/drawAmbientParticles\(frameTime\);drawWeather\(frameTime\)/);
 assert.match(html,/cronicas-v04/);
 assert.match(script,/id="previewWeather"/);
});
test('rain is deterministic and restricted to scheduled days',()=>{
 assert.equal(weatherForDay(1,.5),0);
 assert.equal(weatherForDay(2,.5),0);
 assert.ok(weatherForDay(3,.5)>.6);
 assert.ok(weatherForDay(4,.5)>.9);
 assert.ok(weatherForDay(7,.5)>.4);
 assert.equal(weatherForDay(8,.5),0);
 assert.equal(weatherForDay(3,0),0);
 assert.equal(weatherForDay(3,.99),0);
 assert.equal(weatherForDay(3,.5),weatherForDay(3,.5));
});
test('mobile rain draws visible streaks and desktop can draw more',()=>{
 const mobile=paint(),desktop=paint({width:1366});
 assert.ok(mobile.strokes>=40);
 assert.ok(desktop.strokes>mobile.strokes);
 assert.ok(mobile.shade>0);
 assert.equal(paint({day:1}).strokes,0);
 assert.ok(paint({day:1,preview:true}).strokes>30,'Help preview should display rain immediately');
});
test('lake rings respect fog, occupancy, terrain and zoom LOD',()=>{
 assert.ok(paint().rings>0);
 assert.equal(paint({visible:false}).rings,0);
 assert.equal(paint({occupied:true}).rings,0);
 assert.equal(paint({terrain:2}).rings,0);
 assert.equal(paint({zoom:.5}).rings,0);
});
