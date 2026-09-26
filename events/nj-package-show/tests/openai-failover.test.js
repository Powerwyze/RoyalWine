import test from 'node:test';
import assert from 'node:assert/strict';
import {openaiFetch,isCreditLimit} from '../lib/openai-fetch.js';
const url='https://api.openai.com/v1/responses';
const reject=(code,status=429)=>Response.json({error:{code,type:'insufficient_quota'}},{status});
test('confirmed credit rejection retries once with identical payload and backup authorization',async()=>{
 const calls=[];const body=JSON.stringify({model:'gpt-live-1',input:'hello'});
 const signal=new AbortController().signal;
 const result=await openaiFetch(url,{method:'POST',body,signal},{primaryKey:'primary-test',backupKey:'backup-test',fetcher:async(u,o)=>{
  calls.push({u,body:o.body,signal:o.signal,key:o.headers.get('authorization')});
  return calls.length===1?reject('credit_balance_exhausted'):Response.json({ok:true});
 }});
 assert.equal(result.status,200);assert.equal(calls.length,2);
 assert.deepEqual(calls.map(c=>c.key),['Bearer primary-test','Bearer backup-test']);
 assert.ok(calls.every(c=>c.body===body&&c.signal===signal&&c.u===url));
});
test('all supported quota codes are recognized, not rate-limit codes',()=>{
 for(const code of ['insufficient_quota','credit_balance_exhausted','billing_hard_limit_reached','organization_spend_limit_exceeded','project_spend_limit_exceeded','organization_usage_limit_exceeded'])assert.equal(isCreditLimit(429,{error:{code}}),true);
 assert.equal(isCreditLimit(429,{error:{type:'insufficient_quota'}}),true);
 for(const code of ['rate_limit_exceeded','slow_down','invalid_api_key','model_not_found'])assert.equal(isCreditLimit(429,{error:{code,type:'insufficient_quota'}}),false);
 assert.equal(isCreditLimit(403,{error:{code:'insufficient_quota'}}),false);
});
test('success, auth, access, rate limits and server failures do not switch credentials',async()=>{
 for(const [status,code] of [[200,''],[401,'invalid_api_key'],[403,'permission_denied'],[404,'model_not_found'],[429,'rate_limit_exceeded'],[429,'slow_down'],[500,'server_error']]){
  let count=0;
  const r=await openaiFetch(url,{body:'{}'},{primaryKey:'primary-test',backupKey:'backup-test',fetcher:async()=>{count++;return Response.json({error:{code}},{status});}});
  assert.equal(count,1);assert.equal(r.status,status);assert.equal((await r.json()).error.code,code);
 }
});
test('backup exhaustion stops after two requests',async()=>{
 let count=0;
 const r=await openaiFetch(url,{body:'{}'},{primaryKey:'p',backupKey:'b',fetcher:async()=>{count++;return reject('insufficient_quota');}});
 assert.equal(count,2);assert.equal(r.status,429);
});
test('network failure is not replayed and cancellation prevents a backup request',async()=>{
 let count=0;
 await assert.rejects(openaiFetch(url,{body:'{}'},{primaryKey:'p',backupKey:'b',fetcher:async()=>{count++;throw new Error('network');}}),/network/);
 assert.equal(count,1);
 count=0;const controller=new AbortController();
 await assert.rejects(openaiFetch(url,{body:'{}',signal:controller.signal},{primaryKey:'p',backupKey:'b',fetcher:async()=>{count++;controller.abort();return reject('insufficient_quota');}}),{name:'AbortError'});
 assert.equal(count,1);
});
test('missing or duplicate backup never loops; backup can serve when primary absent',async()=>{
 for(const backup of ['', 'p']){
  let count=0;
  await openaiFetch(url,{body:'{}'},{primaryKey:'p',backupKey:backup,fetcher:async()=>{count++;return reject('insufficient_quota');}});
  assert.equal(count,1);
 }
 let key;
 await openaiFetch(url,{body:'{}'},{primaryKey:'',backupKey:'b',fetcher:async(u,o)=>{key=o.headers.get('authorization');return Response.json({ok:true});}});
 assert.equal(key,'Bearer b');
});
test('credentials are never forwarded to other origins or redirects',async()=>{
 let called=false;
 await assert.rejects(openaiFetch('https://example.com/v1/responses',{}, {primaryKey:'p',backupKey:'b',fetcher:async()=>{called=true;}}),/Invalid OpenAI endpoint/);
 assert.equal(called,false);
 await openaiFetch(url,{}, {primaryKey:'p',backupKey:'',fetcher:async(u,o)=>{assert.equal(o.redirect,'error');return Response.json({ok:true});}});
});
