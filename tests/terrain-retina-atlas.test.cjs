'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('const TERRAIN_VARIANTS=');
const end=script.indexOf('\nfunction point(',start);
assert.ok(start>=0&&end>start,'atlas de terreno');
const source=script.slice(start,end);

function makeAtlas(ratio){
 const canvases=[],calls={scale:0,fill:0,stroke:0,save:0,restore:0};
 const ctx=new Proxy({},{
  get(o,k){
   if(k in o)return o[k];
   if(k==='createLinearGradient')return ()=>({addColorStop(){}});
   return (...args)=>{
    if(k in calls)calls[k]++;
    for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+k+' recebeu coordenada inválida');
   };
  },
  set(o,k,v){o[k]=v;return true}
 });
 const document={createElement(tag){
  assert.equal(tag,'canvas');
  const c={width:0,height:0,getContext(kind){assert.equal(kind,'2d');return ctx}};
  canvases.push(c);return c;
 }};
 const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
 const atlas=new Function('document','rnd','devicePixelRatio',source+';return {tileArt,TERRAIN_VARIANTS,terrainTextureScale};')(document,rnd,ratio);
 return {atlas,canvases,calls,bytes:canvases.reduce((total,c)=>total+c.width*c.height*4,0)};
}
test('script do jogo continua compilando sem mudar o formato do salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('oito texturas distintas são geradas para cada um dos seis biomas',()=>{
 const {atlas,canvases,calls}=makeAtlas(1);
 assert.equal(atlas.TERRAIN_VARIANTS,8);
 assert.equal(atlas.tileArt.length,6);
 assert.ok(atlas.tileArt.every(group=>group.length===8));
 assert.equal(new Set(atlas.tileArt.flat()).size,48);
 assert.equal(canvases.length,48);
 assert.equal(calls.scale,48);
 assert.equal(calls.save,calls.restore);
 assert.ok(calls.fill>100&&calls.stroke>100,'microdetalhes foram desenhados no cache');
 assert.match(script,/tileArt\[b\]\[Math\.floor\(q\*TERRAIN_VARIANTS\)\]/);
});
test('texturas Retina têm o dobro da resolução sem estourar 10 MB',()=>{
 const standard=makeAtlas(1),retina=makeAtlas(3);
 assert.equal(standard.atlas.terrainTextureScale,1);
 assert.equal(retina.atlas.terrainTextureScale,2);
 assert.ok(standard.canvases.every(c=>c.width===148&&c.height===76));
 assert.ok(retina.canvases.every(c=>c.width===296&&c.height===152));
 assert.equal(retina.bytes,standard.bytes*4);
 assert.ok(retina.bytes<10*1024*1024);
 assert.equal(standard.calls.fill,retina.calls.fill,'LOD mantém mesma quantidade de desenhos');
});
