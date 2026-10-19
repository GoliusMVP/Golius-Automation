import { chromium } from '@playwright/test';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try {
 const page=await browser.newPage({viewport:{width:1440,height:1100},deviceScaleFactor:1});
 await page.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4174');
 await page.screenshot({path:'docs/screenshots/home-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Generate plan'}).click();await page.waitForTimeout(900);
 await page.locator('[data-builder]').screenshot({path:'docs/screenshots/builder-ready.png'});
 await page.clock.install();await page.locator('#run-animation').click();await page.clock.runFor(6500);
 await page.locator('[data-builder]').screenshot({path:'docs/screenshots/builder-approval.png'});
 await page.locator('#approve-example').click();await page.clock.runFor(4000);
 await page.locator('#builder').screenshot({path:'docs/screenshots/builder-complete.png'});
 const mobile=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await mobile.goto(process.env.PREVIEW_URL || 'http://127.0.0.1:4174');
 await mobile.screenshot({path:'docs/screenshots/home-mobile.png',fullPage:true});
 console.log('Captured desktop, mobile, ready, approval and completion views.');
}finally{await browser.close();}
