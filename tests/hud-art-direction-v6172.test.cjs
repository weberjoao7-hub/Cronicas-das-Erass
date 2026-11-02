'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)?.[1]||'';
const script=html.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
test('v6.172: HTML mantém o motor JavaScript válido e o save existente',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
});
test('HUD utiliza superfícies e contornos de leitura RTS sem imagens externas',()=>{
 assert.match(css,/--rts-gold:/);
 assert.match(css,/header\{[^}]*linear-gradient/);
 assert.match(css,/nav\{[^}]*linear-gradient/);
 assert.match(css,/#panel\{[^}]*linear-gradient/);
 assert.match(css,/#minimap\{[^}]*border:3px solid/);
 assert.doesNotMatch(css,/url\(https?:/);
});
test('controles e painel preservam os identificadores de interação',()=>{
 for(const id of ['world','minimap','panel','home','build','army','help','zoom','cancelPlacement'])
  assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(css,/button\{[^}]*touch-action:manipulation/);
 assert.match(css,/button:focus-visible/);
});
test('iPhone pequeno respeita safe area e alvos de toque de 44 pixels',()=>{
 assert.match(css,/@media\(max-width:410px\)/);
 assert.match(css,/nav button\{[^}]*min-height:44px/);
 assert.match(css,/env\(safe-area-inset-bottom\)/);
 assert.match(css,/env\(safe-area-inset-top\)/);
});
test('desktop, paisagem e movimento reduzido possuem regras próprias',()=>{
 assert.match(css,/@media\(min-width:750px\)/);
 assert.match(css,/@media\(max-height:500px\)/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(css,/#panel\{[^}]*max-height:55dvh/);
});
test('CSS adicionado mantém delimitadores balanceados',()=>{
 let braces=0;
 for(const char of css){if(char==='{')braces++;else if(char==='}')braces--;assert.ok(braces>=0)}
 assert.equal(braces,0);
});
