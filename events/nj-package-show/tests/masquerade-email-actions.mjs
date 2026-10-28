
import {mock} from 'node:test';
import assert from 'node:assert/strict';
const objects=new Map(),messages=[];
mock.module('@vercel/blob',{namedExports:{
 get:async path=>objects.has(path)?{statusCode:200,blob:{contentType:'image/jpeg'},stream:new Blob([objects.get(path)],{type:'image/jpeg'}).stream()}:null,
 put:async(path,bytes,options)=>{assert.equal(options.access,'private');objects.set(path,Buffer.from(bytes));return {pathname:path}}
}});
mock.module('resend',{namedExports:{Resend:class{emails={send:async(message)=>{messages.push(message);return {data:{id:'test-email'}}}}}}});
process.env.RESEND_API_KEY='synthetic-key';process.env.RESEND_FROM_EMAIL='wyzer@powerwyze.com';process.env.RESEND_REPLY_TO='client@example.com';
delete process.env.BLOB_STORE_ID;delete process.env.BLOB_READ_WRITE_TOKEN;
const {default:send}=await import('../api/send-photo.js');
const {default:download}=await import('../api/portrait.js');
const bytes=Buffer.from('synthetic branded portrait');
function response(){return {headers:{},chunks:[],setHeader(k,v){this.headers[k]=v},status(v){this.code=v;return this},json(v){this.body=v;return this},send(v){this.body=v;return this},write(v){this.chunks.push(v)},end(){this.ended=true}}}
for(const guest of ['core-brands@example.com','black-irish@example.com']){
 const res=response();
 await send({method:'POST',body:{email:guest,name:'Test Guest',contactVersion:1,filename:'royal-wine-masquerade.jpg',mimeType:'image/jpeg',imageBase64:bytes.toString('base64')}},res);
 assert.equal(res.code,200);
 const email=messages.at(-1);
 assert(email.html.includes('>Download Image</a>'));assert(email.html.includes('>Share Image</a>'));
 const href=email.html.match(/href="([^"]+download=1)"/)[1];
 const link=new URL(href),out=response();
 await download({method:'GET',query:Object.fromEntries(link.searchParams)},out);
 assert.deepEqual(Buffer.concat(out.chunks),bytes);
 assert(out.headers['Content-Disposition'].startsWith('attachment'));
 assert.equal(email.attachments[0].content,bytes.toString('base64'));
 assert(email.html.includes('/portrait#'+link.searchParams.get('id')));
 assert(email.text.includes('\nDownload Image:'));
}
assert.equal(objects.size,2);
console.log('PASS: both masquerade variants include download/share buttons, private links return exact attachment bytes, and downloads use attachment disposition.');
