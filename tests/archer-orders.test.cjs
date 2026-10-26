// Regressões de combate à distância e comandos móveis — v6.3.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
function between(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a+start.length);
 assert.ok(a>=0&&b>a,'Missing source anchor: '+start);
 return html.slice(a,b);
}
const approachSource=between('function approachHostile(','function warriorAutoEngage(){');
function setup(passable=()=>true,route=()=>true){
 const calls=[];
 const approach=new Function('attackRange','passable','assignRoute',
  approachSource+';return approachHostile;')(
  ()=>4.6,passable,(u,x,y)=>{calls.push({x,y});return route(u,x,y);}
 );
 return {approach,calls};
}
test('full game script parses after v6.3 changes',()=>{
 const script=html.match(/<script>([\s\S]*?)<\/script>/);
 assert.ok(script);
 assert.doesNotThrow(()=>new Function(script[1]));
});
test('archer approaches hostile target but stops within safe firing distance',()=>{
 const {approach,calls}=setup();
 const archer={kind:'archer',x:80.5,y:80.5};
 assert.equal(approach(archer,85.5,80.5),true);
 assert.equal(calls.length,1);
 const d=Math.hypot(calls[0].x+.5-85.5,calls[0].y+.5-80.5);
 assert.ok(d>=2.5&&d<4.4,'archer should stop outside melee range');
});
test('archer already in firing range does not move toward melee',()=>{
 const {approach,calls}=setup();
 assert.equal(approach({kind:'archer',x:82.5,y:80.5},85.5,80.5),true);
 assert.equal(calls.length,0);
});
test('warrior still charges the hostile tile',()=>{
 const {approach,calls}=setup();
 assert.equal(approach({kind:'warrior',x:80.5,y:80.5},85.5,80.5),true);
 assert.deepEqual(calls,[{x:85,y:80}]);
});
test('archer tries alternate stand-off tiles when direct approach is blocked',()=>{
 const {approach,calls}=setup((x,y)=>y!==80);
 assert.equal(approach({kind:'archer',x:80.5,y:80.5},85.5,80.5),true);
 assert.ok(calls.length>=1);
 assert.notEqual(calls[0].y,80);
});
test('touching a map destination actually executes the army command',()=>{
 const listenerCode=between("C.addEventListener('pointerup',e=>{","C.addEventListener('pointercancel',");
 const C={addEventListener(name,fn){if(name==='pointerup')this.__tap=fn;}};
 const pointers=new Map([[1,{x:50,y:50}]]);const moves=[];
 const run=new Function('C','pointers','moveArmyTo','panel','tileAt',
  "let command='moveArmy',rallySource=null,down={x:50,y:50},dragged=false,placing=null,lastDist=0,dirty=false;"+
  "const W=160,H=160;"+listenerCode+
  ";return ()=>{C.__tap({clientX:50,clientY:50,pointerId:1});return {command,dirty};};")(
  C,
  pointers,(x,y)=>moves.push([x,y]),{classList:{remove(){}}},()=>({x:92,y:86})
 );
 const result=run();
 assert.deepEqual(moves,[[92,86]]);
 assert.equal(result.command,null);
 assert.equal(result.dirty,true);
});
test('marching dust has zoom LOD and archer formation markers are included',()=>{
 assert.match(html,/if\(moving&&z>\.8&&biome\(/);
 assert.match(html,/if\(!isMilitary\(u\.kind\)\|\|!Array\.isArray\(u\.path\)/);
});
