'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'main game script');
const a=script.indexOf('function nightPatrolSources(');
const b=script.indexOf('function drawAtmosphere(',a);
assert.ok(a>=0&&b>a,'night patrol source helper');
const source=script.slice(a,b);
const factory=new Function('game','w','h','scale','visibleAt','point','at','unitBehindStructure',source+';return nightPatrolSources;');
const sample=[
 {kind:'warrior',hp:100,x:10,y:10,path:[]},
 {kind:'archer',hp:100,x:12,y:10,path:[{x:13,y:10}]},
 {kind:'cavalry',hp:100,x:14,y:10,path:[]},
 {kind:'worker',hp:100,x:16,y:10,path:[]},
 {kind:'cannon',hp:100,x:18,y:10,path:[]},
 {kind:'warrior',hp:0,x:20,y:10,path:[]}
];
function sources(units=sample,options={}){
 const f=factory({units},options.w??390,options.h??750,options.scale??1,
  options.visibleAt??(()=>true),options.point??((x,y)=>[x*10,y*10]),
  options.at??(()=>null),options.unitBehindStructure??(()=>false));
 return f(options.limit);
}
test('v6.95 JavaScript compiles',()=>assert.doesNotThrow(()=>new Function(script)));
test('only alive military walkers and cavalry carry night lights',()=>{
 const result=sources();
 assert.deepEqual(result.map(s=>s.u.kind),['warrior','archer','cavalry']);
 assert.ok(result.every(s=>Number.isFinite(s.x)&&Number.isFinite(s.y)));
});
test('fog and occluded building interiors do not leak patrol lights',()=>{
 assert.equal(sources(sample,{visibleAt:()=>false}).length,0);
 assert.equal(sources(sample,{at:()=>({t:'Quartel'}),unitBehindStructure:()=>true}).length,0);
});
test('distant zoom and offscreen units are culled',()=>{
 assert.equal(sources(sample,{scale:.5}).length,0);
 assert.equal(sources(sample,{point:()=>[-200,-200]}).length,0);
});
test('mobile and desktop light budgets are capped',()=>{
 const many=Array.from({length:25},(_,i)=>({kind:'warrior',hp:100,x:10+i*.01,y:10,path:[]}));
 assert.equal(sources(many).length,6);
 assert.equal(sources(many,{w:1100}).length,10);
 assert.equal(sources(many,{limit:2}).length,2);
});
test('lights use both day-night rendering branches and remain transient',()=>{
 assert.match(script,/if\(night<\.01\)\{[^\n]*drawTroopNightLanterns\(phase,Date\.now\(\)\)/);
 assert.match(script,/for\(const source of nightPatrolSources\(\)\)\{/);
 assert.match(script,/drawTroopNightLanterns\(phase,Date\.now\(\)\);\n\}/);
 assert.match(script,/game\.era>=6/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
