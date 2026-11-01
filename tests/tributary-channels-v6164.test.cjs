'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script,'inline game script');
const maskStart=script.indexOf('const tributaryMask=new Uint8Array(W*H)');
const maskEnd=script.indexOf('let game=',maskStart);
const drawStart=script.indexOf('function drawTributary(');
const drawEnd=script.indexOf('function drawBiomeSeam(',drawStart);
assert.ok(maskStart>0&&maskEnd>maskStart&&drawStart>0&&drawEnd>drawStart);
const networkSource=script.slice(maskStart,maskEnd);
const drawSource=script.slice(drawStart,drawEnd);
const terrainSource=script.slice(script.indexOf('const rnd='),script.indexOf('// Máscaras de margem'));
const directions=[[0,-1],[1,0],[0,1],[-1,0]];
const rnd=(x,y,z=0)=>{const n=Math.sin(x*127.1+y*311.7+z*78.233)*43758.5453;return n-Math.floor(n)};
const makeNetwork=()=>new Function('W','H','seamDirs',terrainSource+networkSource+'return {tributaryMask,tributaryCount,terrain};')(160,160,directions);
function paint(mask=5,width=82,season=1,now=10000){
 const calls=[],styles=[];
 const ctx=new Proxy({},{get(o,k){return k in o?o[k]:(...args)=>{
  for(const value of args)if(typeof value==='number')assert.ok(Number.isFinite(value),'Canvas '+k);
  calls.push([k,...args]);
 }},set(o,k,v){o[k]=v;if(k==='strokeStyle'||k==='fillStyle')styles.push(v);if(k==='globalAlpha')calls.push(['alpha',v]);return true;}});
 const draw=new Function('ctx','rnd',drawSource+'return drawTributary;')(ctx,rnd);
 const count=draw(100,120,width,width*.51,12,18,mask,season,now);
 return {count,calls,styles};
}

test('v6.164 compiles without changing the persistent save format',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/Crônicas das Eras v6\.164/);
 assert.match(script,/cronicas-v04/);
 assert.doesNotMatch(networkSource+drawSource,/localStorage|Math\.random|assignRoute\(|game\.buildings/);
});

test('tributaries are deterministic, bounded, and avoid impassable mountains',()=>{
 const a=makeNetwork(),b=makeNetwork();
 assert.equal(a.tributaryCount,24);
 assert.deepEqual(a.tributaryMask,b.tributaryMask);
 let tiles=0;
 for(let i=0;i<a.tributaryMask.length;i++)if(a.tributaryMask[i]){
  tiles++;
  assert.ok(a.terrain[i]>=1&&a.terrain[i]<=4,'land stream tile');
 }
 assert.ok(tiles>=80&&tiles<=240,'sparse tributary coverage');
});

test('each non-lake channel edge joins its neighbor reciprocally',()=>{
 const {tributaryMask:mask,terrain}=makeNetwork(),W=160;
 let outletCount=0;
 for(let y=1;y<159;y++)for(let x=1;x<159;x++){
  const flags=mask[y*W+x];if(!flags)continue;
  const degree=directions.filter((_,d)=>flags&(1<<d)).length;
  assert.ok(degree<=2,'no disconnected junction');
  for(let d=0;d<4;d++)if(flags&(1<<d)){
   const [dx,dy]=directions[d],nx=x+dx,ny=y+dy,neighbor=ny*W+nx;
   if(terrain[neighbor]===0){outletCount++;continue;}
   assert.ok(mask[neighbor]&(1<<((d+2)%4)), 'continuous edge at '+x+','+y);
  }
 }
 assert.equal(outletCount,24,'one lake outlet per tributary');
});

test('LOD skips distant zoom, empty masks, and invalid geometry',()=>{
 assert.equal(paint(0).count,0);
 assert.equal(paint(5,30).count,0);
 assert.equal(paint(5,80).count,1);
 assert.equal(paint(1,80).count,1);
 assert.equal(paint(15,80).count,1);
});

test('channel is clipped, layered, finite and preserves Canvas state',()=>{
 const {calls,styles}=paint(5,82);
 assert.equal(calls.filter(x=>x[0]==='save').length,1);
 assert.equal(calls.filter(x=>x[0]==='restore').length,1);
 assert.equal(calls.filter(x=>x[0]==='clip').length,1);
 assert.ok(calls.filter(x=>x[0]==='stroke').length>=4);
 assert.ok(calls.some(x=>x[0]==='quadraticCurveTo'));
 assert.ok(styles.includes('#397b8b'),'water center');
 assert.ok(styles.includes('#897f58'),'bank rim');
});

test('winter freezes tributaries and summer ripples animate',()=>{
 const summer=paint(5,82,1,10000),later=paint(5,82,1,12000),winter=paint(5,82,3,10000);
 assert.notDeepEqual(summer,later);
 assert.deepEqual(winter,paint(5,82,3,12000));
 assert.ok(winter.styles.includes('#a8c9d1'));
 assert.ok(winter.styles.includes('#e7f3ef'));
 assert.ok(summer.calls.filter(x=>x[0]==='ellipse').length>winter.calls.filter(x=>x[0]==='ellipse').length);
});

test('streams draw above terrain but below roads and structures, with existing fog culling',()=>{
 const base=script.indexOf('ctx.drawImage(tileArt[b]');
 const stream=script.indexOf('if(tributaryMask[y*W+x]&&b!==0)drawTributary(');
 const road=script.indexOf('if(roadTiles.has(key(x,y)))drawRoad(',stream);
 const building=script.indexOf('if(obj&&obj.buildLeft){drawConstructionSite',stream);
 assert.ok(base>0&&stream>base&&road>stream&&building>road);
 assert.match(script.slice(base-300,base),/if\(!exploredFog\[y\*W\+x\]\)continue/);
});
