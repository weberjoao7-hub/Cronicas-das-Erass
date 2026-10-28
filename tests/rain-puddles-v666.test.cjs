'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const a=script.indexOf('function drawRainPuddles('),b=script.indexOf('function drawRiparianBank(',a);
assert.ok(a>=0&&b>a,'poças isoláveis');
const source=script.slice(a,b);
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(ww=74,biome=2,rain=.8,now=10000,onRoad=false,x=12,y=18){
 const calls=[];
 const ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'coordenadas finitas');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}
 });
 const draw=new Function('ctx','rnd',source+';return drawRainPuddles')(ctx,rnd);
 const painted=draw(200,150,ww,ww*38/74,x,y,biome,rain,now,onRoad);
 return {calls,painted};
}
const tile=(predicate)=>{for(let y=0;y<40;y++)for(let x=0;x<40;x++)if(predicate(rnd(x,y,94)))return {x,y};throw Error('seed not found')};
const wet=tile(v=>v>.85),dry=tile(v=>v<.20);
test('v6.66 compila e preserva a chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.66<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('sem chuva, zoom distante, lago, floresta ou montanha não desenham poças',()=>{
 for(const params of [[74,2,0],[37,2,.8],[74,0,.8],[74,3,.8],[74,5,.8]]){
  const r=scene(...params,10000,false,wet.x,wet.y);
  assert.equal(r.painted,0);
  assert.equal(r.calls.length,0);
 }
 assert.equal(scene(74,2,.8,10000,false,dry.x,dry.y).painted,0);
});
test('chuva recorta poças ao losango, com detalhe progressivo e geometria finita',()=>{
 const far=scene(44,2,.8,10000,false,wet.x,wet.y);
 const near=scene(74,2,.8,10000,false,wet.x,wet.y);
 assert.ok(far.painted>=2&&near.painted>=far.painted);
 assert.equal(far.calls.filter(c=>c[0]==='clip').length,1);
 assert.ok(near.calls.length>far.calls.length);
 assert.ok(near.calls.length<120,'custo limitado por ladrilho');
});
test('reflexos e anéis mudam com o tempo, sem alterar a quantidade de poças',()=>{
 const before=scene(74,1,.8,10000,true,wet.x,wet.y);
 const after=scene(74,1,.8,11000,true,wet.x,wet.y);
 assert.equal(before.painted,after.painted);
 assert.notDeepEqual(before.calls,after.calls);
 assert.deepEqual(before.calls,scene(74,1,.8,10000,true,wet.x,wet.y).calls);
});
test('renderização respeita terrenos ocupados, ruínas e ordem das camadas',()=>{
 const a=script.indexOf('if(b===4&&!ruinKind)drawHighlandGround(');
 const b=script.indexOf('if(rainLevel>.17&&!structures.has(key(x,y))&&!ruinKind)drawRainPuddles(',a);
 const c=script.indexOf('if(!structures.has(key(x,y))&&!roadTiles.has(key(x,y))){',b);
 assert.ok(a>0&&b>a&&c>b);
 assert.match(script,/const rainLevel=weatherPreview \? \.82 : weatherForDay\(game\.day,/);
 assert.doesNotMatch(source,/\b(?:game|localStorage|routeFor|passable)\s*[.=(]/);
});
