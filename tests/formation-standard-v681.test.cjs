'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const script=html.split('<script>')[1].split('</script>')[0];
const start=script.indexOf('// Estandarte isométrico:');
const end=script.indexOf('function drawUnitGroundShadow(',start);
assert.ok(start>=0&&end>start,'formation standard anchors');
const source=script.slice(start,end);
function harness(){
 const calls=[],styles=[],state={};
 const ctx=new Proxy(state,{get(o,k){return k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));calls.push([k,...args]);}},set(o,k,v){o[k]=v;if(k==='fillStyle')styles.push(v);return true}});
 const api=new Function('ctx','isMilitary',source+';return {selectFormationStandardLeader,drawFormationStandard};')(ctx,k=>['warrior','archer','cavalry','cannon'].includes(k));
 return {api,calls,styles};
}
const troop=(x,y,kind='warrior',hp=100)=>({x,y,kind,hp});
test('JavaScript parses and save schema remains v04',()=>{
 assert.doesNotThrow(()=>new Function(script));
 assert.match(html,/<title>Crônicas das Eras v6\.\d+<\/title>/);
 assert.match(script,/localStorage\.getItem\('cronicas-v04'\)/);
 assert.doesNotMatch(source,/localStorage|game\.units\s*=|game\.buildings\s*=/);
});
test('a compact selection receives exactly one central leader',()=>{
 const {api}=harness(),a=[troop(4,4),troop(5,4,'archer'),troop(4,5,'cannon'),troop(5,5,'cavalry')];
 assert.ok(a.includes(api.selectFormationStandardLeader(a,new Set(a),()=>true)));
 assert.equal(api.selectFormationStandardLeader(a,new Set(a.slice(0,2)),()=>true),null);
});
test('fog, dead troops, stale references, civilians and distant groups are rejected',()=>{
 const {api}=harness(),a=[troop(4,4),troop(5,4),troop(4,5)];
 assert.equal(api.selectFormationStandardLeader(a,new Set(a),()=>false),null);
 assert.equal(api.selectFormationStandardLeader(a,new Set([a[0],a[1],troop(6,6)]),()=>true),null);
 const dead=[a[0],troop(5,4,'warrior',0),a[2]];
 assert.equal(api.selectFormationStandardLeader(dead,new Set(dead),()=>true),null);
 const civilians=a.map(u=>({...u,kind:'worker'}));
 assert.equal(api.selectFormationStandardLeader(civilians,new Set(civilians),()=>true),null);
 const far=[troop(1,1),troop(22,22),troop(45,45)];
 assert.equal(api.selectFormationStandardLeader(far,new Set(far),()=>true),null);
});
test('four eras, waving cloth, finite geometry and zoom LOD',()=>{
 const low=harness();assert.equal(low.api.drawFormationStandard(180,120,.6,1,1200),0);assert.equal(low.calls.length,0);
 for(const [era,color] of [[0,'#9a7046'],[3,'#9a4040'],[5,'#784038'],[7,'#346e87']]){
  const scene=harness();assert.equal(scene.api.drawFormationStandard(180,120,1,era,1200),1);assert.ok(scene.styles.includes(color));
 }
 const a=harness(),b=harness();a.api.drawFormationStandard(180,120,1,7,1200);b.api.drawFormationStandard(180,120,1,7,2400);
 assert.notDeepEqual(a.calls,b.calls);
});
test('leader is chosen once per draw, banner painted behind unit sprite',()=>{
 assert.match(script,/formationStandardLeader=selectFormationStandardLeader\(game\.units,selectedGroup,visibleAt\)/);
 assert.match(script,/if\(!enemy&&u===formationStandardLeader\)drawFormationStandard\(px,py,z,game\.era,now\);\s*drawUnitSprite\(u,px,py,z,enemy\)/);
 assert.equal((script.match(/drawFormationStandard\(px,py,z,game\.era,now\)/g)||[]).length,1);
});
