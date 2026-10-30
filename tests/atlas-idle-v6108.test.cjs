'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const slice=(a,b)=>{const x=script.indexOf(a),y=script.indexOf(b,x+1);assert.ok(x>=0&&y>x);return script.slice(x,y)};
const idle=new Function(slice('function atlasIdleMotion(','function drawPaintedCavalry(')+'return atlasIdleMotion;')();
const cavalry=slice('function drawPaintedCavalry(','function drawCavalrySprite(');
const troop=slice('function drawPaintedTroop(','// v6.76:');
function render(kind,opts={}){
 const {moving=false,striking=false,enemy=false,now=1500,zoom=1.2}=opts,calls=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas '+String(k));
  calls.push([k,...args]);};},set(o,k,v){o[k]=v;return true}});
 const u={x:80.5,y:80.5,face:1,path:moving?[{x:81.5,y:80.5}]:[],attackAt:striking?now-100:0,hitAt:0};
 let ok;
 if(kind==='cavalry'){
  const f=new Function('ctx','paintedCavalry','game','Date','atlasIdleMotion',cavalry+'return drawPaintedCavalry;')(ctx,{complete:true,naturalWidth:448,naturalHeight:448},{era:4},{now:()=>now},idle);
  ok=f(u,180,210,zoom);
 }else{
  const f=new Function('ctx','paintedTroops','game','atlasIdleMotion',troop+'return drawPaintedTroop;')(ctx,{complete:true,naturalWidth:256,naturalHeight:896},{era:4},idle);
  ok=f(u,180,210,zoom,false,moving,striking,now,1,enemy);
 }
 return {ok,calls,count:k=>calls.filter(c=>c[0]===k).length};
}
test('sintaxe, salvamento e agendamento da simulação continuam válidos',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/finally\{requestAnimationFrame\(loop\)\}/);
});
test('movimento de repouso determinístico, limitado e ausente em marcha/ataque',()=>{
 assert.equal(idle(1000,true,false),null);
 assert.equal(idle(1000,false,true),null);
 assert.equal(idle(NaN,false,false),null);
 assert.deepEqual(idle(1500,false,false),idle(1500,false,false));
 for(const mount of [false,true])for(let t=0;t<10000;t+=127){
  const p=idle(t,false,false,mount);
  assert.ok(Math.abs(p.sway)<=(mount?.012:.032)+1e-9);
  assert.ok(p.stretch>=.979&&p.stretch<=1.021);
 }
});
test('infantaria animada somente no repouso e sem alterar os quadros SVG',()=>{
 const rest=render('troop'),walk=render('troop',{moving:true}),attack=render('troop',{striking:true});
 assert.equal(rest.ok,true);assert.equal(rest.count('transform'),1);
 assert.equal(walk.count('transform'),0);assert.equal(attack.count('transform'),0);
 assert.equal(rest.count('drawImage'),1);
 assert.notDeepEqual(render('troop',{now:1500}).calls,render('troop',{now:2800}).calls);
});
test('distintivo rival acompanha corpo sem mover anel no chão',()=>{
 const r=render('troop',{enemy:true});
 assert.equal(r.count('transform'),1);
 assert.equal(r.count('ellipse'),1);
 assert.ok(r.calls.findIndex(c=>c[0]==='ellipse')<r.calls.findIndex(c=>c[0]==='transform'));
 assert.equal(r.count('save'),r.count('restore'));
});
test('cavalaria: respiração, cascos ancorados, galope e LOD',()=>{
 const rest=render('cavalry'),walk=render('cavalry',{moving:true}),attack=render('cavalry',{striking:true});
 assert.equal(rest.count('transform'),1);assert.equal(walk.count('transform'),0);
 assert.equal(attack.count('transform'),0);assert.equal(rest.count('save'),rest.count('restore'));
 assert.equal(rest.count('drawImage'),1);assert.equal(render('cavalry',{zoom:.7}).ok,false);
});
