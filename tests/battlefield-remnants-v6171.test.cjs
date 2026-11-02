'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal presente');
const start=script.indexOf('const battlefieldRemnants=[];');
const end=script.indexOf('function drawUnitGroundShadow(',start);
assert.ok(start>0&&end>start,'rotinas de detritos isoláveis');
const source=script.slice(start,end);
function harness(season=0){
 const ops=[],ctx=new Proxy({},{
  get(target,prop){if(prop in target)return target[prop];
   if(['save','restore','translate','rotate','beginPath','ellipse','fill','stroke',
       'moveTo','lineTo','closePath','fillRect','arc'].includes(prop))
    return (...args)=>ops.push([prop,...args]);
   return undefined},
  set(target,prop,value){target[prop]=value;return true}
 });
 const game={era:4,units:[],enemyUnits:[]},W=160,H=160;
 const biome=(x,y)=>x===9&&y===9?0:2;
 const api=new Function('ctx','point','biome','W','H','game','rnd','key','scale','forestSeason',
  source+'return {battlefieldRemnants,recordBattlefieldRemnant,collectBattlefieldRemnants,drawBattlefieldRemnantsTile};')(
   ctx,(x,y)=>[x*20,y*10],biome,W,H,game,()=>.5,(x,y)=>x+','+y,1.2,()=>season);
 return {...api,game,ops,ctx};
}
const bounds={minX:0,maxX:159,minY:0,maxY:159};
test('v6.171: JavaScript compila, sem alteração no save cronicas-v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.units\s*=|game\.buildings\s*=/);
});
test('registrador rejeita água, limites e coordenadas inválidas',()=>{
 const h=harness();
 for(const u of [null,{x:NaN,y:3},{x:9.2,y:9.2},{x:-1,y:3},{x:160,y:3},{x:2,y:Infinity}])
  assert.equal(h.recordBattlefieldRemnant(u),false);
 assert.equal(h.battlefieldRemnants.length,0);
 assert.equal(h.recordBattlefieldRemnant({x:40.2,y:41.3,kind:'archer'},true,1000),true);
 assert.equal(h.battlefieldRemnants[0].enemy,true);
 assert.equal(h.battlefieldRemnants[0].kind,'archer');
});
test('memória de batalha limitada a 36 marcas e expiração após 48 segundos',()=>{
 const h=harness();
 for(let i=0;i<45;i++)h.recordBattlefieldRemnant({x:20+i*.01,y:30,kind:'warrior'},false,1000+i);
 assert.equal(h.battlefieldRemnants.length,36);
 h.collectBattlefieldRemnants(bounds,50000,1.2);
 assert.equal(h.battlefieldRemnants.length,0);
});
test('agrupamento respeita viewport, três objetos por terreno e LOD',()=>{
 const h=harness();
 for(let i=0;i<7;i++)h.recordBattlefieldRemnant({x:30.1+i*.01,y:31.2,kind:'warrior'},false,1000);
 h.recordBattlefieldRemnant({x:100,y:100,kind:'worker'},false,1000);
 assert.equal(h.collectBattlefieldRemnants(bounds,2000,.6).size,0);
 const tiles=h.collectBattlefieldRemnants({minX:29,maxX:32,minY:30,maxY:32},2000,1.2);
 assert.equal(tiles.size,1);
 assert.equal(tiles.get('30,31').length,3);
});
test('geometria Canvas desenha cinco classes, com sombras no solo e sem NaN',()=>{
 const h=harness();
 for(const kind of ['warrior','archer','cavalry','cannon','worker'])
  h.recordBattlefieldRemnant({x:50,y:50,kind},false,1000);
 const n=h.drawBattlefieldRemnantsTile(h.battlefieldRemnants,1.2,2000,0);
 assert.equal(n,5);
 assert.ok(h.ops.some(op=>op[0]==='ellipse'));
 assert.ok(h.ops.some(op=>op[0]==='lineTo'));
 assert.ok(h.ops.some(op=>op[0]==='fillRect'));
 for(const op of h.ops)for(const value of op.slice(1))if(typeof value==='number')
  assert.ok(Number.isFinite(value),'coordenada Canvas finita');
});
test('neve, fade e integração sob as unidades com visibilidade da névoa',()=>{
 const h=harness(3);
 h.recordBattlefieldRemnant({x:50,y:50,kind:'warrior'},false,1000);
 assert.equal(h.drawBattlefieldRemnantsTile(h.battlefieldRemnants,1.2,49000,3),0);
 assert.equal(h.drawBattlefieldRemnantsTile(h.battlefieldRemnants,.6,2000,3),0);
 assert.equal(h.drawBattlefieldRemnantsTile(h.battlefieldRemnants,1.2,2000,3),1);
 assert.match(script,/const remnantTiles=collectBattlefieldRemnants\(bounds,frameTime,z\)/);
 assert.match(script,/visibleFog\[y\*W\+x\]&&remnantTiles\.has\(key\(x,y\)\)/);
 assert.match(script,/drawBattlefieldRemnantsTile\(remnantTiles\.get\(key\(x,y\)\),z,frameTime,forestSeason\(\)\)/);
 assert.match(script,/recordBattlefieldRemnant\(e,true\)/);
 assert.match(script,/recordBattlefieldRemnant\(u,false\)/);
});
