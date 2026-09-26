import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const target=process.env.KIOSK_URL;
if(!target?.startsWith('https://'))throw new Error('A deployed HTTPS URL is required');
const report={url:target,voice:{},image:{},email:{}};
await fs.mkdir('artifacts',{recursive:true});
const browser=await chromium.launch({args:['--use-fake-ui-for-media-stream','--use-fake-device-for-media-stream','--autoplay-policy=no-user-gesture-required','--enable-unsafe-swiftshader']});
const context=await browser.newContext({viewport:{width:1080,height:1920},permissions:['microphone','camera']});
const page=await context.newPage();
await page.addInitScript(()=>{
 const Native=window.RTCPeerConnection;window.__activationEvents=[];window.__activationChannel=null;
 window.RTCPeerConnection=class extends Native{
  addTrack(track,...args){if(track.kind==='audio')track.enabled=false;return super.addTrack(track,...args);}
  createDataChannel(...args){const c=super.createDataChannel(...args);window.__activationChannel=c;c.addEventListener('message',({data})=>{try{window.__activationEvents.push(JSON.parse(data));}catch{}});return c;}
 };
});
let image;
try{
 await page.goto(target);
 const origin=new URL(page.url()).origin;
 const health=await context.request.get(origin+'/api/health');
 report.configuration=await health.json();
 try{
  await page.waitForFunction(()=>document.body.dataset.configuration==='ready',null,{timeout:15000});
  await page.locator('#face').click();
  await page.waitForFunction(()=>window.__activationEvents.some(e=>e.type==='session.started')||document.body.dataset.phase==='error',null,{timeout:60000});
  const started=await page.evaluate(()=>window.__activationEvents.some(e=>e.type==='session.started'));
  if(!started)throw new Error(await page.locator('#hint').textContent());
  await page.waitForFunction(()=>window.__activationEvents.some(e=>e.type==='session.output_transcript.delta'),null,{timeout:40000});
  report.voice={passed:true,sessionStarted:true,captionCharacters:await page.locator('#hostCaptionText').evaluate(e=>e.textContent.length),errors:await page.evaluate(()=>window.__activationEvents.filter(e=>e.type==='error').map(e=>({code:e.error?.code})))};
  if(report.voice.errors.length)report.voice.passed=false;
  await page.screenshot({path:'artifacts/activation-live-voice.png'});
 }catch(e){report.voice={passed:false,error:String(e.message).slice(0,350)};}
 finally{
  await page.evaluate(()=>{if(window.__activationChannel?.readyState==='open')window.__activationChannel.send(JSON.stringify({type:'session.close'}));}).catch(()=>{});
  await page.waitForTimeout(800);
 }
 try{
  const input=await fs.readFile('tests/fixtures/sentry-person.jpg');
  const response=await context.request.post(origin+'/api/banana',{multipart:{image:{name:'authorized-test-fixture.jpg',mimeType:'image/jpeg',buffer:input},guestCount:'1',style:''},timeout:195000});
  if(!response.ok()){const error=await response.json().catch(()=>({}));report.image={passed:false,status:response.status(),code:error.code,error:error.error};}
  else{
   image=await response.body();
   const dimensions=await page.evaluate(async data=>{const im=new Image();im.src='data:image/jpeg;base64,'+data;await im.decode();return {width:im.naturalWidth,height:im.naturalHeight};},image.toString('base64'));
   await fs.writeFile('artifacts/activation-generated.jpg',image);
   report.image={passed:image.length>1000&&dimensions.width>0,bytes:image.length,...dimensions,independentSubjectCheck:true};
  }
 }catch(e){report.image={passed:false,error:String(e.message).slice(0,250)};}
 if(!report.configuration.emailConfigured){report.email={passed:false,pending:'Client Reply-To or Resend setup is incomplete; no email sent.'};}
 else if(!image){report.email={passed:false,pending:'No approved generated image available; no email sent.'};}
 else{
  try{
   const response=await context.request.post(origin+'/api/send-photo',{data:{email:'wyzer@powerwyze.com',filename:'activation-test.jpg',mimeType:'image/jpeg',imageBase64:image.toString('base64')},timeout:40000});
   const data=await response.json().catch(()=>({}));
   report.email={passed:response.ok()&&data.ok===true,status:response.status(),providerMessageId:data.id||null,recipient:'wyzer@powerwyze.com',inboxDeliveryVerified:false};
  }catch(e){report.email={passed:false,error:String(e.message).slice(0,250)};}
 }
 await page.screenshot({path:'artifacts/activation-public-portrait.png'});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'artifacts/activation-public-phone.png'});
}finally{
 await fs.writeFile('artifacts/provider-activation-report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify(report));
 await browser.close();
}
if(!report.voice.passed||!report.image.passed||(report.configuration.emailConfigured&&!report.email.passed))process.exitCode=1;
