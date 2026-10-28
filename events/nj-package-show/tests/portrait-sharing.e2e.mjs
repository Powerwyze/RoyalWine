
import {chromium} from 'playwright';
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844}});
 const jpeg=Buffer.from('/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAABQb/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==','base64');
 await page.addInitScript(()=>{window.shares=[];Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async({files})=>{window.shares.push({name:files[0].name,type:files[0].type,bytes:Array.from(new Uint8Array(await files[0].arrayBuffer()))})}})});
 await page.route('https://portrait.test/**',async route=>{
  const u=new URL(route.request().url());
  if(u.pathname==='/portrait')return route.fulfill({contentType:'text/html',body:await readFile('public/portrait.html','utf8')});
  if(u.pathname==='/portrait.js')return route.fulfill({contentType:'text/javascript',body:await readFile('public/portrait.js','utf8')});
  if(u.pathname==='/api/portrait')return route.fulfill({contentType:'image/jpeg',body:jpeg});
  return route.abort();
 });
 await page.goto('https://portrait.test/portrait#'+'a'.repeat(64));
 await page.locator('#actions').waitFor({state:'visible'});
 await page.getByRole('button',{name:'Share Image',exact:true}).click();
 const shares=await page.evaluate(()=>window.shares);assert.equal(shares.length,1);assert.deepEqual(Buffer.from(shares[0].bytes),jpeg);
 const dl=page.waitForEvent('download');await page.getByRole('link',{name:'Download Image',exact:true}).click();assert((await dl).suggestedFilename().endsWith('.jpg'));
 await page.evaluate(()=>{Object.defineProperty(navigator,'share',{value:undefined});});
 await page.locator('#share').click();await page.getByText('This browser cannot open image sharing.',{exact:false}).waitFor();
 await page.goto('https://portrait.test/portrait#bad');await page.getByText('This portrait link is missing or invalid.',{exact:false}).waitFor();assert(await page.locator('#actions').isHidden());
 console.log('PASS: mobile share passes the actual image file to navigator.share, download saves JPEG, unsupported browsers show fallback, invalid links hide actions.');
}finally{await browser.close()}
