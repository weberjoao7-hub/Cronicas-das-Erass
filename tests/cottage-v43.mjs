import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const match=html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match,'Script principal não encontrado');
new vm.Script(match[1]);
assert.match(html,/else if\(obj\.t==='Cabana'\)(?:\{)?drawCottage\(/);
assert.match(html,/cronicas-v04/);
const source=match[1].replace(/\}\)\(\);\s*$/,'globalThis.__test={drawCottage};})();');
const calls={fill:0,stroke:0};
const ctx=new Proxy({},{
 get(obj,key){
  if(key==='createImageData')return (w,h)=>({data:new Uint8ClampedArray(w*h*4)});
  if(key==='createLinearGradient'||key==='createRadialGradient')return ()=>({addColorStop(){}});
  if(key==='fill'||key==='stroke')return ()=>{calls[key]++};
  return obj[key]??(()=>{});
 },set(obj,key,value){obj[key]=value;return true}
});
const elements=new Map();
function el(id){
 if(!elements.has(id))elements.set(id,{
  style:{},classList:{add(){},remove(){}},getContext:()=>ctx,
  addEventListener(){},setPointerCapture(){},innerHTML:'',textContent:'',
  getBoundingClientRect:()=>({left:0,top:0,width:116,height:116})
 });
 return elements.get(id);
}
const sandbox={
 Image:class {constructor(){this.complete=true;this.naturalWidth=0;this.src='';}},
 document:{getElementById:el,createElement:()=>({getContext:()=>ctx}),addEventListener(){}},
 localStorage:{getItem:()=>null,setItem(){}},innerWidth:390,innerHeight:844,
 devicePixelRatio:2,addEventListener(){},requestAnimationFrame(){},
 setTimeout:()=>1,clearTimeout(){}
};
vm.runInNewContext(source,sandbox,{timeout:10000});
assert.ok(sandbox.__test?.drawCottage);
const before=calls.fill;
sandbox.__test.drawCottage(180,250,74,38,1,10);
const low=calls.fill-before;
assert.ok(low>15,'Cabana básica deve possuir geometria detalhada');
sandbox.__test.drawCottage(180,250,74,38,3,10);
assert.ok(calls.fill-before-low>low,'Nível 3 deve adicionar anexos');
assert.ok(calls.stroke>20,'Madeiramento e telhas devem ser desenhados');
console.log('Cottage OK: sintaxe, renderização, níveis e salvamento');
