import puppeteer from 'puppeteer';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import jsQR from 'jsqr';
const base = process.env.AUDIT_BASE_URL || 'http://127.0.0.1:5057';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname), 'Run against an isolated local candidate only.');
const output = process.env.AUDIT_OUTPUT_DIR || '/tmp/myconvertertool-browser-results';
await fs.mkdir(output, {recursive:true});
const readiness = await fetch(base + '/api/blog/posts?limit=1', { signal: AbortSignal.timeout(30000) });
assert.equal(readiness.status, 200, 'Start and seed the isolated candidate before browser testing.');
const browser = await puppeteer.launch({headless:true,timeout:120000,protocolTimeout:120000,args:['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--renderer-process-limit=1']});
const downloadSession=await browser.target().createCDPSession();
await downloadSession.send('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output,eventsEnabled:true});
const browserVersion=await browser.version();
const results=[], errors=[];
const filter=process.env.AUDIT_CHECK_FILTER ? new RegExp(process.env.AUDIT_CHECK_FILTER) : null;
const page=await browser.newPage();
page.setDefaultTimeout(60000); page.setDefaultNavigationTimeout(120000);
page.on('pageerror', error=>errors.push(error.message));
await page.setViewport({width:1440,height:1000});
await page.setRequestInterception(true);
page.on('request', req=>{ if(req.url().startsWith(base) || /^(data:|blob:|about:)/.test(req.url())) req.continue(); else req.abort(); });
const goto=async route=>{ await page.goto(base+route,{waitUntil:'domcontentloaded'}); await page.waitForFunction(()=>document.querySelector('h1') && document.querySelector('title') && document.querySelector('link[rel="canonical"]') && !document.querySelector('[data-initial-seo]')); };
const fill=async (selector,value)=>page.locator(selector).fill(value);
const click=async text=>{
 const clicked=await page.$$eval('button', (buttons, text)=>{ const button=buttons.find(button=>button.textContent.trim()===text || button.textContent.trim().endsWith(text) || button.querySelector('h2')?.textContent===text); if(button && !button.disabled) {button.click();return true;} return false;},text);
 assert.ok(clicked,'Missing or disabled action: '+text);
};
const contains=async text=>page.waitForFunction(text=>document.body.innerText.includes(text),{},text);
const check=async(name,fn)=>{if(filter&&!filter.test(name))return; const before=errors.length; try{await fn();assert.deepEqual(errors.slice(before),[]);results.push({name,status:'PASS'});}catch(error){results.push({name,status:'FAIL',error:error.message});await fs.writeFile(path.join(output,'failure-'+results.length+'.txt'),await page.$eval('body',body=>body.innerText).catch(()=>''));} console.log(JSON.stringify(results.at(-1)));await fs.writeFile(path.join(output,'results.json'),JSON.stringify({browser:browserVersion,complete:false,results,errors},null,2));};
try {
 await check('Base64 UTF-8 encoding and invalid input',async()=>{await goto('/tools/base64-encoder');await fill('textarea','你好 🌍');await click('Encode Data');await contains(Buffer.from('你好 🌍').toString('base64'));await fill('textarea','%%%');await click('Decode String');await contains('Invalid Base64');});
 await check('URL component and Base64 encoding',async()=>{await goto('/tools/url-encoder');await fill('textarea[aria-label="URL input"]','a b&');await click('Execute Transformation');await page.waitForFunction(()=>document.querySelector('textarea[aria-label="URL output"]').value==='a%20b%26');await click('B64 ENC');await fill('textarea[aria-label="URL input"]','café');await click('Execute Transformation');await page.waitForFunction(()=>document.querySelector('textarea[aria-label="URL output"]').value==='Y2Fmw6k=');});
 await check('JSON precision, formatting and invalid input',async()=>{await goto('/tools/json-formatter');await fill('textarea[aria-label="JSON input"]','{"id":900719925474099312345,"url":"https://example.com"}');await click('Format Code');await contains('900719925474099312345');await fill('textarea[aria-label="JSON input"]','{bad');await click('Format Code');await contains('Invalid JSON');});
 await check('Worker minifier preserves JavaScript URL literals',async()=>{await goto('/tools/minify-beautify');await fill('textarea[aria-label="Source code"]','const url = "https://example.com/a  b"; // keep URL\nconsole.log(url);');await click('Minify Code');await page.waitForFunction(()=>document.querySelector('pre')?.textContent.includes('https://example.com/a  b')); assert.ok(await page.$eval('pre',element=>!element.textContent.includes('// keep URL')));});
 await check('Text sentence conversion and blocked clipboard feedback',async()=>{await goto('/tools/text-case-converter');await fill('textarea','HELLO. WORLD!');await click('Sentence');await contains('Hello. World!');await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied');}}}));await page.$eval('button[aria-label="Copy result"]',button=>button.click());await contains('Clipboard access blocked');});
 await check('Unicode word and character counts',async()=>{await goto('/tools/word-counter');await fill('textarea','café résumé 🌍');await page.waitForFunction(()=>{const find=label=>Array.from(document.querySelectorAll('p')).find(element=>element.textContent===label)?.nextElementSibling?.textContent;return find('Characters')==='13'&&find('Words')==='2';});});
 await check('Meta-tag export escapes HTML and rejects unsafe URLs',async()=>{await goto('/tools/meta-tag-preview');await page.evaluate(()=>{window.copiedTags='';Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedTags=text;}}});});await fill('#meta-title','</title><script>alert(1)</script>');await click('Copy Meta Tags');assert.ok((await page.evaluate(()=>window.copiedTags)).includes('&lt;/title&gt;'));await fill('#canonical-url','javascript:alert(1)');await click('Copy Meta Tags');await page.waitForSelector('[role="alert"]');});
 await check('All nine QR payload types decode independently and resolution changes output',async()=>{
   await goto('/tools/qr-code-generator');
   assert.equal(await page.$eval('button.btn-primary',button=>button.disabled),true);
   const decode = async () => {
     await page.waitForSelector('canvas');
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const image=await page.$eval('canvas',canvas=>({data:Array.from(canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data),width:canvas.width,height:canvas.height}));
     const decoded=jsQR(Uint8ClampedArray.from(image.data),image.width,image.height);
     assert.ok(decoded,'Generated QR could not be decoded');return decoded.data;
   };
   const field=async(label,value)=>{
     const id=await page.$$eval('label',(labels,text)=>labels.find(label=>label.textContent===text)?.htmlFor,label);
     assert.ok(id,'Missing QR input: '+label);
     await fill('[id="'+id+'"]',value);
   };
   await fill('textarea','https://example.com');assert.equal(await decode(),'https://example.com');
   await click('URL');await fill('#qr-url','https://example.com');assert.equal(await decode(),'https://example.com/');
   await fill('#qr-url','javascript:alert(1)');await page.waitForSelector('[role="alert"]');
   await click('Phone');await field('Phone number','+15551234567');assert.equal(await decode(),'tel:+15551234567');
   await click('SMS');await field('Phone number','+15551234567');await field('Message','Hello world');assert.equal(await decode(),'sms:+15551234567?body=Hello%20world');
   await click('Location');await field('Latitude','0');await field('Longitude','0');assert.equal(await decode(),'geo:0,0');
   await click('Wi-Fi');await field('Network Name (SSID)','A;B');await field('Password','x:y');assert.equal(await decode(),'WIFI:T:WPA;S:A\\;B;P:x\\:y;;');
   await click('Email');await field('Recipient Email','ada@example.com');await field('Subject','Hello world');assert.equal(await decode(),'mailto:ada@example.com?subject=Hello%20world');
   await click('Event');await field('Event title','Audit meeting');
   await page.evaluate(()=>{const input=document.querySelector('input[type="datetime-local"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'2026-11-06T09:30');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
   assert.ok((await decode()).includes('DTSTART:20261106T093000'));
   await click('Contact');await field('Full name','Ada Lovelace');assert.ok((await decode()).includes('FN:Ada Lovelace'));
   await click('Customize Appearance');await page.evaluate(()=>{const input=document.querySelector('input[type="range"]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'400');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
   await page.waitForFunction(()=>document.querySelector('canvas')?.width===400);
   const image=await page.$eval('canvas',canvas=>canvas.toDataURL());await fs.writeFile(path.join(output,'qr.png'),Buffer.from(image.split(',')[1],'base64'));
 });
 await check('Markdown generates a real downloadable DOCX',async()=>{await goto('/tools/markdown-to-docx');await fill('textarea[aria-label="Markdown input"]','# Audit fixture\n\n| A | B |\n|---|---|\n| 1 | 2 |');const response=page.waitForResponse(response=>response.url().endsWith('/api/convert/md-to-docx/text'));await click('Generate Word Document');const result=await response;assert.equal(result.status(),200);await page.waitForSelector('a[download]');
const filename=await page.$eval('a[download]',link=>link.download);
await fs.rm(path.join(output,filename),{force:true});
await page.locator('a[download]').click();
let bytes;
for(let attempt=0;attempt<240;attempt++){try{bytes=await fs.readFile(path.join(output,filename));if(bytes.length)break;}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
assert.ok(bytes?.length,'Browser did not finish the DOCX download');assert.equal(bytes.subarray(0,2).toString(),'PK');await fs.writeFile(path.join(output,'markdown.docx'),bytes);});
 await check('PDF image conversion returns readable output',async()=>{await goto('/tools/pdf-converter');const filename=path.join(output,'fixture.png');await fs.writeFile(filename,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j6V0AAAAASUVORK5CYII=','base64'));const input=await page.$('input[type="file"]');await input.uploadFile(filename);const response=page.waitForResponse(response=>response.url().endsWith('/api/convert/upload'));await page.locator('button.btn-primary').click();const result=await response;assert.equal(result.status(),200);await page.waitForSelector('button[title="Download"]');
const downloaded=path.join(output,'converted_images.pdf');await fs.rm(downloaded,{force:true});
await page.locator('button[title="Download"]').click();
let bytes;for(let attempt=0;attempt<240;attempt++){try{bytes=await fs.readFile(downloaded);if(bytes.length)break;}catch{}await new Promise(resolve=>setTimeout(resolve,250));}
assert.ok(bytes?.length,'Browser did not finish the PDF download');assert.equal(bytes.subarray(0,4).toString(),'%PDF');await fs.writeFile(path.join(output,'converted.pdf'),bytes);});
 const routes=['/','/about','/tools','/tools/pdf-converter','/tools/qr-code-generator','/tools/minify-beautify','/blog/exploring-our-development-tools'];
 for(const width of [390,768,1440]) for(const route of routes) await check(`layout ${width} ${route}`,async()=>{await page.setViewport({width,height:1000});await goto(route);await page.evaluate(()=>document.fonts.ready);const metrics=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,title:document.querySelectorAll('title').length,canonical:document.querySelectorAll('link[rel="canonical"]').length}));assert.ok(metrics.scroll<=metrics.width+1,JSON.stringify(metrics));assert.equal(metrics.h1,1);assert.equal(metrics.title,1);assert.equal(metrics.canonical,1);await page.screenshot({path:path.join(output,`${width}-${route.replaceAll('/','_')||'home'}.png`),fullPage:true});});
} finally {
 await fs.writeFile(path.join(output,'results.json'),JSON.stringify({browser:browserVersion,complete:true,results,errors},null,2));if(browser.connected)await browser.close();
}
if(results.some(result=>result.status==='FAIL'))process.exitCode=1;
