'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=script.indexOf('function drawMountainFoothillTransition(');
const end=script.indexOf('// Encostas e colinas:',start);
assert.ok(start>=0&&end>start,'transicao geologica presente');
const source=script.slice(start,end);
const rnd=(x,y,z)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function paint(mask=3,ww=90,season=0,phase=.3,occupied=false){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas finito');calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle')styles.push(v);return true;}
 });
 const fn=new Function('ctx','rnd','lightLevels',source+'return drawMountainFoothillTransition;')(ctx,rnd,p=>({night:p>.65?.8:0}));
 return {calls,styles,count:fn(100,100,ww,ww*.51,12,13,mask,season,phase,occupied)};
}
test('sintaxe e integracao ao terreno sem alterar salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/const mountainFootMask=new Uint8Array\(W\*H\)/);
 assert.match(script,/visibleFog\[y\*W\+x\]&&b>0&&b<5&&mountainFootMask/);
 assert.ok(script.includes('cronicas-v04'));
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('LOD omite transicao sem montanha ou em zoom distante',()=>{
 assert.equal(paint(0).count,0);
 assert.equal(paint(1,25).count,0);
 assert.equal(paint(1,45).count,1);
});
test('cascalho e controlado pelo zoom e ocupacao',()=>{
 assert.equal(paint(15,90).count,16);
 assert.equal(paint(15,70).count,8);
 assert.equal(paint(15,90,0,.3,true).count,1);
});
test('sombra acompanha orientacao solar e neve altera paleta',()=>{
 assert.notDeepEqual(paint(3,90,0,.2).calls,paint(3,90,0,.7).calls);
 assert.notDeepEqual(paint(3,90,0).styles,paint(3,90,3).styles);
});
test('geometria deterministica e coordenadas finitas',()=>{
 assert.deepEqual(paint(5,90),paint(5,90));
 for(let mask=1;mask<=15;mask++)paint(mask,90,3,.4);
});
test('Canvas preserva save restore e recorte do losango',()=>{
 for(const mask of [1,2,4,8,15]){
  const {calls}=paint(mask,90);
  assert.equal(calls.filter(c=>c[0]==='save').length,1);
  assert.equal(calls.filter(c=>c[0]==='restore').length,1);
  assert.equal(calls.filter(c=>c[0]==='clip').length,1);
 }
});
