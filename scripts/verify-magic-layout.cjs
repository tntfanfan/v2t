const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Zwhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const book=JSON.parse(fs.readFileSync('web/bluey-reader/data/s03e10.json','utf8'));
const out=path.resolve('output/S03E10/comic-v3/qa');
for(const page of book.pages){
 assert.equal(page.height,page.imageHeight);
 for(const panel of page.panels){
  assert.deepEqual(panel.rect,panel.imageRect);assert.deepEqual(panel.artRect,panel.imageRect);
  const [x,y,w,h]=panel.imageRect;
  for(const b of panel.bubbles){const [bx,by,bw,bh]=b.visualRect||b.rect;assert.ok(bx>=x&&by>=y&&bx+bw<=x+w&&by+bh<=y+h,`Outside illustration: ${b.id}`);}
 }
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage({viewport:{width:1600,height:1100}});
 await page.goto('http://127.0.0.1:5173/?episode=s03e10#panel-1');await page.locator('#view-page').click();
 for(const p of book.pages){
  await page.evaluate(n=>location.hash='panel-'+n,p.panels[0].number);
  await page.waitForFunction(n=>document.querySelector('#panel-chip').textContent===`第 ${n} 格`,p.panels[0].number);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  await page.locator('#art-stage').screenshot({path:path.join(out,`layout-page-${String(p.number).padStart(2,'0')}.png`),style:'.player-bar{visibility:hidden}'});
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#view-panel').click();
 for(let n=1;n<=72;n++){
  await page.evaluate(n=>location.hash='panel-'+n,n);await page.waitForFunction(n=>document.querySelector('#panel-chip').textContent===`第 ${n} 格`,n);
  await page.evaluate(()=>Promise.all([...document.querySelectorAll('.speech-bubble img')].map(i=>i.decode())));
  const checks=await page.locator('.speech-bubble').evaluateAll(nodes=>nodes.map(e=>({text:e.getAttribute('aria-label'),overflow:e.scrollHeight>e.clientHeight+1||e.scrollWidth>e.clientWidth+1,fontSize:parseFloat(getComputedStyle(e).fontSize),imageLoaded:!!e.querySelector('img')?.naturalWidth})));
  assert.ok(checks.every(c=>!c.overflow&&c.fontSize>=14&&c.imageLoaded),`Mobile text ${n}: ${JSON.stringify(checks)}`);
 }
 await page.evaluate(()=>location.hash='panel-36');await page.waitForFunction(()=>document.querySelector('#panel-chip').textContent==='第 36 格');
 await page.screenshot({path:path.join(out,'mobile-closeup.png'),fullPage:true});
 await browser.close();console.log('Layout regression passed: 189 bubbles within illustrations, 72 mobile panels readable without text overflow.');
})().catch(e=>{console.error(e);process.exit(1)});
