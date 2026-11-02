'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal');
const start=script.indexOf('function ambientParticleSites('),end=script.indexOf('/* Weather follows',start);
assert.ok(start>=0&&end>start,'particulas ambientais isolaveis');
const source=script.slice(start,end);
function scene({season=1,night=1,biomeType=3,visible=true,rain=0,scale=1,roads=[],buildings=[],width=600}={}){
 const W=12,H=12,visibleFog=new Uint8Array(W*H).fill(visible?1:0);
 const calls=[],styles=[],points=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),k);calls.push([k,...args]);}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='globalCompositeOperation')styles.push([k,v]);return true;}
 });
 const key=(x,y)=>x+','+y;
 const roadTiles=new Set(roads),built=new Set(buildings);
 const rnd=()=>.9,biome=()=>biomeType;
 const bounds={minX:0,minY:0,maxX:11,maxY:11};
 const point=(x,y)=>{points.push([x,y]);return [x*10,y*8+90];};
 const make=new Function('ctx','visibleFog','W','H','biome','roadTiles','key','at','rnd','forestSeason','dayClock','lightLevels','renderRainLevel','scale','visibleTileBounds','w','h','point','TH',source+'return {ambientParticleSites,drawAmbientParticles};');
 const api=make(ctx,visibleFog,W,H,biome,roadTiles,key,(x,y)=>built.has(key(x,y)),rnd,()=>season,60,()=>({night}),rain,scale,()=>bounds,width,600,point,38);
 return {api,ctx,calls,styles,points,visibleFog,bounds};
}
test('v6.185: sintaxe e persistencia sem alteracoes',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=185);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|setInterval|game\./);
});
test('particulas respeitam nevoa de guerra',()=>{
 const hidden=scene({visible:false});assert.equal(hidden.api.ambientParticleSites(hidden.bounds,1,1).length,0);
 assert.equal(hidden.api.drawAmbientParticles(1000),0);
 const revealed=scene();revealed.visibleFog.fill(0);revealed.visibleFog[0]=1;
 assert.equal(revealed.api.ambientParticleSites(revealed.bounds,1,1).length,1);
});
test('vagalumes na floresta e polen no campo, sem particulas em montanhas',()=>{
 const forest=scene();assert.ok(forest.api.ambientParticleSites(forest.bounds,1,1).every(p=>p.firefly));
 const fieldNight=scene({biomeType:1});assert.equal(fieldNight.api.ambientParticleSites(fieldNight.bounds,1,1).length,0);
 const fieldDay=scene({biomeType:1,night:0});assert.ok(fieldDay.api.ambientParticleSites(fieldDay.bounds,1,0).every(p=>!p.firefly));
 const rock=scene({biomeType:5});assert.equal(rock.api.ambientParticleSites(rock.bounds,1,0).length,0);
});
test('estradas, edificios e limite de particulas respeitados',()=>{
 const s=scene({roads:['0,0'],buildings:['3,0']});
 const sites=s.api.ambientParticleSites(s.bounds,1,1,4);
 assert.equal(sites.length,4);
 assert.ok(sites.every(p=>!(p.x<1&&p.y<1)&&!(p.x>3&&p.x<4&&p.y<1)));
 assert.deepEqual(s.api.ambientParticleSites(s.bounds,1,1,4),sites);
});
test('inverno, zoom distante e chuva forte eliminam efeito',()=>{
 for(const options of [{season:3},{scale:.5},{rain:.9}]){
  const s=scene(options);assert.equal(s.api.drawAmbientParticles(1500),0);
  assert.equal(s.calls.length,0);
 }
});
test('Canvas equilibrado, coordenadas do mundo e integracao na renderizacao',()=>{
 for(const night of [0,1]){
  const s=scene({night}),count=s.api.drawAmbientParticles(2300);
  assert.ok(count>0&&count<=18);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
  assert.equal(s.points.length,count);
  assert.ok(s.calls.filter(c=>c[0]==='ellipse').length>=count);
  assert.ok(s.styles.some(v=>v[0]==='fillStyle'));
  if(night)assert.ok(s.styles.some(v=>v[0]==='globalCompositeOperation'&&v[1]==='screen'));
 }
 assert.match(script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){')),/drawAmbientParticles\(frameTime\)/);
 assert.doesNotMatch(source,/%\(w\+80\)|%\(h\+90\)/);
});
