const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const start = source.indexOf('function drawMeadowFlowers(');
const end = source.indexOf('\nfunction draw(){', start);
const renderer = source.slice(start, end);
test('meadow flowers have close-zoom petals and a contrasting centre', () => {
  assert.ok(start >= 0 && end > start);
  assert.match(renderer, /ww>=92&&season!==2/);
  assert.match(renderer, /p<4/);
  assert.match(renderer, /ctx\.fillStyle='#e8b85d'/);
});
test('distant and autumn flowers retain lightweight circular rendering', () => {
  assert.match(renderer, /else\{ctx\.beginPath\(\);ctx\.arc\(fx,fy,r/);
  assert.match(renderer, /season===3/);
});
test('close zoom adds leaves without changing tile placement', () => {
  assert.match(renderer, /ctx\.ellipse\(fx-r\*\.55/);
  assert.match(renderer, /Math\.abs\(ox\)\/\(ww\*\.5\)/);
});
