const { chromium } = require('playwright');
(async () => { const b = await chromium.launch({ args:['--disable-gpu','--no-zygote','--disable-dev-shm-usage'] });
 const p = await b.newPage({viewport:{width:1440,height:1000}}); const errs=[]; p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:4176/?vue=amo&onglet=lacopro',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(3000);
 const t=p.locator('text=Carte d').first(); if(await t.count()) { await t.click().catch(()=>{}); await p.waitForTimeout(1500); }
 await p.screenshot({path:'/tmp/v1.png'});
 console.log('errors', errs.length, errs.slice(0,3).join(' | '));
 await b.close(); })();
