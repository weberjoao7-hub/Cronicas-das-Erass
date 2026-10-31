'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'script principal ausente');
const start=script.indexOf('function fogFrontierEdges(');
const end=script.indexOf('function draw(){',start);
assert.ok(start>=0&&end>start,'helper da nevoa isolavel');
const source=script.slice(start,end);
function scene(width=5,height=5){
 const calls=[],gradients=[];
 const ctx=new Proxy({},{
  get(o,k){
   if(k in o)return o[k];
   if(k==='createLinearGradient')return (...args)=>{
    for(const v of args)assert.ok(Number.isFinite(v),'gradiente finito');
    calls.push(['createLinearGradient',...args]);
    const stops=[];gradients.push(stops);
    return {addColorStop:(...args)=>stops.push(args)};
   };
   return (...args)=>{
    for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),'Canvas '+String(k));
    calls.push([k,...args]);
   };
  },
  set(o,k,v){o[k]=v;return true;}
 });
 const api=new Function('ctx','W','H',source+'return {fogFrontierEdges,drawFogFrontier}')(ctx,width,height);
 return {...api,calls,gradients};
}
test('script completo compila e formato do save permanece intacto',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(source,/localStorage|Math\.random|game\.|save\(/);
});
test('nevoa explorada adjacente a tile visivel recebe gradiente',()=>{
 const s=scene(),visible=new Uint8Array(25),explored=new Uint8Array(25);
 explored[12]=1;visible[7]=1;
 assert.deepEqual(s.fogFrontierEdges(2,2,visible,explored,5,5),[{side:0,opacity:.26}]);
 assert.equal(s.drawFogFrontier(100,120,72,36,2,2,visible,explored),1);
 assert.equal(s.gradients.length,1);assert.equal(s.gradients[0].length,3);
});
test('tiles totalmente desconhecidos nao sao revelados',()=>{
 const s=scene(),v=new Uint8Array(25),e=new Uint8Array(25);
 assert.deepEqual(s.fogFrontierEdges(2,2,v,e,5,5),[]);
 assert.equal(s.drawFogFrontier(100,120,72,36,2,2,v,e),0);
 assert.equal(s.calls.length,0);
});
test('fronteira desconhecida com area explorada e distinta',()=>{
 const s=scene(),v=new Uint8Array(25),e=new Uint8Array(25);e[13]=1;
 assert.deepEqual(s.fogFrontierEdges(2,2,v,e,5,5),[{side:1,opacity:.31}]);
 assert.equal(s.drawFogFrontier(100,120,72,36,2,2,v,e),1);
});
test('LOD e coordenadas invalidas nao geram operacoes de Canvas',()=>{
 const s=scene(),v=new Uint8Array(25),e=new Uint8Array(25);v[7]=1;
 assert.equal(s.drawFogFrontier(100,120,30,15,2,2,v,e),0);
 assert.equal(s.drawFogFrontier(Infinity,120,72,36,2,2,v,e),0);
 assert.deepEqual(s.fogFrontierEdges(-1,2,v,e,5,5),[]);
 assert.deepEqual(s.fogFrontierEdges(2,2,v,e,0,5),[]);
 assert.equal(s.calls.length,0);
});
test('quatro bordas geram gradientes finitos e Canvas balanceado',()=>{
 const s=scene(),v=new Uint8Array(25),e=new Uint8Array(25);
 for(const i of [7,11,13,17])v[i]=1;
 assert.equal(s.drawFogFrontier(200,180,88,44,2,2,v,e),4);
 assert.equal(s.gradients.length,4);
 assert.equal(s.calls.filter(c=>c[0]==='save').length,s.calls.filter(c=>c[0]==='restore').length);
 for(const stops of s.gradients){assert.deepEqual(stops.map(p=>p[0]),[0,.58,1]);assert.match(stops[2][1],/rgba\(6,17,29,0\)/);}
});
test('fronteiras sao aplicadas apos todos os losangos de nevoa',()=>{
 const draw=script.slice(script.indexOf('function draw(){'),script.indexOf('function refresh(){'));
 const fog=draw.indexOf("diamond(px,py,ww+2,hh+2,exploredFog[i]");
 const frontier=draw.indexOf('drawFogFrontier(px,py,ww,hh,x,y,visibleFog,exploredFog)');
 const weather=draw.indexOf('drawAmbientParticles(frameTime);');
 assert.ok(fog>=0&&frontier>fog&&weather>frontier);
 assert.match(draw,/if\(ww>=38\)/);
});
