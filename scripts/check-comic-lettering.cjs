const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Zwhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
 const page=await browser.newPage();const font=fs.readFileSync('web/bluey-reader/design/fonts/patrickhand-PatrickHand-Regular.ttf').toString('base64');
 await page.setContent(`<style>@font-face{font-family:ComicLettering;src:url(data:font/ttf;base64,${font})}</style><main></main>`);
 await page.evaluate(()=>document.fonts.load('28px ComicLettering'));let count=0;const failures=[];
 for(const file of fs.readdirSync('output/S03E10/comic-v3/work/bubbles')){
  await page.locator('main').evaluate((el,svg)=>el.innerHTML=svg,fs.readFileSync(path.join('output/S03E10/comic-v3/work/bubbles',file),'utf8'));
  if(process.argv.includes('--center')){
   const svg=await page.evaluate(()=>{
    const svg=document.querySelector('svg'),ctx=document.createElement('canvas').getContext('2d');ctx.font=svg.querySelector('text').getAttribute('font-size')+'px ComicLettering';
    const lines=[...svg.querySelectorAll('tspan')];let low=Infinity,high=-Infinity;
    for(const t of lines){const m=ctx.measureText(t.textContent),y=Number(t.getAttribute('y'));low=Math.min(low,y-m.actualBoundingBoxAscent);high=Math.max(high,y+m.actualBoundingBoxDescent);}
    const delta=(Number(svg.dataset.bodyTop)+Number(svg.dataset.bodyBottom)-low-high)/2;
    for(const t of lines)t.setAttribute('y',(Number(t.getAttribute('y'))+delta).toFixed(2));
    return svg.outerHTML;
   });
   fs.writeFileSync(path.join('output/S03E10/comic-v3/work/bubbles',file),svg);
  }
  const failed=await page.evaluate(()=>{
   const p=document.querySelector('path');
   const ctx=document.createElement('canvas').getContext('2d');ctx.font=document.querySelector('text').getAttribute('font-size')+'px ComicLettering';ctx.textAlign='center';
   return [...document.querySelectorAll('tspan')].flatMap(t=>{
    const m=ctx.measureText(t.textContent),x=Number(t.getAttribute('x')),y=Number(t.getAttribute('y'));
    const l=x-m.actualBoundingBoxLeft-.4,r=x+m.actualBoundingBoxRight+.4,a=y-m.actualBoundingBoxAscent-.4,z=y+m.actualBoundingBoxDescent+.4;
    return [[l,a],[r,a],[l,z],[r,z]].every(([x,y])=>p.isPointInFill(new DOMPoint(x,y)))?[]:[{text:t.textContent,ink:[l,a,r,z]}];
   });
  });
  if(failed.length)failures.push({file,failed});count++;
 }
 await browser.close();assert.deepEqual(failures,[]);console.log(`Lettering checks passed: all ${count} balloons contain every line's text bounds.`);
})().catch(e=>{console.error(e);process.exit(1)});
