'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const a=script.indexOf('// v6.98: mineiro e vagoneta'),b=script.indexOf('function drawMine(',a);
assert.ok(a>=0&&b>a);
const source=script.slice(a,b);
function scene(era=4,ww=74,now=1000){
 const calls=[],styles=[],ctx=new Proxy({}, {get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+k);calls.push([k,...args]);};},set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}});
 const api=new Function('ctx',source+'return {mineCartMotion,drawMineWorkers};')(ctx);
 const result=api.drawMineWorkers(180,230,ww,ww*38/74,era,now);
 return {api,result,calls,styles};
}
test('v6.109: script válido, loop recuperável e save intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));assert.match(script,/finally\{requestAnimationFrame\(loop\)\}/);assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
});
test('vagoneta medieval e industrial movem-se sem mudar o terreno',()=>{
 const s=scene(),m=s.api.mineCartMotion;
 assert.equal(m(1000,180,230,74,38,0),null);
 assert.equal(m(1000,180,230,24,12,4),null);
 assert.deepEqual(m(1000,180,230,74,38,4),m(1000,180,230,74,38,4));
 assert.notDeepEqual(m(1000,180,230,74,38,4),m(1700,180,230,74,38,4));
 for(let t=0;t<20000;t+=127){const p=m(t,180,230,74,38,7);assert.ok(Math.abs(p.dx)<=74*.064+1e-8);assert.ok(Math.abs(p.dy)<=38*.064*.26+1e-8);assert.ok(Math.abs(p.rockLift)<=38*.008+1e-8);}
});
test('trilhos fixos e rodas animadas; zoom distante sem detalhes',()=>{
 const far=scene(4,24),mid=scene(4,40),close=scene(4,74);
 assert.equal(far.result,0);assert.equal(far.calls.length,0);
 assert.equal(mid.result,1);assert.equal(close.result,1);
 assert.ok(close.calls.filter(c=>c[0]==='lineTo').length>mid.calls.filter(c=>c[0]==='lineTo').length);
 assert.ok(close.calls.some(c=>c[0]==='ellipse'));
 assert.notDeepEqual(scene(4,74,1000).calls,scene(4,74,1700).calls);
});
test('materiais por era e desenho seguro no Canvas',()=>{
 assert.ok(scene(0).styles.includes('#977148'));
 assert.ok(scene(4).styles.includes('#a07b50'));
 assert.ok(scene(7).styles.includes('#728b91'));
 for(let era=0;era<8;era++)for(const ww of [24,36,54,74]){
  const s=scene(era,ww);assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
