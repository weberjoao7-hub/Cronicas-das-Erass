'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const svg=fs.readFileSync(path.join(root,'assets','cronicas_aldeoes_trabalho.svg'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const jobs=['wood','stone','farm','build'];
const markers=[...svg.matchAll(/<g transform="translate\((\d+) 0\)">/g)];
const frames=markers.map((m,i)=>svg.slice(m.index,i+1<markers.length?markers[i+1].index:svg.lastIndexOf('</svg>')));

test('work atlas retains transparent 896x104 layout with sixteen 56px frames',()=>{
 assert.match(svg,/<svg[^>]*width="896"[^>]*height="104"/);
 assert.equal(markers.length,16);
 markers.forEach((m,i)=>assert.equal(Number(m[1]),i*56));
});

test('each of four professions has one workwear layer per animation pose',()=>{
 assert.equal(frames.length,16);
 frames.forEach((frame,i)=>{
  const job=jobs[Math.floor(i/4)];
  assert.equal((frame.match(/data-detail="workwear-(?:wood|stone|farm|build)"/g)||[]).length,1);
  assert.ok(frame.includes('data-detail="workwear-'+job+'"'));
  assert.equal((frame.match(/data-detail="profession-hat-/g)||[]).length,1);
  assert.ok(frame.includes('data-detail="profession-hat-'+job+'"'));
  assert.match(frame,new RegExp('Animated '+job+' pose '+(i%4)));
 });
});

test('woodcutters have visible leather harness, hatband and carved wedge',()=>{
 for(const frame of frames.slice(0,4)){
  assert.match(frame,/data-detail="workwear-wood"/);
  assert.match(frame,/M22 43 Q29 49 36 60/);
  assert.match(frame,/fill="#65452e"/);
  assert.match(frame,/stroke="#b77d46"/);
 }
});

test('masons have stone apron and metal shoulder reinforcement',()=>{
 for(const frame of frames.slice(4,8)){
  assert.match(frame,/data-detail="workwear-stone"/);
  assert.match(frame,/fill="#65706d"/);
  assert.match(frame,/fill="#6d7772"/);
  assert.match(frame,/stroke="#7b8988"/);
 }
});

test('farmers and builders have distinguishable work tools and textile colors',()=>{
 for(const frame of frames.slice(8,12)){
  assert.match(frame,/data-detail="workwear-farm"/);
  assert.match(frame,/fill="#58714a"/);
  assert.match(frame,/stroke="#d6b96e"/);
 }
 for(const frame of frames.slice(12,16)){
  assert.match(frame,/data-detail="workwear-build"/);
  assert.match(frame,/fill="#9a6c43"/);
  assert.match(frame,/stroke="#d3c6a4"/);
 }
});

test('SVG remains balanced, self-contained and within mobile asset budget',()=>{
 assert.doesNotMatch(svg,/<(?:script|image|foreignObject|iframe)\b/i);
 assert.doesNotMatch(svg,/(?:href|xlink:href)="(?:https?:|data:)/i);
 assert.ok(Buffer.byteLength(svg,'utf8')<85000);
 const stack=[];
 for(const m of svg.matchAll(/<\/?([A-Za-z][\w:.-]*)\b[^>]*>/g)){
  if(m[0].startsWith('</'))assert.equal(stack.pop(),m[1]);
  else if(!m[0].endsWith('/>'))stack.push(m[1]);
 }
 assert.deepEqual(stack,[]);
 assert.match(html,/paintedWorkerActions\.src='assets\/cronicas_aldeoes_trabalho\.svg'/);
 assert.match(html,/localStorage\.setItem\('cronicas-v04'/);
});
