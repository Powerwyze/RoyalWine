import {chromium} from 'playwright';
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..'),reference=await fs.readFile(process.env.PHOTO_TEST_REFERENCE||'/tmp/royal-reference.jpg');
const server=http.createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;const file=path.join(root,'public',pathname==='/'?'index.html':pathname);if(!file.startsWith(path.join(root,'public')+'/'))throw Error();const data=await fs.readFile(file);res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.glb':'model/gltf-binary','.mjs':'text/javascript','.wasm':'application/wasm'})[path.extname(file)]||'application/octet-stream'});res.end(data);}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(4185,'127.0.0.1',r));
await fs.mkdir('/tmp/royal-evidence',{recursive:true});
const browser=await chromium.launch({args:['--enable-unsafe-swiftshader','--autoplay-policy=no-user-gesture-required']});
let checks=0;
try{
 for(const [i,theme] of ['gallery','riviera','midnight','celebration'].entries()){
  const context=await browser.newContext({viewport:i===3?{width:390,height:844}:{width:1080,height:1920}});
  await context.addInitScript(({photo,fakeVoice})=>{
 if(fakeVoice){window.RTCPeerConnection=class extends EventTarget{constructor(){super();this.iceGatheringState="complete";window.__testPeer=this;}addTrack(){}createDataChannel(){this.channel=new EventTarget();this.channel.readyState="open";this.channel.send=()=>{};this.channel.close=()=>{};return this.channel;}async createOffer(){return {type:"offer",sdp:"test-offer"};}async setLocalDescription(o){this.localDescription=o;}async setRemoteDescription(){queueMicrotask(()=>this.channel.dispatchEvent(new MessageEvent("message",{data:JSON.stringify({type:"session.started"})})));}close(){} };}
   let cameraCanvas;
   navigator.mediaDevices.getUserMedia=async opts=>{
    if(opts.audio&&fakeVoice)return new AudioContext().createMediaStreamDestination().stream;
    if(opts.audio){const e=new Error('Microphone denied for test');e.name='NotAllowedError';throw e;}
    const canvas=document.createElement('canvas');canvas.width=800;canvas.height=600;const img=new Image();img.src=photo;await img.decode();canvas.width=img.naturalWidth;canvas.height=img.naturalHeight;const draw=()=>canvas.getContext('2d').drawImage(img,0,0);draw();const timer=setInterval(draw,80);const stream=canvas.captureStream(20);stream.getVideoTracks()[0].addEventListener('ended',()=>clearInterval(timer));return stream;
   };
  },{photo:'data:image/jpeg;base64,'+reference.toString('base64'),fakeVoice:i===2});
  const errors=[];const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/health',r=>r.fulfill({json:{packetId:'DEMO-009',hostEnabled:true,voiceConfigured:true,imageConfigured:true,emailConfigured:true}}));
  await page.route('**/api/host-session',r=>r.fulfill({json:{transport:{sdp:'test-answer'}}}));
  let release,requested,genCalls=0,emailCalls=0;const requestedPromise=new Promise(r=>requested=r);const pending=new Promise(r=>release=r);
  await page.route('**/api/banana',async r=>{genCalls++;requested();assert.ok(r.request().postDataBuffer().includes(Buffer.from(theme)));await pending;await r.fulfill({status:200,contentType:'image/jpeg',body:reference});});
  await page.route('**/api/send-photo',async r=>{emailCalls++;const b=r.request().postDataJSON();assert.equal(b.name,'Test Guest');assert.equal(b.email,'royal-layout@example.com');await r.fulfill({status:i===1&&emailCalls===1?502:200,json:{ok:!(i===1&&emailCalls===1)}});});
  await page.goto('http://127.0.0.1:4185/');
  await page.waitForFunction(()=>document.body.dataset.configuration==='ready');
  await page.waitForFunction(()=>document.getElementById('camera').videoWidth>0);
  assert.equal(await page.locator('[data-theme]').count(),4);assert.ok(await page.locator('#viewfinder').isVisible());
  if(i===0)await page.screenshot({path:'/tmp/royal-evidence/home-portrait.png',fullPage:true});
  if(i===3){const clipped=await page.evaluate(()=>[...document.querySelectorAll('#viewfinder,#touchControls,#photoThemes,#homeExamples,[data-theme]')].filter(el=>el.getBoundingClientRect().right>innerWidth||el.getBoundingClientRect().left<0).map(el=>el.id||el.dataset.theme));assert.deepEqual(clipped,[]);await page.screenshot({path:'/tmp/royal-evidence/home-mobile.png',fullPage:true});}
  await page.locator('[data-theme="'+theme+'"]').click();
  await page.locator('[data-touch=people-1]').click();
  if(i===0||i===2){await page.locator('[data-touch=voice]').click();await page.waitForFunction(()=>document.body.dataset.phase==='listening');assert.ok(await page.locator('[data-touch=capture]').isEnabled());}
  const captured=Date.now();await page.locator('[data-touch=capture]').click();
  await page.waitForFunction(()=>document.body.dataset.phase==='generating',{},{timeout:15000});
  await requestedPromise;assert.ok(Date.now()-captured>=4800);assert.equal(genCalls,1);
  await page.locator('#emailInput').fill('royal-layout@example.com');
  assert.ok(await page.locator('#emailConfirm').isDisabled());
  await page.locator('#guestNameInput').fill('Test Guest');
  if(i===3)await page.screenshot({path:'/tmp/royal-evidence/contact-mobile.png',fullPage:true});
  if(i===0)await page.screenshot({path:'/tmp/royal-evidence/contact-portrait.png',fullPage:true});
  if(i===2){
    await page.evaluate(()=>{window.__testPeer.connectionState='failed';window.__testPeer.dispatchEvent(new Event('connectionstatechange'));});
    assert.equal(await page.locator('#emailInput').inputValue(),'royal-layout@example.com');assert.equal(await page.locator('#guestNameInput').inputValue(),'Test Guest');assert.equal(genCalls,1);
    release();await page.waitForFunction(()=>document.body.dataset.phase==='result');
    assert.ok(await page.locator('#emailPanel').isVisible());assert.equal(await page.locator('#emailInput').inputValue(),'royal-layout@example.com');
    assert.equal(emailCalls,0);await page.locator('#emailConfirm').click();
  }else{
    await page.locator('#emailConfirm').click();assert.ok(!(await page.locator('#emailPanel').isVisible()));assert.equal(emailCalls,0);release();
  }
  if(i===1){await page.waitForFunction(()=>document.getElementById('emailStatus').textContent.includes('could not'));assert.equal(await page.locator('#emailInput').inputValue(),'royal-layout@example.com');await page.locator('#emailConfirm').click();}
  await page.waitForFunction(()=>!document.getElementById('emailToast').hidden);
  assert.equal(emailCalls,i===1?2:1);assert.equal(genCalls,1);
  await page.locator('[data-touch=finish]').click();
  await page.waitForFunction(()=>document.body.dataset.phase==='idle'&&document.getElementById('camera').videoWidth>0);
  assert.equal(await page.locator('#emailInput').inputValue(),'');assert.equal(await page.locator('#guestNameInput').inputValue(),'');
  assert.ok(await page.locator('#viewfinder').isVisible());
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.deepEqual(errors,[]);checks++;console.log('PASS '+theme+' ('+(i===3?'phone':'portrait')+'): capture, contact, delivery, reset');
  await context.close();
 }
 console.log('PASS '+checks+' template journeys; mocked image/email providers; default user photo fixture stayed private.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
