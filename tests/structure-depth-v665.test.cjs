'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.indexOf('</script>'));
const helperSource=script.match(/function unitBehindStructure\(u,x,y\)\{[^}]+\}/)?.[0];
const behind=helperSource?new Function(helperSource+';return unitBehindStructure')():null;

test('v6.65 mantém script válido e salvamento anterior',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(script,/localStorage\.setItem\('cronicas-v04'/);
 assert.match(html,/<title>Crônicas das Eras v6\.65<\/title>/);
});
test('personagens atrás da construção são ocultados; os da frente permanecem visíveis',()=>{
 assert.equal(typeof behind,'function');
 const actors=[{u:{x:20.1,y:30.2},enemy:false},{u:{x:20.5,y:30.5},enemy:true},{u:{x:20.8,y:30.8},enemy:false}];
 const back=actors.filter(({u})=>behind(u,20,30));
 const front=actors.filter(({u})=>!behind(u,20,30));
 assert.deepEqual(back,actors.slice(0,2));
 assert.deepEqual(front,actors.slice(2));
 assert.equal(back.length+front.length,actors.length);
});
test('obras e edifícios desenhados entre tropas atrás e à frente',()=>{
 const back=script.indexOf('if(behind.length)drawTileOccupants(');
 const construction=script.indexOf('if(obj&&obj.buildLeft){drawConstructionSite(');
 const front=script.indexOf('else if(structureActors)drawTileOccupants(');
 assert.ok(back>0&&back<construction&&construction<front);
 assert.match(script,/const structureActors=obj\?tileActors\(x,y,unitTiles,enemyTiles\):null/);
 assert.match(script,/else drawTileOccupants\(x,y,unitTiles,enemyTiles,z,frameTime\);/);
});
test('florestas preservam intercalamento próprio e inimigos respeitam névoa',()=>{
 assert.match(script,/if\(forestCount\)drawForestOccupiedTile\(/);
 assert.match(script,/if\(visibleFog\[y\*W\+x\]\)for\(const u of enemyTiles\.get\(id\)\|\|\[\]\)/);
});
