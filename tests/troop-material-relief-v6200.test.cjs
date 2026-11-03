'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const svg=fs.readFileSync(path.join(__dirname,'..','assets','cronicas_tropas_atlas.svg'),'utf8');
const markers=[...svg.matchAll(/<g data-frame="(\d)-(\d)-(\d)"[^>]*>/g)];
const frames=markers.map((m,i)=>({
 era:Number(m[1]),kind:Number(m[2]),pose:Number(m[3]),
 body:svg.slice(m.index,i+1<markers.length?markers[i+1].index:svg.lastIndexOf('</svg>'))
}));
test('troop atlas preserves all 32 clipped 64x112 historical animation frames',()=>{
 assert.match(svg,/<svg[^>]*width="256"[^>]*height="896"/);
 assert.equal(frames.length,32);
 for(let era=0;era<4;era++)for(let kind=0;kind<2;kind++)for(let pose=0;pose<4;pose++){
  const matches=frames.filter(f=>f.era===era&&f.kind===kind&&f.pose===pose);
  assert.equal(matches.length,1,'missing or duplicated frame '+[era,kind,pose].join('-'));
  assert.ok(matches[0].body.includes('transform="translate('+(pose*64)+' '+((era*2+kind)*112)+')"'));
  assert.match(matches[0].body,/clip-path="url\(#troopFrameClip\)"/);
 }
});
test('cloth lighting and fold contours exist on every moving infantry frame',()=>{
 for(const frame of frames){
  assert.equal((frame.body.match(/data-detail="torso-relief"/g)||[]).length,1);
  assert.match(frame.body,/M25 49 Q27 53 29 57/);
 }
});
test('warriors have layered cuirasses and shield edge relief across all poses',()=>{
 for(const frame of frames.filter(f=>f.kind===0)){
  assert.equal((frame.body.match(/data-detail="warrior-plate"/g)||[]).length,1);
  assert.equal((frame.body.match(/data-detail="shield-relief"/g)||[]).length,1);
  assert.match(frame.body,/M15 60 Q12 68 16 74/);
 }
});
test('archers have strapped equipment and buckles without warrior shields',()=>{
 for(const frame of frames.filter(f=>f.kind===1)){
  assert.equal((frame.body.match(/data-detail="archer-harness"/g)||[]).length,1);
  assert.doesNotMatch(frame.body,/data-detail="shield-relief"/);
  assert.match(frame.body,/M26 47 Q3[01] 5[23] 38 57/);
 }
});
test('period-specific metal and leather colors are present in every pose',()=>{
 const plateColors=['#977450','#bc8850','#a5bbc1','#829fac'];
 const strapColors=['#65452f','#6d4130','#455962','#3d5460'];
 const crestColors=['#e6c989','#f1d083','#f2d48b','#e9d79d'];
 for(const frame of frames){
  const color=frame.kind===0?plateColors[frame.era]:strapColors[frame.era];
  assert.ok(frame.body.includes('fill="'+color+'"'),[frame.era,frame.kind,frame.pose].join('-'));
  if(frame.kind===0)assert.ok(frame.body.includes('fill="'+crestColors[frame.era]+'"'));
 }
});
test('SVG stays self-contained, free of external references and within mobile payload budget',()=>{
 assert.doesNotMatch(svg,/<(?:script|image|foreignObject|iframe|use)\b/i);
 assert.doesNotMatch(svg,/(?:href|xlink:href)="(?:https?:|data:)/i);
 assert.ok(Buffer.byteLength(svg,'utf8')<155000);
});
test('added SVG groups remain well nested and self-closing where expected',()=>{
 const stack=[];
 for(const match of svg.matchAll(/<\/?([a-zA-Z][\w:.-]*)\b[^>]*>/g)){
  const tag=match[1],token=match[0];
  if(token.startsWith('</'))assert.equal(stack.pop(),tag);
  else if(!token.endsWith('/>'))stack.push(tag);
 }
 assert.deepEqual(stack,[]);
});
