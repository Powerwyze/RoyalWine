import {chromium} from 'playwright';
import http from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve('public');
const server=http.createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+new URL(req.url,'http://local').pathname);if(!file.startsWith(root+'/'))throw Error();const bytes=await readFile(file);res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.png')?'image/png':file.endsWith('.jpg')?'image/jpeg':'text/html');res.end(bytes);}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true});
try{
 const page=await browser.newPage();await page.goto(base+'/host.html');
 const result=await page.evaluate(async()=>{
  const {brandPortrait,BRAND_LOGOS}=await import('/branded-image.js');
  const source=document.createElement('canvas');source.width=768;source.height=1152;
  const ctx=source.getContext('2d');ctx.fillStyle='#244c9d';ctx.fillRect(0,0,768,1152);
  ctx.fillStyle='white';ctx.font='bold 40px Arial';ctx.fillText('SYNTHETIC TEST PORTRAIT',70,500);
  const blob=await new Promise(r=>source.toBlob(r,'image/jpeg'));
  const branded=await brandPortrait(blob);const bitmap=await createImageBitmap(branded);
  document.body.innerHTML='';document.body.style='margin:0;background:#101c35;display:flex;justify-content:center';
  const image=new Image();image.src=URL.createObjectURL(branded);image.style='width:100%;max-width:768px;height:auto;object-fit:contain';document.body.append(image);await image.decode();
  return {width:bitmap.width,height:bitmap.height,type:branded.type,logos:BRAND_LOGOS.length};
 });
 assert.deepEqual(result,{width:768,height:1382,type:'image/jpeg',logos:3});
 await mkdir('artifacts',{recursive:true});
 for(const [name,width,height] of [['phone',390,844],['kiosk',1080,1920]]){
 await page.setViewportSize({width,height});await page.screenshot({path:'artifacts/banner-'+name+'.png',fullPage:true});
 }
 await page.route('**/assets/black-irish-logo.png',r=>r.fulfill({status:404}));
 await page.evaluate(async()=>{const {brandPortrait}=await import('/branded-image.js');const c=document.createElement('canvas');c.width=c.height=10;const b=await new Promise(r=>c.toBlob(r));try{await brandPortrait(b);throw Error('Expected missing logo failure');}catch(e){if(!e.message.includes('logo'))throw e;}});
 console.log('Banner: dimensions, three real assets, phone/kiosk rendering and missing-logo rejection passed.');
}finally{await browser.close();await new Promise(r=>server.close(r));}
