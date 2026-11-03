'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const svg=fs.readFileSync(path.join(__dirname,'../assets/cronicas_aldeoes_atlas.svg'),'utf8');
const frames=svg.match(/<g transform="translate\([^"]+\)">[\s\S]*?<\/g>/g)||[];

test('v6.198: six animated villager frames retain the 56x104 atlas grid',()=>{
 assert.match(svg,/<svg[^>]+width="336" height="104" viewBox="0 0 336 104"/);
 assert.equal(frames.length,6);
 assert.equal((svg.match(/<\/g>/g)||[]).length,6);
 for(let i=0;i<6;i++){
  assert.match(frames[i],/v6\.198: layered diagonal harness/);
  assert.match(frames[i],/v6\.198: woven hat crown/);
  assert.match(frames[i],/embroidered hem and brass fastening/);
  assert.match(frames[i],/stroke="#e3c38c"/);
  assert.match(frames[i],/stroke="#d3a46b"/);
  assert.match(frames[i],/fill="#cba660"/);
  assert.match(frames[i],/fill="#d4b272"/);
 }
});

test('v6.198: costume relief remains lightweight and vector-only',()=>{
 assert.ok(svg.length<40000,'atlas should stay compact for mobile Safari');
 assert.doesNotMatch(svg,/<(?:image|foreignObject|script|animate|filter)\b/i);
 assert.doesNotMatch(svg,/href=|url\(https?:/i);
 for(const name of ['tunic','leather','skin','metal']){
  assert.match(svg,new RegExp('id="'+name+'"'));
 }
});

test('v6.198: SVG elements have balanced tags and quoted attributes',()=>{
 const tags=svg.match(/<\/?[A-Za-z][^>]*>/g)||[];
 const stack=[];
 for(const tag of tags){
  const close=tag.startsWith('</'),self=tag.endsWith('/>');
  const name=tag.match(/^<\/?([A-Za-z][\w:-]*)/)[1];
  if(close)assert.equal(stack.pop(),name,'misnested SVG element: '+tag);
  else if(!self)stack.push(name);
  if(!close)assert.equal((tag.match(/"/g)||[]).length%2,0,'unbalanced attribute quotes');
 }
 assert.deepEqual(stack,[]);
});

test('v6.198: engine still draws all six 56px atlas frames without modifying saves',()=>{
 const game=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 assert.match(game,/paintedVillagers\.src='assets\/cronicas_aldeoes_atlas\.svg'/);
 assert.match(game,/ctx\.drawImage\(paintedVillagers,frame\*56,0,56,104/);
 assert.match(game,/frame=moving\?2\+/);
});
