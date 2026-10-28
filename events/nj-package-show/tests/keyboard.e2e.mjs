import {chromium,devices} from 'playwright';import http from 'node:http';import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const root=path.resolve('public');
const server=http.createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname;const f=path.resolve(root,'.'+p);if(!f.startsWith(root+'/'))throw Error();res.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.mjs':'text/javascript'})[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
try{
 for(const size of ['phone','tablet']){
 const context=await browser.newContext(size==='phone'?devices['Pixel 7']:{viewport:{width:800,height:1280},isMobile:true,hasTouch:true});
 await context.addInitScript(()=>{navigator.mediaDevices.getUserMedia=async()=>{const c=document.createElement('canvas');c.width=640;c.height=480;const ctx=c.getContext('2d');const draw=()=>{ctx.fillStyle='#244c9d';ctx.fillRect(0,0,640,480);};draw();setInterval(draw,100);return c.captureStream(10);};});
 const page=await context.newPage();page.setDefaultTimeout(15000);
 await page.route('**/api/health',r=>r.fulfill({json:{packetId:'DEMO-009',hostEnabled:false,voiceConfigured:false,imageConfigured:true,emailConfigured:true}}));
 let release;const pending=new Promise(r=>release=r);let sends=0;
 await page.route('**/api/banana',async r=>{await pending;const b64=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=640;c.height=480;c.getContext('2d').fillRect(0,0,640,480);return c.toDataURL('image/jpeg').split(',')[1];});await r.fulfill({contentType:'image/jpeg',body:Buffer.from(b64,'base64')});});
 await page.route('**/api/send-photo',async r=>{sends++;const b=r.request().postDataJSON();assert.equal(b.email,'test@gmail.com');assert.equal(b.name,'Test Guest');await r.fulfill({status:sends===1?502:200,json:{ok:sends!==1}});});
 await page.goto('http://127.0.0.1:'+server.address().port+'/host.html');
 await page.waitForFunction(()=>document.body.dataset.configuration==='ready');
 await page.locator('[data-theme=gallery]').tap();await page.locator('[data-touch=people-1]').tap();await page.locator('[data-touch=capture]').tap();
 await page.locator('#emailPanel:not([hidden])').waitFor();
 for(const id of ['emailInput','guestNameInput'])assert.deepEqual(await page.locator('#'+id).evaluate(el=>({readonly:el.readOnly,mode:el.inputMode})),{readonly:true,mode:'none'});
 const tap=async k=>{await page.locator('#emailKeyboard button').evaluateAll((buttons,key)=>buttons.find(b=>b.dataset.key===key).click(),k);};
 await page.locator('#emailInput').tap();for(const k of 'testx')await tap(k);await tap('backspace');
 await page.getByRole('button',{name:'Use @gmail.com',exact:true}).tap();
 assert.equal(await page.locator('#emailInput').inputValue(),'test@gmail.com');
 await page.locator('#contactKeyboardToggle').tap();assert.equal(await page.evaluate(()=>document.activeElement.id),'guestNameInput');
 await tap('shift');await tap('t');await tap('shift');for(const k of 'est ')await tap(k);await tap('shift');await tap('g');await tap('shift');for(const k of 'uest')await tap(k);
 assert.equal(await page.locator('#guestNameInput').inputValue(),'Test Guest');
 await page.keyboard.type('SHOULDNOTINSERT');assert.equal(await page.locator('#guestNameInput').inputValue(),'Test Guest');
 assert(await page.locator('#emailKeyboard').isVisible());assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 await fs.mkdir('artifacts',{recursive:true});await page.screenshot({path:'artifacts/keyboard-'+size+'.png',fullPage:true});
 await page.locator('#emailConfirm').tap();assert.equal(sends,0);release();
 await page.waitForFunction(()=>document.querySelector('#emailStatus').textContent.includes('could not'));
 assert.equal(await page.locator('#guestNameInput').inputValue(),'Test Guest');await page.locator('#emailConfirm').tap();
 await page.waitForFunction(()=>!document.querySelector('#emailToast').hidden);assert.equal(sends,2);
 await page.locator('[data-touch=finish]').tap();assert.equal(await page.locator('#emailInput').inputValue(),'');assert.equal(await page.locator('#guestNameInput').inputValue(),'');
 console.log(size+': readonly/none, built-in editing, domain, field switch, queue, failed-send retry and reset passed');await context.close();
 }
}finally{await browser.close();await new Promise(r=>server.close(r));}
