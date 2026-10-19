import test from 'node:test';
import assert from 'node:assert/strict';
import { DemoRunner } from '../assets/js/runner.mjs';
import { createPlan, DEFAULT_GOAL, DEFAULT_SKILLS } from '../assets/js/plan.mjs';
const tick=()=>new Promise(resolve=>setTimeout(resolve,12));
test('approval suspends the run, with no CRM completion until an explicit decision',async()=>{
 const events=[];let release;
 const approval=new Promise(resolve=>{release=resolve;});
 const runner=new DemoRunner({duration:()=>1,onChange:e=>{events.push(e);if(e.stage==='approval')release();}});
 const run=runner.run(createPlan(DEFAULT_SKILLS,DEFAULT_GOAL));await approval;
 assert.equal(events.at(-1).stage,'approval');assert.ok(!events.some(e=>e.step.id==='crm'));
 await tick();assert.equal(events.at(-1).stage,'approval');
 runner.approve();await run;
 assert.equal(events.at(-1).stage,'complete');assert.ok(events.some(e=>e.step.id==='crm'&&e.statuses[e.index]==='complete'));
});
test('blocked CRM is never completed and does not invent an approval',async()=>{
 const events=[];const runner=new DemoRunner({duration:()=>1,onChange:e=>events.push(e)});
 await runner.run(createPlan(['mail','crm'],DEFAULT_GOAL));
 assert.equal(events.at(-1).statuses[1],'blocked');assert.ok(!events.some(e=>e.stage==='approval'));
});
test('cancel during approval releases the waiting run without stale completion',async()=>{
 const events=[];let waiting;
 const pause=new Promise(resolve=>{waiting=resolve;});
 const runner=new DemoRunner({duration:()=>1,onChange:e=>{events.push(e);if(e.stage==='approval')waiting();}});
 const run=runner.run(createPlan(DEFAULT_SKILLS,DEFAULT_GOAL));await pause;runner.cancel();await run;runner.approve();
 assert.ok(!events.some(e=>e.stage==='complete'));
});
test('replay and replacing a running animation cannot interleave stale output',async()=>{
 const events=[];const runner=new DemoRunner({duration:()=>2,onChange:e=>events.push(e)});
 const old=runner.run(createPlan(DEFAULT_SKILLS,DEFAULT_GOAL));
 const next=runner.run(createPlan(['mail'],DEFAULT_GOAL));await Promise.all([old,next]);
 assert.equal(events.filter(e=>e.stage==='complete').length,1);
 await runner.run(createPlan(['mail'],DEFAULT_GOAL));assert.equal(events.filter(e=>e.stage==='complete').length,2);
 assert.ok(!events.some(e=>e.stage==='approval'));
});
