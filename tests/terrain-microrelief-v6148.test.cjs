'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const start=script.indexOf('function drawTerrainMicroRelief(');
const end=script.indexOf('// Água rasa e transições costeiras',start);
assert.ok(start>=0&&end>start,'funcao de micro-relevo presente');
const source=script.slice(start,end);
const rnd=(x,y,k)=>{const n=Math.sin(x*127.1+y*311.7+k*74.7)*43758.5453;return n-Math.floor(n)};
function paint(b=2,ww=90,season=1,x=2,y=7){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),'Canvas finito');calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true;}
 });
 const fn=new Function('ctx','rnd','forestSeason',source+'return drawTerrainMicroRelief;')(ctx,rnd,()=>season);
 return {calls,styles,result:fn(100,120,ww,ww*.5,x,y,b,season)};
}
test('sintaxe e integracao preservam salvamento e biomas',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/visibleFog\[y\*W\+x\].*drawTerrainMicroRelief\(/);
 assert.match(script,/!roadTiles\.has\(key\(x,y\)\).*drawTerrainMicroRelief\(/);
 assert.ok(script.includes('cronicas-v04'));
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('LOD evita custo em zoom distante e inverno intermediario',()=>{
 assert.equal(paint(2,35).result,0);
 assert.equal(paint(2,60,3).result,0);
 assert.equal(paint(2,90).result,4);
});
test('geometria deterministica e biomas diferentes',()=>{
 assert.deepEqual(paint(2),paint(2));
 assert.notDeepEqual(paint(2),paint(4));
 assert.notDeepEqual(paint(3),paint(4));
});
test('outono e inverno alteram materiais',()=>{
 assert.notDeepEqual(paint(2,90,1).styles,paint(2,90,2).styles);
 assert.notDeepEqual(paint(4,90,1).styles,paint(4,90,3).styles);
});
test('recorte e estado Canvas balanceados',()=>{
 for(let b=1;b<=5;b++)for(const season of [0,1,2,3]){
  const {calls,result}=paint(b,100,season);
  if(!result)continue;
  assert.equal(calls.filter(c=>c[0]==='save').length,1);
  assert.equal(calls.filter(c=>c[0]==='restore').length,1);
  assert.equal(calls.filter(c=>c[0]==='clip').length,1);
 }
});
test('marcas sao locais e sem persistencia',()=>{
 assert.doesNotMatch(source,/\b(save|refresh|spawnUnit|claim|ownedTile)\s*\(/);
 assert.ok(paint(4,90).calls.some(c=>c[0]==='fill'));
 assert.ok(paint(2,90).calls.some(c=>c[0]==='stroke'));
});
