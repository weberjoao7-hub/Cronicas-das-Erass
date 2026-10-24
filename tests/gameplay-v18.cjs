'use strict';
// Executar: node tests/gameplay-v18.cjs
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'O script do jogo deve existir');
const script=match[1].replace(/\}\)\(\);\s*$/,'globalThis.__test={game,biome,recruitUnit,upgradeBuilding,nextDay,tileMenu,select:(x,y)=>{selected={x,y}}};})();');
assert.notEqual(script,match[1],'O teste deve conseguir acessar o estado do jogo');
const elements=new Map(),storage=new Map();
function fakeContext(){
 const methods={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:()=>{},createLinearGradient:()=>({addColorStop:()=>{}})};
 return new Proxy(methods,{get:(target,name)=>name in target?target[name]:(()=>{}),set:(target,name,value)=>{target[name]=value;return true}});
}
const document={
 getElementById(id){const dynamic=new Set(['claim','upgrade','recruitWorker','recruitWarrior','buildHere','begin','continueGame','close','choose','move','worker','train','advance']);if(dynamic.has(id)&&!(elements.get('panel')?.innerHTML||'').includes('id="'+id+'"'))return null;if(!elements.has(id))elements.set(id,{id,style:{},classList:{add(){},remove(){}},addEventListener(){},setPointerCapture(){},getContext:fakeContext,querySelectorAll:()=>[],getBoundingClientRect:()=>({left:0,top:0,width:160,height:160})});return elements.get(id)},
 createElement:()=>({width:0,height:0,getContext:fakeContext})
};
const sandbox={document,innerWidth:900,innerHeight:650,devicePixelRatio:1,addEventListener:()=>{},requestAnimationFrame:()=>{},setTimeout:()=>1,clearTimeout:()=>{},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Uint8Array,Uint8ClampedArray,Math,Date,JSON,Set,Map,Array,Number,String,Object,Math};
vm.runInNewContext(script,sandbox,{timeout:10000});
const {game,biome,recruitUnit,upgradeBuilding,nextDay,tileMenu,select}=sandbox.__test;
assert.notEqual(biome(80,80),0,'O centro inicial não pode ser um lago');
assert.equal(game.units.length,3,'O jogo começa com três unidades');
const startFood=game.food;
recruitUnit('worker');
assert.equal(game.units.length,4,'Recrutar aldeão cria unidade');
assert.equal(game.food,startFood-20,'Recrutamento desconta alimento');
recruitUnit('worker');
assert.equal(game.units.length,5);
recruitUnit('worker');
assert.equal(game.units.length,5,'Limite populacional deve impedir recrutamento');
const farm={x:82,y:80,t:'Fazenda',level:1};
game.buildings.push(farm);
upgradeBuilding(farm);
assert.equal(farm.level,2,'Melhoria eleva nível da fazenda');
const foodBefore=game.food;
nextDay();
assert.equal(game.food-foodBefore,45,'Fazenda nível 2 produz 30 e base produz 15 alimentos');
select(82,80);
tileMenu();
assert.match(elements.get('panel').innerHTML,/Fazenda/);
assert.match(elements.get('panel').innerHTML,/Nível 2/);
assert.match(elements.get('panel').innerHTML,/Alimentos \+30\/dia/);
select(game.enemy.x,game.enemy.y);
tileMenu();
assert.match(elements.get('panel').innerHTML,/Base inimiga/,'Base inimiga deve ser identificada');
assert.doesNotMatch(elements.get('panel').innerHTML,/id="claim"/,'Base inimiga não pode ser dominada sem combate');
assert.ok(storage.has('cronicas-v04'),'Estado atualizado precisa ser salvo');
console.log('OK: inicialização, terreno, recrutamento, limite, melhorias, produção, painel, bloqueio de conquista inimiga e salvamento');
