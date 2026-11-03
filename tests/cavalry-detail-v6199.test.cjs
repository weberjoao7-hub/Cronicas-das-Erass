'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const svg=fs.readFileSync(path.join(__dirname,'..','assets','cronicas_cavalaria_atlas.svg'),'utf8');
const markers=[...svg.matchAll(/<g data-frame="(\d)-(\d)"[^>]*>/g)];
const frames=markers.map((m,i)=>({era:Number(m[1]),pose:Number(m[2]),body:svg.slice(m.index,i+1<markers.length?markers[i+1].index:svg.lastIndexOf('</svg>'))}));
test('v6.199 retains sixteen 112px frames and transparent atlas geometry',()=>{
 assert.match(svg,/<svg[^>]*width="448"[^>]*height="448"/);
 assert.equal(frames.length,16);
 for(let era=0;era<4;era++)for(let pose=0;pose<4;pose++)
  assert.equal(frames.filter(f=>f.era===era&&f.pose===pose).length,1);
 assert.equal((svg.match(/clip-path="url\(#frameClip\)"/g)||[]).length,16);
});
test('horse relief, mane, tail strands and layered tack occur in every pose',()=>{
 for(const frame of frames)for(const detail of ['coat-relief','mane','tail-strands','tack','era-ornament'])
  assert.ok(frame.body.includes('data-detail="'+detail+'"'),frame.era+'-'+frame.pose+': '+detail);
});
test('tail strands vary across four gallop poses',()=>{
 for(let era=0;era<4;era++){
  const tails=frames.filter(f=>f.era===era).map(f=>f.body.match(/data-detail="tail-strands" d="([^"]+)"/)?.[1]);
  assert.equal(new Set(tails).size,4,'era '+era+' tail poses');
 }
});
test('period-specific tack retains distinct colors and materials',()=>{
 for(const [era,token] of [[0,'#b99560'],[1,'#8e4137'],[2,'#9fb3b8'],[3,'#345c70']])
  for(const f of frames.filter(f=>f.era===era)){
   const ornament=f.body.match(/<g data-detail="era-ornament">([\s\S]*?)<\/g>/)?.[1];
   assert.ok(ornament&&ornament.includes(token),'era '+era+' pose '+f.pose);
  }
});
test('mobile atlas remains self-contained, clipped and under 90 KB',()=>{
 assert.doesNotMatch(svg,/<(?:script|image|foreignObject|iframe|use)\b/i);
 assert.doesNotMatch(svg,/(?:href|xlink:href)="(?:https?:|data:)/i);
 for(const f of frames)assert.match(f.body,/clip-path="url\(#frameClip\)"/);
 assert.ok(Buffer.byteLength(svg,'utf8')<90000);
});