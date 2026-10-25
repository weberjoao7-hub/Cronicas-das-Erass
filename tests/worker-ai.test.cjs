'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(script, 'Inline game script exists');
test('inline JavaScript parses without syntax errors', () => {
  assert.doesNotThrow(() => new Function(script[1]));
});
test('existing save key remains compatible', () => {
  assert.match(script[1], /cronicas-v04/);
});
const begin = script[1].indexOf('function assignWorkers(){');
const end = script[1].indexOf("document.getElementById('home').onclick", begin);
assert.ok(begin >= 0 && end > begin, 'worker AI function exists');
const workerCode = script[1].slice(begin, end);

function simulate(units, occupied = new Set()) {
  const game = { units: structuredClone(units) };
  const run = new Function('game', 'biome', 'passable', 'at', 'key', 'assignRoute', 'W', 'H',
    'let dirty=false;\n' + workerCode + '\nassignWorkers(); return game.units;');
  return run(game,
    (x, y) => x === 110 && y === 110 ? 3 : x === 111 && y === 110 ? 4 : 2,
    (x, y) => x >= 0 && y >= 0 && x < 160 && y < 160,
    (x, y) => occupied.has(x + ',' + y),
    (x, y) => x + ',' + y,
    (u, x, y) => { u.tx = x + .5; u.ty = y + .5; u.path = [{ x: u.tx, y: u.ty }]; return true; },
    160, 160);
}
const worker = () => ({ x: 110.5, y: 110.5, kind: 'worker', job: false, path: [] });
const dest = u => u.tx + ',' + u.ty;

test('three villagers choose distinct nearby resource sites away from the old center', () => {
  const units = simulate([worker(), worker(), worker()]);
  assert.equal(new Set(units.map(dest)).size, 3);
  assert.ok(units.every(u => Math.hypot(u.tx - 110.5, u.ty - 110.5) < 8));
});
test('duplicate saved worker destinations are separated', () => {
  const a = { ...worker(), job: true, tx: 110.5, ty: 110.5 };
  const units = simulate([a, { ...a }]);
  assert.notEqual(dest(units[0]), dest(units[1]));
});
test('workers avoid occupied construction tiles', () => {
  const units = simulate([worker()], new Set(['110,110']));
  assert.notEqual(dest(units[0]), '110.5,110.5');
});
test('a builder retains its construction assignment', () => {
  const units = simulate([{ ...worker(), buildTarget: '110,110' }]);
  assert.equal(units[0].buildTarget, '110,110');
  assert.equal(units[0].tx, undefined);
});
