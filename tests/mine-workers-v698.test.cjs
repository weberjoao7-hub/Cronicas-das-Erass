'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const a=script.indexOf('// v6.98: mineiro e vagoneta');
const b=script.indexOf('function drawMine(',a);
assert.ok(a>=0&&b>a,'nova funcao presente');
const source=script.slice(a,b);
function scene(era=4,ww=74,now=1000){
 const calls=[],styles=[],ctx=new Proxy({},{
  get(o,k){return k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));calls.push([k,...args])}},
  set(o,k,v){o[k]=v;if(k==='fillStyle'||k==='strokeStyle')styles.push(v);return true}
 });
 const draw=new Function('ctx',source+';return drawMineWorkers;')(ctx);
 return {count:draw(180,230,ww,ww*38/74,era,now),calls,styles};
}
test('v6.98: sintaxe valida e save legado preservado',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(html.includes('Crônicas das Eras v6.98'));
 assert.ok(script.includes("localStorage.getItem('cronicas-v04')"));
});
test('LOD: nao desenha mineiro no zoom distante',()=>{
 assert.equal(scene(4,24).count,0);assert.equal(scene(4,24).calls.length,0);
 assert.equal(scene(4,74).count,1);
});
test('cesto primitivo, vagoneta medieval e equipamento industrial',()=>{
 assert.ok(scene(0).styles.includes('#977148'));
 assert.ok(scene(4).styles.includes('#a07b50'));
 assert.ok(scene(7).styles.includes('#728b91'));
 assert.ok(scene(7).styles.includes('#e2b34c'));
});
test('animacao deterministica da picareta',()=>{
 assert.deepEqual(scene(4,74,1000),scene(4,74,1000));
 assert.notDeepEqual(scene(4,74,1000).calls,scene(4,74,1700).calls);
});
test('Canvas equilibrado e coordenadas finitas nas oito eras',()=>{
 for(let era=0;era<8;era++)for(const ww of [24,36,54,74]){
  const s=scene(era,ww);
  assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 }
});
test('render por tile respeita obra inacabada e exploracao',()=>{
 const render=script.slice(script.indexOf('function draw(){'),script.indexOf('function spawnUnit('));
 assert.ok(render.includes('if(!exploredFog[y*W+x])continue'));
 assert.ok(render.includes('if(obj&&obj.buildLeft){drawConstructionSite(obj,px,py,ww,hh)}'));
 assert.ok(render.includes("else if(obj.t==='Mina'){drawMine(px,py,ww,hh,obj.level,game.era,frameTime);drawMineWorkers(px,py,ww,hh,game.era,frameTime);}"));
});
