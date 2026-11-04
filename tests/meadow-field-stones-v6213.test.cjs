const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const start=html.indexOf('function drawMeadowFieldStones(');
const end=html.indexOf('function drawMeadowFlowers(',start);
const source=html.slice(start,end);
test('meadow field stones are defined and rendered on visible unoccupied terrain',()=>{
 assert.ok(start>=0&&end>start);
 assert.match(html,/drawMeadowGrassTufts\(px,py,ww,hh,x,y,b,forestSeason\(\)\);drawMeadowFlowers\(px,py,ww,hh,x,y,b,forestSeason\(\)\);drawMeadowFieldStones\(px,py,ww,hh,x,y,b,forestSeason\(\)\)/);
});
test('stones skip distant zoom and non-meadow biomes',()=>{
 assert.match(source,/b!==1&&b!==2/);
 assert.match(source,/ww<88/);
 assert.match(source,/rnd\(x,y,804\)/);
});
test('stones respect tile footprint, seasonal palette and canvas state',()=>{
 assert.match(source,/Math\.abs\(ox\)/);
 assert.match(source,/season===3/);
 assert.match(source,/season===2/);
 assert.match(source,/ctx\.save\(\)/);
 assert.match(source,/ctx\.restore\(\)/);
});
