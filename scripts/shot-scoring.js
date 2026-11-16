const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args:['--disable-gpu','--no-zygote','--disable-dev-shm-usage'] });
 const p = await b.newPage({viewport:{width:1440,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:4174/?vue=spee&page=qualification&demande=D1',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(25000);
 const el=p.locator('section', {hasText:'Scoring SPEE Hauts-de-France'}).last(); await el.scrollIntoViewIfNeeded(); await el.screenshot({path:'/tmp/s2.png'});
 console.log('errors', errs.length, errs.slice(0,3).join(' | '));
 await b.close(); })();
