'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal disponível');
const begin=script.indexOf('const combatFloatHits=[];');
const end=script.indexOf('// Flechas orientadas',begin);
assert.ok(begin>0&&end>begin,'efeitos de dano isoláveis');
const source=script.slice(begin,end);
function harness({zoom=1,visible=true,position=(x,y,z)=>[120,150-z],width=420,height=340}={}){
 const calls=[],properties=[];
 const ctx=new Proxy({},{
  get(obj,key){if(key in obj)return obj[key];return (...args)=>{
   for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),String(key)+' recebeu NaN');
   calls.push({method:key,args});
  }},
  set(obj,key,value){obj[key]=value;properties.push([key,value]);return true}
 });
 const api=new Function('ctx','visibleAt','point','scale','w','h','TH',
  source+';return {recordCombatHit,drawCombatNumbers,combatFloatHits};')(
  ctx,typeof visible==='function'?visible:()=>visible,position,zoom,width,height,34);
 return {...api,calls,properties};
}
test('script principal compila e mantém o mesmo formato de salvamento',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(html,/<title>Crônicas das Eras v6\.143<\/title>/);
});
test('não registra dano nulo, negativo ou coordenadas inválidas',()=>{
 const h=harness();
 for(const args of [[NaN,1,4,true],[1,Infinity,4,true],[1,1,0,true],[1,1,-2,true],[1,1,NaN,true],[1,1,4,true,NaN]])
  assert.equal(h.recordCombatHit(...args),false);
 assert.equal(h.combatFloatHits.length,0);
});
test('limita a 36 impactos para não acumular partículas no Safari',()=>{
 const h=harness();
 for(let i=0;i<48;i++)assert.equal(h.recordCombatHit(i,1,5,true,1000),true);
 assert.equal(h.combatFloatHits.length,36);
 assert.equal(h.combatFloatHits[0].x,12);
 assert.equal(h.combatFloatHits[35].x,47);
});
test('dano nos inimigos aparece em dourado e nas tropas amigas em vermelho',()=>{
 const h=harness();
 h.recordCombatHit(1,1,13.8,true,1000);
 h.recordCombatHit(2,2,7,false,1000);
 assert.equal(h.drawCombatNumbers(1100),2);
 assert.deepEqual(h.calls.filter(c=>c.method==='fillText').map(c=>c.args[0]).sort(),['-14','-7']);
 const colors=h.properties.filter(([key])=>key==='fillStyle').map(([,v])=>v);
 assert.ok(colors.includes('#ffe2a0'));
 assert.ok(colors.includes('#ff9d89'));
 assert.equal(h.calls.filter(c=>c.method==='save').length,h.calls.filter(c=>c.method==='restore').length);
});
test('números sobem e expiram após 920 ms sem estado persistente',()=>{
 const h=harness();
 h.recordCombatHit(3,4,9,true,1000);
 assert.equal(h.drawCombatNumbers(1100),1);
 const first=h.calls.find(c=>c.method==='fillText').args[2];
 h.calls.length=0;
 assert.equal(h.drawCombatNumbers(1500),1);
 const second=h.calls.find(c=>c.method==='fillText').args[2];
 assert.ok(second<first,'o número deve subir');
 assert.equal(h.drawCombatNumbers(1920),0);
 assert.equal(h.combatFloatHits.length,0);
});
test('névoa de guerra, zoom distante e área fora da câmera impedem vazamentos visuais',()=>{
 const fog=harness({visible:false}),lod=harness({zoom:.6}),offscreen=harness({position:()=>[9999,9999]});
 for(const h of [fog,lod,offscreen]){h.recordCombatHit(1,1,5,true,1000);assert.equal(h.drawCombatNumbers(1100),0);assert.equal(h.calls.length,0)}
 assert.equal(lod.drawCombatNumbers(1921),0);
 assert.equal(lod.combatFloatHits.length,0);
});
test('impacto na base inimiga fica acima dos impactos nas unidades',()=>{
 const heights=[];
 const h=harness({position:(x,y,z)=>{heights.push(z);return [120,150-z]}});
 h.recordCombatHit(1,1,10,true,1000,'unit');
 h.recordCombatHit(1,1,20,true,1000,'base');
 assert.equal(h.drawCombatNumbers(1100),2);
 assert.ok(heights.includes(34*.85));
 assert.ok(heights.includes(34*1.58));
});
test('todos os quatro tipos de dano são registrados sem alterar o cálculo de combate',()=>{
 const combat=script.slice(script.indexOf('function combatTurn('),script.indexOf('const key=',script.indexOf('function combatTurn(')));
 assert.equal((combat.match(/recordCombatHit\(/g)||[]).length,4);
 assert.match(combat,/Math\.min\(14,target\.hp\)/);
 assert.match(combat,/Math\.min\(target\.hp,attackDamage\(u\.kind\)\)/);
 assert.match(combat,/Math\.min\(game\.enemy\.hp,/);
 assert.match(combat,/Math\.min\(target\.hp,archer\?7:11\)/);
 assert.match(script,/drawCombatNumbers\(frameTime\);drawAmbientParticles\(frameTime\)/);
 assert.doesNotMatch(source,/\blocalStorage\b|\bgame\s*\./);
});
