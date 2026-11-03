const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const start = html.indexOf('function drawMeadowGrassTufts(');
const end = html.indexOf('function drawMeadowFlowers(', start);
const grass = html.slice(start, end);

test('meadow grass remains integrated into visible, unobstructed tiles', () => {
 assert.ok(start >= 0 && end > start);
 assert.match(html, /visibleFog\[y\*W\+x\].*?!structures\.has\(key\(x,y\)\).*?!roadTiles\.has\(key\(x,y\)\)/);
 assert.match(html, /drawMeadowGrassTufts\(px,py,ww,hh,x,y,b,forestSeason\(\)\)/);
});
test('grass contact shadows use a zoom threshold', () => {
 assert.match(grass, /if\(ww>=92\)\s*\{/);
 assert.match(grass, /ctx\.ellipse\(gx\+size\*\.12,gy\+size\*\.11,size\*1\.12,size\*\.24,-\.12,0,Math\.PI\*2\)/);
 assert.match(grass, /ctx\.fill\(\)/);
});
test('grass rendering remains deterministic and excludes winter', () => {
 assert.match(grass, /season===3\|\|ww<74/);
 assert.match(grass, /rnd\(x,y,790\)/);
 assert.match(grass, /ctx\.save\(\)/);
 assert.match(grass, /ctx\.restore\(\)/);
});
