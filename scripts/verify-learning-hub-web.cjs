const {chromium}=require('C:/Users/Zwhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const out='E:/英语复习/learning-hub-v1/qa';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const context=await browser.newContext({viewport:{width:1380,height:1050}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400&&r.url().startsWith('http://127.0.0.1:5175'))errors.push(`${r.status()} ${r.url()}`);});
 await page.addInitScript(()=>{const NativeAudio=window.Audio;window.Audio=function(...args){return window.__reviewAudio=new NativeAudio(...args);};});
 await page.goto('http://127.0.0.1:5175/');await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 assert.equal(await page.locator('.product').count(),2);
 await page.screenshot({path:path.join(out,'welcome-desktop.png'),fullPage:true});
 await page.locator('a.product.zoo').click();await page.waitForURL('**/english/index.html');
 await page.locator('#navigation a[href="words.html"]').click();await page.waitForURL('**/english/words.html');
 await page.locator('[data-action="remember"][data-id="zebra"]').click();await page.locator('[data-action="remember"][data-id="zebra"]').click();
 await page.locator('[data-action="speak"]').first().click();await page.waitForFunction(()=>window.__reviewAudio?.currentTime>0);assert.match(await page.evaluate(()=>window.__reviewAudio.src),/\/english\/audio\/.*\.wav$/);
 await page.locator('#navigation a[href="build.html"]').click();await page.waitForURL('**/english/build.html');
 assert.ok(await page.locator('.word-bank').isVisible());await page.goBack();await page.waitForURL('**/english/words.html');
 const storage=await page.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));
 assert.ok(Object.values(storage).some(v=>v.includes('zebra')));
 await page.locator('[data-action="report"]').click();await page.waitForURL('**/english/progress.html');assert.ok(await page.locator('.report-page').isVisible());assert.equal(await page.locator('dialog[open]').count(),0);
 for(const view of ['index','words','build','quiz','chant','story','progress','review']){
  await page.goto(`http://127.0.0.1:5175/english/${view}.html`);await page.waitForSelector('#main > *');assert.ok((await page.locator('#main').innerText()).length>20);
 }
 await page.goto('http://127.0.0.1:5175/bluey/index.html');assert.equal(await page.locator('a.product').count(),2);
 await page.locator('a.product').nth(1).click();await page.waitForURL('**/bluey/reader.html?episode=s03e10');await page.waitForFunction(()=>document.querySelector('#image-status').hidden);
 await page.locator('#play-toggle').click();await page.waitForFunction(()=>document.querySelector('#voice').currentTime>0);await page.locator('#play-toggle').click();
 await page.locator('#next-panel').click();const panel=await page.locator('#panel-chip').innerText();
 await page.locator('.product-nav a').first().click();await page.locator('a.product.bluey').click();await page.locator('a.product').nth(1).click();await page.waitForFunction(()=>document.querySelector('#image-status').hidden);
 assert.equal(await page.locator('#panel-chip').innerText(),panel);
 for(const width of [390,768]){
  await page.setViewportSize({width,height:844});
  for(const [label,route] of [['welcome','/'],['english','/english/index.html'],['words','/english/words.html'],['build','/english/build.html'],['quiz','/english/quiz.html'],['chant','/english/chant.html'],['story','/english/story.html'],['progress','/english/progress.html'],['catalog','/bluey/index.html'],['reader','/bluey/reader.html?episode=s03e10']]){
   await page.goto('http://127.0.0.1:5175'+route);if(label==='reader')await page.waitForFunction(()=>document.querySelector('#image-status').hidden);
   await page.waitForFunction(()=>[...document.images].filter(i=>i.getAttribute('src')).every(i=>i.complete),{},{timeout:5000});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`${label} overflow at ${width}`);
   if(width===390)await page.screenshot({path:path.join(out,label+'-mobile.png'),fullPage:true});
  }
 }
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'functional-review.json'),JSON.stringify({status:'passed',separateActivityPages:8,productEntrances:2,audioPlayback:['English WAV','Bluey original MP3'],navigationAndReturn:true,progressPreserved:true,widths:[1380,768,390],errors,limitation:'Local browser checks only; no physical phone verification.'},null,2));
 await browser.close();console.log('Welcome, two product directories, independent activities, audio, return and progress checks passed.');
})().catch(e=>{console.error(e);process.exit(1)});
