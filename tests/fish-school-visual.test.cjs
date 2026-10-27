'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function drawFishSchool(');
const end=script.indexOf('// Garças nas margens:',start);
assert.ok(start>0&&end>start);
const source=script.slice(start,end);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function scene(width=74,now=1500){
 const calls=[],styles=[];
 const ctx=new Proxy({},{
  get:(obj,key)=>obj[key]??((...args)=>{
   for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'coordenada finita');
   calls.push([key,...args]);
  }),
  set:(obj,key,value)=>{if(key==='fillStyle')styles.push(value);obj[key]=value;return true}
 });
 const draw=new Function('ctx','rnd','scale',source+';return drawFishSchool;')(ctx,rnd,1);
 draw(width,width*.51,17,22,now);
 return {calls,styles};
}
test('script compila e mantém save legado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('LOD elimina cardumes em zoom distante e limita população',()=>{
 assert.equal(scene(30).calls.length,0);
 assert.ok(scene(74).calls.length>scene(45).calls.length);
 assert.ok(scene(45).calls.length>0);
});
test('peixes ficam recortados no tile e usam cores submersas',()=>{
 const {calls,styles}=scene();
 assert.equal(calls.filter(c=>c[0]==='clip').length,1);
 assert.ok(calls.filter(c=>c[0]==='ellipse').length>=4);
 assert.ok(styles.includes('#244b52'));
 assert.equal(calls.filter(c=>c[0]==='save').length,calls.filter(c=>c[0]==='restore').length);
});
test('movimento é estável no mesmo instante e muda com o tempo',()=>{
 assert.deepEqual(scene(74,1200),scene(74,1200));
 assert.notDeepEqual(scene(74,1200),scene(74,3600));
});
test('integração evita peixes sobre barcos e não altera a economia',()=>{
 assert.match(script,/if\(kind==='fish'\)\{\s*drawFishSchool\(ww,hh,x,y,Date\.now\(\)\)/);
 assert.match(script,/!\(b===0&&boatTiles\.has\(key\(x,y\)\)\)/);
 assert.match(script,/if\(b===0&&visibleFog\[y\*W\+x\]\)for\(const boat of boatTiles/);
});
