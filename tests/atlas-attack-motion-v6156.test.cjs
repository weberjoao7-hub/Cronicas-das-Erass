'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const slice=(a,b)=>{
 const x=script.indexOf(a),y=script.indexOf(b,x+a.length);
 assert.ok(x>=0&&y>x,'marcadores '+a+' / '+b);
 return script.slice(x,y);
};
const motionSource=slice('function atlasAttackMotion(','function drawPaintedCavalry(');
const troopSource=slice('function drawPaintedTroop(','// v6.76:');
const cavalrySource=slice('function drawPaintedCavalry(','function drawCavalrySprite(');
const motion=new Function(motionSource+'return atlasAttackMotion;')();
function render(kind,{now=1100,attackAt=1000,zoom=1.2}={}){
 const calls=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+String(k));
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;return true}
 });
 const unit={kind,x:80.5,y:80.5,face:1,attackAt,path:[]};
 const before=JSON.stringify(unit),DateMock={now:()=>now};
 let drawn;
 if(kind==='cavalry'){
  const draw=new Function('ctx','paintedCavalry','game','Date','atlasAttackMotion',cavalrySource+'return drawPaintedCavalry;')(
   ctx,{complete:true,naturalWidth:448,naturalHeight:448},{era:4},DateMock,motion);
  drawn=draw(unit,150,200,zoom);
 }else{
  const draw=new Function('ctx','paintedTroops','game','Date','atlasAttackMotion',troopSource+'return drawPaintedTroop;')(
   ctx,{complete:true,naturalWidth:256,naturalHeight:896},{era:4},DateMock,motion);
  drawn=draw(unit,150,200,zoom,kind==='archer',false,now-attackAt<340,now,1,false);
 }
 assert.equal(JSON.stringify(unit),before,'nenhum estado da unidade foi alterado');
 return {drawn,calls,transforms:calls.filter(c=>c[0]==='transform')};
}
test('JavaScript principal compila e salvamento permanece compatível',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(motionSource,/localStorage|game\.|\.attackAt\s*=/);
});
test('movimento de ataque possui janela limitada e coordenadas finitas',()=>{
 assert.equal(motion(null,1100),null);
 assert.equal(motion({},1100),null);
 assert.equal(motion({attackAt:1000},999),null);
 assert.equal(motion({attackAt:1000},1340),null);
 assert.equal(motion({attackAt:NaN},1100),null);
 assert.equal(motion({attackAt:1000},NaN),null);
 for(let age=0;age<340;age+=13){
  for(const [archer,mounted] of [[false,false],[true,false],[false,true]]){
   const v=motion({attackAt:1000},1000+age,archer,mounted);
   assert.ok(Number.isFinite(v.lean)&&Number.isFinite(v.stretch));
   assert.ok(Math.abs(v.lean)<=.126&&v.stretch>=.971&&v.stretch<=1.019);
  }
 }
});
test('infantaria avança, arqueiro recua e cavaleiro inclina menos',()=>{
 const melee=motion({attackAt:1000},1170),archer=motion({attackAt:1000},1170,true),mounted=motion({attackAt:1000},1170,false,true);
 assert.ok(melee.lean<-.12&&melee.stretch<1);
 assert.ok(archer.lean>.05&&archer.stretch>1);
 assert.ok(mounted.lean<0&&mounted.lean>melee.lean);
 assert.deepEqual(motion({attackAt:1000},1000),{lean:0,stretch:1,age:0});
});
test('atlases usam transformacao ancorada nos pes sem trocar os quadros',()=>{
 for(const kind of ['warrior','archer','cavalry']){
  const hit=render(kind),idle=render(kind,{now:1400});
  assert.equal(hit.drawn,true);
  assert.equal(hit.transforms.length,1,kind+' deve animar ataque');
  assert.equal(idle.transforms.length,0);
  assert.equal(hit.calls.filter(c=>c[0]==='drawImage').length,1);
  assert.equal(hit.calls.filter(c=>c[0]==='save').length,hit.calls.filter(c=>c[0]==='restore').length);
  assert.equal(hit.transforms[0][5],0,'pé permanece na origem vertical');
  assert.deepEqual(hit.calls.find(c=>c[0]==='drawImage'),idle.calls.find(c=>c[0]==='drawImage'));
 }
});
test('LOD preserva fallback em zoom distante',()=>{
 assert.equal(render('warrior',{zoom:.6}).drawn,false);
 assert.equal(render('archer',{zoom:.6}).drawn,false);
 assert.equal(render('cavalry',{zoom:.6}).drawn,false);
});
