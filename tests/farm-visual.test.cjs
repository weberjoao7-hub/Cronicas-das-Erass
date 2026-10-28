'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const between=(a,b)=>{const s=html.indexOf(a),e=html.indexOf(b,s+a.length);assert.ok(s>=0&&e>s);return html.slice(s,e)};
const code=between('function drawFarm(','function drawMine(');
function render(zoom,level,now=2500){
 const ops=[],ctx=new Proxy({},{get:(o,k)=>k in o?o[k]:(...args)=>{ops.push([k,...args])},set:(o,k,v)=>(o[k]=v,true)});
 const draw=new Function('ctx','scale',code+';return drawFarm')(ctx,zoom);
 draw(200,180,34*zoom,18*zoom,level,now);
 return ops;
}
test('main browser script parses',()=>assert.doesNotThrow(()=>new Function(html.split('<script>')[1].split('</script>')[0])));
test('isometric fields, 3D granary and irrigation are drawn',()=>{
 const ops=render(1.7,2);
 assert.ok(ops.filter(o=>o[0]==='lineTo').length>80,'field ridges and building geometry');
 assert.ok(ops.some(o=>o[0]==='ellipse'),'crop heads and supplies');
});
test('detail level decreases at distant zoom',()=>{
 const far=render(.55,1),near=render(1.7,1);
 assert.ok(near.length>far.length*2,near.length+' versus '+far.length);
});
test('higher farm level adds grain heads and harvest cart',()=>{
 const low=render(1.7,1),high=render(1.7,3);
 assert.ok(high.length>low.length);
});
test('render is deterministic at fixed animation time',()=>{
 assert.deepEqual(render(1.4,3,2400),render(1.4,3,2400));
});
test('legacy saves and farm dispatch are preserved',()=>{
 assert.ok(html.includes("localStorage.getItem('cronicas-v04')"));
 assert.ok(html.includes("drawFarm(px,py,ww,hh,obj.level,frameTime,game.day,obj.x,obj.y)"));
});
