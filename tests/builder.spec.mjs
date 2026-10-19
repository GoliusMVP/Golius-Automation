import { test, expect } from '@playwright/test';
const skill=(page,id)=>page.locator(`.skill-card[data-skill="${id}"]`);
async function generate(page){await page.getByRole('button',{name:'Generate plan'}).click();await expect(page.locator('#run-animation')).toBeEnabled();}
async function runToApproval(page){await page.clock.install();await page.locator('#run-animation').click();await page.clock.runFor(6500);await expect(page.locator('#approve-example')).toBeVisible();}

test('initial state, selection, empty validation and goal safety',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toHaveText('AI agents thatget work done.');
 await expect(page.locator('#run-animation')).toBeDisabled();await expect(page.locator('.skill-card[aria-pressed=true]')).toHaveCount(5);
 await skill(page,'draft').click();await expect(skill(page,'draft')).toHaveAttribute('aria-pressed','true');await skill(page,'draft').click();
 for(const id of ['mail','search','classify','approval','crm'])await skill(page,id).click();
 await page.getByRole('button',{name:'Generate plan'}).click();await expect(page.locator('#config-error')).toContainText('at least one');
 await skill(page,'mail').click();await page.locator('#agent-goal').fill('   ');await page.getByRole('button',{name:'Generate plan'}).click();await expect(page.locator('#agent-goal')).toBeFocused();
 await page.locator('#agent-goal').fill('<img src=x onerror=alert(1)>');await generate(page);await expect(page.locator('#workflow-title')).toHaveText('<img src=x onerror=alert(1)>');await expect(page.locator('#workflow-title img')).toHaveCount(0);
});

test('default plan, approval pause, completion, replay and reset',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');await generate(page);await expect(page.locator('.flow-node')).toHaveCount(6);
 await runToApproval(page);await expect(page.locator('#approve-example')).toBeFocused();await expect(page.locator('.flow-pulse')).toHaveCount(0);await expect(page.locator('.flow-node[data-step="crm"]')).toHaveAttribute('data-status','ready');
 await page.clock.runFor(20000);await expect(page.locator('#workflow-state')).toHaveText('Human approval needed');
 await page.locator('#approve-example').press('Enter');await page.clock.runFor(4000);await expect(page.locator('#builder-completion')).toBeVisible();await expect(page.locator('.flow-node[data-status=complete]')).toHaveCount(6);
 await page.getByRole('button',{name:'Replay animation'}).click();await expect(page.locator('#builder-completion')).toBeHidden();await page.clock.runFor(6500);await expect(page.locator('#approve-example')).toBeVisible();
 await page.getByRole('button',{name:'Reset'}).click();await page.clock.runFor(20000);await expect(page.locator('#workflow-state')).toHaveText('Example preview');await expect(page.locator('#run-animation')).toBeDisabled();await expect(page.locator('#agent-goal')).toHaveValue('Process incoming customer emails');expect(errors).toEqual([]);
});

test('missing approval blocks CRM and explains the limitation',async({page})=>{
 await page.goto('/');await skill(page,'approval').click();await generate(page);
 await expect(page.locator('#plan-notice')).toContainText('Request approval');
 await page.clock.install();await page.locator('#run-animation').click();await page.clock.runFor(15000);
 await expect(page.locator('.flow-node[data-step=crm]')).toHaveAttribute('data-status','blocked');await expect(page.locator('#approve-example')).toBeHidden();await expect(page.locator('#run-status')).toContainText('Blocked steps were not simulated');await expect(page.locator('#workflow-state')).toHaveText('Finished · review gaps');
});

test('configuration changes cancel a suspended run and remove stale controls',async({page})=>{
 await page.goto('/');await generate(page);await runToApproval(page);await skill(page,'draft').click();await page.clock.runFor(30000);await expect(page.locator('#approve-example')).toBeHidden();await expect(page.locator('#workflow-state')).toHaveText('Example preview');await expect(page.locator('#builder-completion')).toBeHidden();await expect(page.locator('#run-animation')).toBeDisabled();
});

test('keyboard navigation and reduced motion preserve a useful workflow',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');
 await skill(page,'draft').focus();await page.keyboard.press('Space');await expect(skill(page,'draft')).toHaveAttribute('aria-pressed','true');
 await generate(page);await expect(page.locator('#run-animation')).toBeFocused();
 await page.clock.install();await page.keyboard.press('Enter');await page.clock.runFor(2000);await expect(page.locator('#approve-example')).toBeVisible();await expect(page.locator('.flow-pulse')).toHaveCount(0);await page.keyboard.press('Enter');await page.clock.runFor(2000);await expect(page.locator('#builder-completion')).toBeVisible();
 expect(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
});

for(const viewport of [{width:1440,height:1100},{width:1024,height:900},{width:768,height:1024},{width:390,height:844},{width:320,height:700}])test(`responsive canvas and no horizontal overflow at ${viewport.width}`,async({page})=>{
 await page.setViewportSize(viewport);await page.goto('/');await generate(page);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 const positions=await page.locator('.flow-node').evaluateAll(nodes=>nodes.map(n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};}));
 expect(positions.every(p=>p.x>=0&&p.x+p.width<=viewport.width)).toBe(true);
 if(viewport.width<=650)expect(positions.every((p,i)=>i===0||p.y>=positions[i-1].y)).toBe(true);
 await expect(page.locator('#flow-connections .flow-path')).toHaveCount(5);
 await page.locator('.flow-node[data-step=search]').click();await expect(page.locator('#sample-output')).toContainText('Northstar Studio');
});

test('demo remains local and legal/sales links resolve honestly',async({page,context})=>{
 const external=[];page.on('request',r=>{if(!r.url().startsWith('http://127.0.0.1:4173/'))external.push(r.url());});
 await page.goto('/');await generate(page);await runToApproval(page);await page.locator('#approve-example').click();await page.clock.runFor(4000);
 expect(external).toEqual([]);expect(await page.evaluate(()=>({local:localStorage.length,session:sessionStorage.length}))).toEqual({local:0,session:0});
 await expect(page.locator('#sales a.button')).toHaveAttribute('href','https://calendly.com/gorovoy-golius/30min');
 await page.getByRole('link',{name:'Impressum',exact:true}).click();await expect(page.getByRole('heading',{name:'Impressum',exact:true})).toBeVisible();await expect(page.locator('.legal-warning')).toContainText('before');
});

test('mobile playback keeps the active approval and its decision in view',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await generate(page);await runToApproval(page);
 await expect(page.locator('.flow-node[data-step=approval]')).toBeInViewport();
 await expect(page.locator('#approve-example')).toBeInViewport();
 await page.locator('#approve-example').click();await page.clock.runFor(4000);await expect(page.locator('#builder-completion')).toBeVisible();
 await page.screenshot({path:'test-results/mobile-complete.png',fullPage:true});
});

test('marketing, contact and legal information remain accessible without JavaScript',async({browser})=>{
 const context=await browser.newContext({javaScriptEnabled:false});const page=await context.newPage();
 try{await page.goto('http://127.0.0.1:4173/');await expect(page.locator('.noscript-note')).toBeVisible();await expect(page.locator('.noscript-note')).toContainText('needs JavaScript');await expect(page.getByRole('heading',{level:1})).toBeVisible();await expect(page.locator('#sales a.button')).toBeVisible();}
 finally{await context.close();}
});
