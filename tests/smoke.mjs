import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'Script principal não encontrado');
const source=match[1].replace(/\}\)\(\);\s*$/, 'globalThis.__test={biome,routeFor,game,point,tileAt,drawBarracks,drawTownHall,visibleTileBounds,lightLevels,drawAtmosphere,resize};})();');
assert.notEqual(source,match[1],'Não foi possível instrumentar o jogo');

const context2d=new Proxy({},{
 get(obj,key){
  if(key==='createImageData')return (w,h)=>({data:new Uint8ClampedArray(w*h*4)});
  if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop(){}});
  if(key==='measureText')return ()=>({width:12});
  return obj[key]??(()=>{});
 },
 set(obj,key,value){obj[key]=value;return true}
});
const elements=new Map(),listeners=new Map(),frames=[];
function element(id){
 if(!elements.has(id)){
  const events=new Map();listeners.set(id,events);
  elements.set(id,{
   id,width:160,height:160,style:{},dataset:{},
   classList:{add(){},remove(){}},
   getContext:()=>context2d,
   addEventListener:(name,fn)=>events.set(name,fn),
   setPointerCapture(){},querySelectorAll:()=>[],
   getBoundingClientRect:()=>({left:0,top:0,width:116,height:116}),
   innerHTML:'',textContent:''
  });
 }
 return elements.get(id);
}
let saved=0;
const sandbox={
 document:{getElementById:element,createElement:()=>({width:148,height:76,getContext:()=>context2d})},
 localStorage:{getItem:()=>null,setItem:()=>saved++},
 innerWidth:390,innerHeight:844,devicePixelRatio:2,
 addEventListener(){},requestAnimationFrame:fn=>frames.push(fn),
 setTimeout:()=>1,clearTimeout(){}
};
vm.runInNewContext(source,sandbox,{timeout:10000});
const t=sandbox.__test;
assert.ok(t,'Inicialização do jogo falhou');
assert.doesNotThrow(()=>t.drawBarracks(180,200,74,38),'Quartel deve renderizar no Canvas simulado');
assert.doesNotThrow(()=>t.drawTownHall(180,200,74,38,false),'Centro do jogador deve renderizar');
assert.doesNotThrow(()=>t.drawTownHall(180,200,74,38,true),'Base rival deve renderizar');
assert.equal(t.lightLevels(.25).night,0,'Dia deve permanecer iluminado');
assert.ok(t.lightLevels(.84).night>.9,'Ciclo deve produzir noite');
assert.doesNotThrow(()=>t.drawAtmosphere(.84),'Iluminação noturna deve funcionar em Canvas simulado');
function checkVisibleBounds(){
 const b=t.visibleTileBounds();
 for(const [sx,sy] of [[0,0],[sandbox.innerWidth,0],[0,sandbox.innerHeight],[sandbox.innerWidth,sandbox.innerHeight]]){
  const p=t.tileAt(sx,sy);
  if(p.x>=0&&p.x<160&&p.y>=0&&p.y<160)
   assert.ok(p.x>=b.minX&&p.x<=b.maxX&&p.y>=b.minY&&p.y<=b.maxY,'Cantos visíveis não podem ser descartados');
 }
}
checkVisibleBounds();
sandbox.innerWidth=1366;sandbox.innerHeight=768;t.resize();checkVisibleBounds();
assert.equal(t.biome(80,80),2,'Capital precisa nascer em terra firme');
assert.equal(t.biome(91,86),2,'Acampamento rival precisa nascer em terra firme');
const path=t.routeFor(t.game.units[0],91,86);
assert.ok(path?.length>0,'Deve existir rota terrestre até o inimigo');
assert.ok(path.every(p=>![0,5].includes(t.biome(Math.floor(p.x),Math.floor(p.y)))),
 'Rota não pode atravessar água nem montanhas');
assert.ok(frames.length>0,'Loop gráfico não iniciou');
frames.shift()(16);
assert.ok(frames.length>0,'Loop gráfico parou depois do primeiro quadro');
assert.ok(saved>0,'Salvamento local não iniciou');
const before=t.point(80,80);
listeners.get('minimap').get('pointerdown')({clientX:95,clientY:40});
assert.notDeepEqual(t.point(80,80),before,'Minimapa não moveu a câmera');
console.log('Smoke OK: sedes de ambas faccoes, quartel, mapa, rota, minimapa e salvamento');
