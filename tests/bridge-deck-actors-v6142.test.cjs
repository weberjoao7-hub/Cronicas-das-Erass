'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function bridgeDeckLift(');
const end=script.indexOf('function drawTileOccupants(',start);
assert.ok(start>=0&&end>start,'helper de elevacao da ponte presente');
const source=script.slice(start,end);
const lift=new Function(source+'return bridgeDeckLift;')();
const bridge={t:'Ponte',axis:'x',buildLeft:0};

test('v6.142: script compila e salvamento legado permanece',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.142<\/title>/);
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.doesNotMatch(source,/localStorage|game\.|Math\.random/);
});
test('soldado no centro da ponte acompanha altura do tablado',()=>{
 assert.ok(Math.abs(lift({x:12.5,y:20.5},12,20,40,bridge)-4.4)<1e-9);
 assert.equal(lift({x:12,y:20.5},12,20,40,bridge),0);
 assert.equal(lift({x:13,y:20.5},12,20,40,bridge),0);
});
test('rampas de entrada e saida sao continuas e simetricas',()=>{
 const heights=[0,.045,.09,.135,.18,.5,.82,.865,.91,.955,1].map(t=>lift({x:12+t,y:20.5},12,20,40,bridge));
 for(const v of heights)assert.ok(Number.isFinite(v)&&v>=0&&v<=4.4);
 for(let i=1;i<5;i++)assert.ok(heights[i]>heights[i-1]);
 for(let i=0;i<5;i++)assert.ok(Math.abs(heights[i]-heights[10-i])<1e-8);
});
test('pontes no eixo Y usam a coordenada correta',()=>{
 const by={...bridge,axis:'y'};
 assert.ok(Math.abs(lift({x:12.01,y:20.5},12,20,40,by)-4.4)<1e-9);
 assert.ok(lift({x:12.5,y:20.01},12,20,40,by)<.1);
});
test('obras incompletas e entradas invalidas nao elevam personagens',()=>{
 for(const b of [null,{t:'Cabana',buildLeft:0},{...bridge,buildLeft:4}]){
  assert.equal(lift({x:12.5,y:20.5},12,20,40,b),0);
 }
 assert.equal(lift(null,12,20,40,bridge),0);
 assert.equal(lift({x:NaN,y:20.5},12,20,40,bridge),0);
 assert.equal(lift({x:12.5,y:20.5},12,20,NaN,bridge),0);
 assert.equal(lift({x:12.5,y:20.5},12,20,-1,bridge),0);
});
test('pontes nao ocultam soldados atras da propria plataforma',()=>{
 assert.match(script,/const behind=obj\.t==='Ponte'\?\[\]:structureActors\.filter/);
 assert.match(script,/obj\.t==='Ponte'\?structureActors:structureActors\.filter/);
 assert.match(script,/obj\.t==='Ponte'\?obj:null/);
 const back=script.indexOf('if(behind.length)drawTileOccupants(');
 const bridgePaint=script.indexOf("if(obj.t==='Ponte')drawBridge(",back);
 const front=script.indexOf('else if(structureActors)drawTileOccupants(',bridgePaint);
 assert.ok(back>=0&&bridgePaint>back&&front>bridgePaint);
});
test('sombra, sprite, marcadores e barra de vida usam a mesma altura',()=>{
 const body=script.slice(end,script.indexOf('// Renderização de bosque ocupado',end));
 assert.match(body,/py=groundY-bridgeDeckLift\(u,x,y,TH\*z,bridge\)/);
 for(const fn of ['drawUnitGroundShadow','drawStrategicUnitMarker','drawUnitSprite','unitHealthBarTop']){
  assert.ok(body.includes(fn+'(u,px,py'),'desenho ancorado: '+fn);
 }
 assert.doesNotMatch(source,/u\.x\s*=|u\.y\s*=/);
});
