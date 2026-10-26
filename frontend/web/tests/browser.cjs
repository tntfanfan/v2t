const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const runtime=require('../../dev-runtime.cjs'),{chromium}=runtime.load('playwright',path.resolve(__dirname,'..'));
const base=(process.env.WEB_TEST_BASE_URL||'http://127.0.0.1:'+(process.env.PORT||5175)).replace(/\/$/,''),root=path.resolve(__dirname,'..'),out=path.resolve(root,process.env.WEB_TEST_OUTPUT||'../../output/qa/frontend/web');
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch(runtime.browserOptions());
 const context=await browser.newContext({viewport:{width:1380,height:1050},reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[],external=[],checks=[],notes=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base+'/'))external.push(r.url());});
 const screenshot=name=>page.screenshot({path:path.join(out,name+'.png'),fullPage:true});
 const overflow=async label=>assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,label+' overflow');
 try{
  await page.goto(base+'/');assert.equal(await page.locator('a.product').count(),2);
  await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
  await screenshot('welcome-desktop');await overflow('welcome desktop');
  await page.locator('a.product.zoo').click();await page.waitForURL(url=>/^\/english\/(?:index\.html)?$/.test(url.pathname));
  await page.getByRole('heading',{name:'小队长，一起冒险吧！'}).waitFor();
  assert.equal(await page.locator('.unit-tab').count(),10);
  assert.equal(await page.evaluate(()=>SOURCE_UNITS.flatMap(u=>u.words).length),90);
  await screenshot('english-desktop');checks.push('Welcome links to ZZY U0–U9 / 90 words and phrases');
  for(let u=0;u<10;u++){
   await page.locator(`.unit-tab[data-value="${u}"]`).click();
   if(u===0)await page.locator('[data-action="book"]').click();
   assert.equal(await page.locator('.word-card').count(),await page.evaluate(()=>currentUnit().words.length));
   await page.locator('.word-card').first().click();
   await page.waitForFunction(()=>activeAudio&&!activeAudio.paused&&activeAudio.currentTime>.03,null,{timeout:10000});
   const audio=await page.evaluate(()=>({src:activeAudio.src,error:activeAudio.error?.code}));
   assert.ok(audio.src.startsWith(base+'/english/'));assert.equal(audio.error,undefined);
   assert.equal(await page.evaluate(()=>[...document.images].some(i=>i.complete&&!i.naturalWidth)),false);
  }
  checks.push('All 10 units show their full word cards; actual word audio plays in every unit');
  await page.locator('[data-action="home"]').first().click();
  await page.locator('[data-action="recordings"]').click();
  await page.locator('[data-action="audio-tab"][data-index="1"]').click();
  await page.locator('[data-action="lesson"]').first().click();
  await page.waitForFunction(()=>document.querySelector('#lessonAudio').currentTime>.05);
  const track=await page.locator('#lessonAudio').getAttribute('src');
  const range=await context.request.get(new URL(track,base+'/english/').href,{headers:{Range:'bytes=0-127'}});
  if(range.status()===206){assert.equal((await range.body()).length,128);}
  else{
   assert.ok(process.env.WEB_TEST_BASE_URL,'Local server must support byte ranges');
   assert.equal(range.status(),200);assert.ok((await range.body()).length>128);
   notes.push('Remote host returned full audio (HTTP 200) to the Range request; partial-download support was not verified.');
  }
  await page.evaluate(()=>{const audio=document.querySelector('#lessonAudio');audio.currentTime=5;});
  await page.waitForFunction(()=>{const audio=document.querySelector('#lessonAudio');return !audio.seeking&&audio.currentTime>=5&&audio.readyState>=2;});
  checks.push('Textbook audio plays and seeks; HTTP Range behavior recorded separately');
  await page.locator('[data-action="home"]').first().click();
  await page.locator('.unit-tab[data-value="2"]').click();
  await page.locator('[data-action="start"]').click();
  for(let i=0;i<10;i++){
   assert.equal(await page.evaluate(()=>round.index),i);
   const q=await page.evaluate(()=>{const q=round.questions[round.index];return {type:q.type,word:q.word?.w};});
   if(q.type==='hide'){
    await page.locator('[data-action="hide-letters"]').click();
    for(let n=0;n<40&&!await page.evaluate(()=>round.questions[round.index].solved);n++){
     const index=await page.evaluate(()=>{const q=round.questions[round.index];return q.keys.findIndex((ch,i)=>ch===q.target[q.picked.length]&&!q.picked.includes(i));});
     await page.locator(`[data-action="hide-key"][data-index="${index}"]`).click();
    }
   }else if(q.type==='recall'){
    await page.locator('#recallInput').fill(q.word);await page.locator('#recallForm button[type="submit"]').click();
   }else{
    const index=await page.evaluate(()=>{const q=round.questions[round.index];return q.options.findIndex(o=>(o.w||o)===q.answer);});
    await page.locator(`[data-action="answer"][data-index="${index}"]`).click();
   }
   assert.equal(await page.evaluate(()=>round.questions[round.index].solved),true);
   if(q.type==='sentence'){
    await page.locator('[data-action="read-sentence"]').click();
    await page.waitForFunction(()=>activeAudio&&!activeAudio.paused&&activeAudio.currentTime>.03);
   }
   await page.locator('[data-action="next"]').click();
   if(i===2){
    await page.locator('.product-nav a').first().click();await page.locator('a.product.zoo').click();
    await page.locator('[data-action="start"]').click();assert.equal(await page.evaluate(()=>round.index),3);
   }
  }
  assert.equal(await page.evaluate(()=>state.progress[2].rounds),1);
  const stars=await page.locator('#starCount').innerText();
  await page.reload();assert.equal(await page.locator('#starCount').innerText(),stars);
  assert.equal(await page.evaluate(()=>state.dailyByUnit[2].committed),true);
  checks.push('Completed 5 levels / 10 questions, played sentence audio, resumed after leaving, retained progress after refresh');
  await page.locator('[data-action="parents"]').click();
  await page.getByRole('heading',{name:'给爸爸妈妈 · 学习进度'}).waitFor();
  assert.equal(await page.locator('.stats-table tbody tr').count(),10);
  await page.locator('[data-action="close-dialog"]').click();
  for(const width of [360,390,768]){
   await page.setViewportSize({width,height:844});
   await page.goto(base+'/');await overflow(`welcome ${width}`);
   if(width===390)await screenshot('welcome-mobile');
   await page.locator('a.product.zoo').click();await page.locator('.hero-companion').waitFor();await overflow(`English home ${width}`);
   if(width<=600)assert.ok(await page.evaluate(()=>{
    const art=document.querySelector('.hero-companion').getBoundingClientRect();
    const actions=document.querySelector('.hero-actions').getBoundingClientRect();
    return art.top>=actions.bottom;
   }),'Mobile mascot must not overlap the action buttons');
   if(width===390)await screenshot('english-mobile');
   await page.locator('[data-action="book"]').last().click();await overflow(`word cards ${width}`);
   await page.locator('[data-action="home"]').first().click();
   await page.locator('[data-action="recordings"]').click();await overflow(`recordings ${width}`);
   if(width===390)await screenshot('recordings-mobile');
  }
  checks.push('Welcome, English home, word cards and recordings fit 360/390/768/1380 px');
  await page.locator('.product-nav a[href="/bluey/index.html"]').click();assert.equal(await page.locator('a.product').count(),2);
  for(const episode of ['s01e01','s03e10']){
   await page.goto(base+'/bluey/reader.html?episode='+episode);
   await page.waitForFunction(()=>document.querySelector('#image-status').hidden);
   await page.locator('#play-toggle').click();await page.waitForFunction(()=>document.querySelector('#voice').currentTime>.03);
   await page.locator('#play-toggle').click();await overflow('Bluey '+episode);
  }
  await page.locator('.product-nav a[href="/english/index.html"]').click();
  await page.locator('.unit-tab').first().waitFor();
  assert.equal(await page.locator('.unit-tab').count(),10);assert.equal(await page.locator('#starCount').innerText(),stars);
  checks.push('Both Bluey episodes still render/play; cross-product navigation returns to ZZY with progress');
  for(const file of ['words','build','quiz','chant','story','progress','review']){
   await page.goto(base+'/english/'+file+'.html');await page.waitForURL(url=>/^\/english\/(?:index\.html)?$/.test(url.pathname));
  }
  checks.push('All seven old English activity bookmarks redirect to the new product');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  const report={status:'passed',baseUrl:base,version:'2.0.0',checks,errors,external,notes,retainedGameplayVerified:true,limitation:'Isolated desktop browser checks; no migration of progress from other origins.'};
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
