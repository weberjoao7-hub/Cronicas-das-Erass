const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('function drawMeadowGrassTufts(');
const end = source.indexOf('function drawMeadowFlowers(', start);
const grass = source.slice(start, end);
test('meadow tufts retain winter and strategic zoom guards', () => {
 assert.ok(start >= 0 && end > start);
 assert.match(grass, /season===3\|\|ww<74/);
 assert.match(grass, /if\(ww>=110\)/);
});
test('close-up meadow blades use seeded detail and restore canvas state', () => {
 assert.match(grass, /rnd\(x\+i\*7,y-i\*11,793\)/);
 assert.match(grass, /ctx\.ellipse\(gx\+size\*\.2,gy-size\*1\.27/);
 assert.match(grass, /ctx\.restore\(\)/);
});
