'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const a=html.indexOf('function drawRoadLantern('),b=html.indexOf('function drawRoad(',a);
assert.ok(a>=0&&b>a,'renderer de luminárias encontrado');
const art=html.slice(a,b);
function render(era,width=74,night=1){
 const calls=[],styles=[];
 const methods=new Set(['save','restore','beginPath','ellipse','fill','stroke','moveTo','lineTo','closePath','quadraticCurveTo','fillRect','strokeRect','arc']);
 const ctx=new Proxy({},{
  get:(obj,key)=>methods.has(key)?(...args)=>{
   for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),'coordenadas finitas');
   calls.push(key);
  }:obj[key],
  set:(obj,key,value)=>{obj[key]=value;if(key==='fillStyle'||key==='strokeStyle')styles.push(value);return true}
 });
 const draw=new Function('ctx','dayClock','lightLevels',art+';return drawRoadLantern;')(ctx,90,()=>({night}));
 draw(200,150,width,width*.51,24,33,era,1000);
 assert.equal(calls.filter(c=>c==='save').length,calls.filter(c=>c==='restore').length);
 return {calls,styles};
}
test('script principal compila e preserva a chave de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
});
test('quatro eras de iluminação respeitam zoom e geometria',()=>{
 for(let era=0;era<4;era++)assert.equal(render(era).calls.length,0);
 assert.equal(render(7,20).calls.length,0);
 for(let era=4;era<=7;era++)assert.ok(render(era).calls.length>=8);
 assert.ok(render(7,74).calls.length>render(7,45).calls.length);
});
test('materiais históricos, animação da tocha e estados de iluminação',()=>{
 assert.ok(render(4).styles.includes('#4c3322'));
 assert.ok(render(5).styles.includes('#ab9464'));
 assert.ok(render(6).styles.includes('#344743'));
 assert.ok(render(7).styles.includes('#364c52'));
 assert.ok(render(4,74,0).calls.length<render(4,74,1).calls.length);
});
test('cache de postes utiliza estradas concluídas, exclui água e edifícios',()=>{
 const x=html.indexOf("let roadSignature=''");
 const y=html.indexOf('// Caminhos isométricos:',x);
 assert.ok(x>=0&&y>x);
 const source=html.slice(x,y);
 const buildings=[{x:80,y:80,t:'Aldeia'},{x:90,y:80,t:'Cabana'}];
 const routeFor=()=>Array.from({length:11},(_,i)=>({x:80+i,y:80}));
 const key=(x,y)=>x+','+y;
 const run=(biome)=>new Function('game','key','routeFor','biome',source+
  ';updateRoads();return {sites:roadLanternSites,set:roadLanternSet};')({buildings},key,routeFor,biome);
 const normal=run(()=>2);
 assert.ok(normal.set.has('85,80'));
 assert.ok(!normal.set.has('80,80'));
 assert.ok(!normal.set.has('90,80'));
 assert.ok(!run((x)=>x===85?0:2).set.has('85,80'));
 assert.ok(script.includes('if(lights>=24)break'));
 assert.ok(script.includes('visibleAt(site.x+.5,site.y+.5)'));
});
test('minimapa arrastável usa coordenadas normalizadas e limites do mapa',()=>{
 const p=html.indexOf('function panMinimap('),q=html.indexOf("M.addEventListener('pointerdown'",p);
 assert.ok(p>0&&q>p);
 const M={getBoundingClientRect:()=>({left:10,top:20,width:100,height:100})};
 const camera=new Function('M','W','H',
  'let cx=80,cy=80,dirty=false;'+html.slice(p,q)+
  ';return {pan:panMinimap,read:()=>({cx,cy,dirty})};')(M,160,160);
 camera.pan(60,70);assert.equal(camera.read().cx,80);assert.equal(camera.read().cy,80);
 camera.pan(-500,500);assert.equal(camera.read().cx,0);assert.equal(camera.read().cy,159);
 assert.ok(camera.read().dirty);
 assert.ok(script.includes('setPointerCapture'));
 assert.ok(script.includes('lostpointercapture'));
});
