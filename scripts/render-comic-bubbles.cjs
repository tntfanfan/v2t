// Render the vector UI, including its bundled lettering, identically for web and WeChat.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Zwhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require('C:/Users/Zwhao/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
const page=await browser.newPage({viewport:{width:600,height:300},deviceScaleFactor:2});
const font=fs.readFileSync('web/bluey-reader/design/fonts/patrickhand-PatrickHand-Regular.ttf').toString('base64');
await page.setContent(`<style>@font-face{font-family:ComicLettering;src:url(data:font/ttf;base64,${font})}html,body{margin:0;background:transparent}svg{display:block}</style><div id="bubble"></div>`);
await page.evaluate(async()=>{await document.fonts.load('26px ComicLettering');await document.fonts.ready});
const root=path.resolve('output/S03E10/comic-v3');let count=0,bytes=0;
for(const file of fs.readdirSync(path.join(root,'work/bubbles')).filter(f=>f.endsWith('.svg'))){
 await page.locator('#bubble').evaluate((el,svg)=>el.innerHTML=svg,fs.readFileSync(path.join(root,'work/bubbles',file),'utf8'));
 const png=await page.locator('svg').screenshot({omitBackground:true});
 const optimized=await sharp(png).png({palette:true,colours:128,compressionLevel:9,dither:0}).toBuffer();
 fs.writeFileSync(path.join(root,'dist/assets/s03e10/bubbles',file.replace('.svg','.png')),optimized);bytes+=optimized.length;count++;
}
await browser.close();console.log(JSON.stringify({rendered:count,bytes}));
})().catch(e=>{console.error(e);process.exit(1)});
