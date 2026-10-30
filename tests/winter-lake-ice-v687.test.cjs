'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const a=script.indexOf('function drawWinterLakeIce('),b=script.indexOf('function drawCoast(',a);
assert.ok(a>0&&b>a,'helper de gelo antes da costa');
const source=script.slice(a,b);
const rnd=(x,y,z=0)=>{let n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
function paint({season=3,mask=1,depth=1,occupied=false,ww=74,now=5000}={}){
 const calls=[],state={};
 const ctx=new Proxy(state,{
  get(o,k){return k in o?o[k]:(...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'geometria finita');
   calls.push([k,...args]);
  }},
  set(o,k,v){o[k]=v;calls.push(['set',k,v]);return true}
 });
 const fn=new Function('ctx','rnd','forestSeason',source+';return drawWinterLakeIce;')(ctx,rnd,()=>season);
 const count=fn(180,140,ww,ww*.52,80,83,mask,depth,season,occupied,now);
 return {count,calls};
}
test('v6.87: script compila e mantém salvamento cronicas-v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=87);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
});
test('gelo somente no inverno, água rasa, costa livre e zoom legível',()=>{
 for(const season of [0,1,2])assert.equal(paint({season}).calls.length,0);
 for(const config of [{mask:0},{depth:2},{occupied:true},{ww:29}]){
  const scene=paint(config);assert.equal(scene.count,0);assert.equal(scene.calls.length,0);
 }
 assert.equal(paint().count,1);
});
test('todas as quatro arestas isométricas recebem placa própria',()=>{
 assert.equal(paint({mask:15}).count,4);
 const s=paint({mask:15});
 assert.equal(s.calls.filter(c=>c[0]==='clip').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='fill').length,4);
 assert.equal(s.calls.filter(c=>c[0]==='save').length,1);
 assert.equal(s.calls.filter(c=>c[0]==='restore').length,1);
});
test('LOD desenha neve e rachaduras somente no zoom próximo',()=>{
 const small=paint({ww:38,mask:15}),near=paint({ww:100,mask:15});
 assert.ok(near.calls.length>small.calls.length);
 assert.ok(near.calls.filter(c=>c[0]==='stroke').length>small.calls.filter(c=>c[0]==='stroke').length);
});
test('placas estáveis por coordenada, brilho suave no tempo e nenhum estado salvo',()=>{
 assert.deepEqual(paint().calls,paint().calls);
 assert.notDeepEqual(paint({now:5000}).calls,paint({now:9000}).calls);
 assert.doesNotMatch(source,/localStorage|game\.|Math\.random|assignRoute|passable\(/);
});
test('gelo é desenhado sobre o lago e abaixo dos barcos, com proteção para barcos e cais',()=>{
 const lake=script.indexOf('if(b===0)drawLakeDetails(');
 const ice=script.indexOf('if(b===0&&shoreMask[y*W+x])drawWinterLakeIce(',lake);
 const boats=script.indexOf('drawFishingBoat(boat,',ice);
 assert.ok(lake>=0&&ice>lake&&boats>ice);
 assert.match(script.slice(ice,ice+280),/structures\.has\(key\(x,y\)\)\|\|boatTiles\.has\(key\(x,y\)\)/);
});
