const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args:['--disable-gpu','--no-zygote','--disable-dev-shm-usage'] });
 const p = await b.newPage({viewport:{width:1440,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:4175/?vue=spee&page=financement',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(2500);
 await p.click('text=Lot 3 · M. Descamps'); await p.waitForTimeout(1500);
 await p.screenshot({path:'/tmp/l1.png'});
 const ins=p.locator('section',{hasText:'Instruction financière'}).last(); await ins.scrollIntoViewIfNeeded(); await ins.screenshot({path:'/tmp/l2.png'});
 console.log('errors', errs.length, errs.slice(0,3).join(' | '));
 await b.close(); })();
