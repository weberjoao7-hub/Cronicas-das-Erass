'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script);
const start=script.indexOf('function minimapSelectionMarkers(');
const end=script.indexOf('\nfunction resize(){',start);
assert.ok(start>=0&&end>start);
const source=script.slice(start,end);
const markers=new Function(source+'return minimapSelectionMarkers;')();
const a={x:80.5,y:80.5,hp:100,kind:'warrior',path:[{x:85.5,y:85.5}]};
const b={x:81.5,y:81.5,hp:100,kind:'archer',path:[{x:95.5,y:95.5}]};
test('v6.188: sintaxe, versao e persistencia',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.ok(Number(html.match(/<title>Crônicas das Eras v6\.(\d+)<\/title>/)?.[1])>=188);
 assert.match(script,/cronicas-v04/);
});
test('marcadores so incluem tropas selecionadas e visiveis',()=>{
 const found=markers([a,b],new Set([a,b]),null,(x,y)=>x<90);
 assert.equal(found.length,2);
 assert.deepEqual(found[0].destination,{x:85.5,y:85.5});
 assert.equal(found[1].destination,null);
 assert.deepEqual(markers([a,b],new Set([a,b]),null,()=>false),[]);
});
test('unidade ativa funciona sem selecao de grupo',()=>{
 const found=markers([a,b],new Set(),a,()=>true);
 assert.equal(found.length,1);
 assert.equal(found[0].kind,'warrior');
 assert.deepEqual(markers([a,b],new Set(),null,()=>true),[]);
});
test('limite e entradas invalidas preservam a responsividade',()=>{
 const units=Array.from({length:50},(_,i)=>({x:i,y:i,hp:100,kind:'warrior'}));
 assert.equal(markers(units,new Set(units),null,()=>true).length,24);
 assert.equal(markers(units,new Set(units),null,()=>true,4).length,4);
 assert.equal(markers(units,new Set(units),null,()=>true,-1).length,0);
 assert.deepEqual(markers(null,new Set(),null,()=>true),[]);
 assert.deepEqual(markers([a],new Set([{...a}]),null,()=>true),[]);
});
test('renderizacao ocorre depois da nevoa e sem alterar Canvas global',()=>{
 const mini=script.slice(script.indexOf('function drawMinimap(){'),script.indexOf('\nfunction resize(){'));
 assert.ok(mini.indexOf('mc.drawImage(fogCanvas,0,0)')<mini.indexOf('drawMinimapSelectionOverlay();'));
 assert.match(source,/mc\.save\(\)/);
 assert.match(source,/mc\.restore\(\)/);
 assert.doesNotMatch(source,/localStorage|game\.units\.push|game\.buildings\.push|Math\.random/);
});
