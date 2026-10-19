import test from 'node:test';
import assert from 'node:assert/strict';
import { SKILLS, DEFAULT_SKILLS, DEFAULT_GOAL, createPlan } from '../assets/js/plan.mjs';
test('default example follows the requested coherent workflow',()=>{
 const p=createPlan(DEFAULT_SKILLS,DEFAULT_GOAL);
 assert.deepEqual(p.steps.map(s=>s.id),['mail','search','classify','approval','crm','complete']);
 assert.deepEqual(p.limitations,[]);assert.equal(p.incomplete,false);
});
test('every non-empty combination includes exactly the chosen skills and a truthful summary',()=>{
 for(let mask=1;mask<2**SKILLS.length;mask++){
  const selected=SKILLS.filter((_,index)=>mask&(1<<index)).map(s=>s.id),p=createPlan(selected,DEFAULT_GOAL);
  assert.deepEqual(new Set(p.steps.slice(0,-1).map(s=>s.id)),new Set(selected));
  const crm=p.steps.find(s=>s.id==='crm');
  if(crm){assert.equal(crm.blocked,!['mail','search','approval'].every(s=>selected.includes(s)));if(!crm.blocked)assert.ok(p.steps.findIndex(s=>s.id==='approval')<p.steps.findIndex(s=>s.id==='crm'));}
  assert.equal(p.incomplete,p.steps.some(s=>s.blocked));
  assert.equal(p.steps.at(-1).title,p.incomplete?'Review the gaps':'Task completed');
 }
});
test('missing input and approval are explicit, never fabricated',()=>{
 const p=createPlan(['crm'],DEFAULT_GOAL);assert.ok(p.steps[0].blocked);
 assert.deepEqual(p.steps[0].missing,['mail','search','approval']);assert.ok(p.limitations.join(' ').includes('No email source'));
 assert.ok(p.steps.at(-1).output.includes('Blocked steps were not simulated'));
});
test('draft without record lookup stays a general unsent acknowledgement',()=>{
 const p=createPlan(['mail','draft'],DEFAULT_GOAL);assert.ok(p.limitations.some(x=>x.includes('general acknowledgement')));assert.ok(p.steps.find(s=>s.id==='draft').output.includes('Nothing is sent'));
});
test('goal is a label, with no semantic or HTML execution',()=>{
 const goal='<img src=x onerror=alert(1)>',p=createPlan(DEFAULT_SKILLS,goal);
 assert.equal(p.goal,goal);assert.deepEqual(p.steps,createPlan(DEFAULT_SKILLS,DEFAULT_GOAL).steps);
});
test('invalid and empty configuration is rejected',()=>{
 for(const goal of ['', '   ', 'x'.repeat(161), null])assert.throws(()=>createPlan(DEFAULT_SKILLS,goal));
 assert.throws(()=>createPlan([],DEFAULT_GOAL));assert.throws(()=>createPlan(['unknown'],DEFAULT_GOAL));
});
test('plans are deterministic, independent and do not mutate selections',()=>{
 const selected=new Set(DEFAULT_SKILLS),a=createPlan(selected,DEFAULT_GOAL),b=createPlan(selected,DEFAULT_GOAL);
 assert.deepEqual(a,b);a.steps[0].title='changed';assert.notEqual(a.steps[0].title,b.steps[0].title);assert.deepEqual([...selected],DEFAULT_SKILLS);
});

test('approval without CRM or lookup never fabricates a customer record change',()=>{
 const p=createPlan(['mail','approval'],DEFAULT_GOAL);
 assert.ok(!p.steps.find(s=>s.id==='approval').output.includes('C-1042'));
 assert.ok(p.steps.find(s=>s.id==='approval').output.includes('no live action'));
});
