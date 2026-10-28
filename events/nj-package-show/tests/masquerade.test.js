import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST, GET } from '../api/masquerade.js';
import { SCENES } from '../lib/masquerade-rules.js';

test('Vercel masquerade contract, approved templates, validation and quota fallback', async () => {
  const originalFetch = globalThis.fetch;
  const savedPrimary = process.env.OPENAI_API_KEY, savedBackup = process.env.OPENAI_BACKUP;
  process.env.OPENAI_API_KEY = 'placeholder-primary'; process.env.OPENAI_BACKUP = 'placeholder-backup';
  let calls = [], quota = false;
  globalThis.fetch = async (url, options = {}) => {
    calls.push({url: String(url), options});
    if (String(url).includes('.lovable.app/')) return new Response(new Uint8Array([255,216,255]), {headers:{'content-type':'image/jpeg'}});
    assert.equal(url, 'https://api.openai.com/v1/images/edits');
    return quota ? Response.json({error:{code:'insufficient_quota'}},{status:429})
      : Response.json({data:[{b64_json:'/9j/TEST'}]});
  };
  const request = (scene='bartenura', count='1', options={}) => {
    const f = new FormData(); f.append('scene',scene);
    if(count!==null) f.append('guestCount',count);
    if(!options.noPhoto) f.append('guest',new File([new Uint8Array([255,216,255])],'camera.jpg',{type:options.mime||'image/jpeg'}));
    if(options.duplicate) f.append(options.duplicate, options.duplicate==='scene'?'bartenura':'1');
    f.append('prompt','UNTRUSTED'); f.append('model','attacker'); f.append('templateUrl','https://attacker.invalid');
    return new Request('https://backend.invalid/api/masquerade',{method:'POST',body:f,headers:{'x-forwarded-for':options.ip||scene}});
  };
  try {
    assert.equal(GET().status,200); assert.equal((await GET().json()).credentialLocation,'vercel');
    for(const scene of SCENES.filter(scene => scene.id !== "photo-mask")) {
      calls=[]; const response=await POST(request(scene.id,'2')); assert.equal(response.status,200);
      assert.equal((await response.json()).mimeType,'image/jpeg');
      const payload=JSON.parse(calls.find(c=>c.url.includes('api.openai.com')).options.body);
      assert.equal(payload.model,'gpt-image-2'); assert.equal(payload.images.length,2);
      assert.match(calls[0].url,/^https:\/\/royal-masquerade-moments\.lovable\.app\/__l5e\/assets-v1\//);
      assert.ok(payload.prompt.includes('BODY INVARIANTS')); assert.ok(payload.prompt.includes('exactly 2 camera'));
      assert.ok(!payload.prompt.includes('UNTRUSTED')); assert.ok(!payload.prompt.includes('attacker'));
    }
    for(const [scene,count,options] of [['bad','1',{}],['bartenura','4',{}],['bartenura','02',{}],['bartenura',null,{}],['bartenura','1',{noPhoto:true}],['bartenura','1',{mime:'text/plain'}],['bartenura','1',{duplicate:'scene'}],['bartenura','1',{duplicate:'guestCount'}]]) {
      calls=[];assert.equal((await POST(request(scene,count,options))).status,400);assert.equal(calls.length,0);
    }
    calls=[];quota=true;const response=await POST(request('bartenura','1',{ip:'quota-check'}));assert.equal(response.status,402);
    assert.equal((await response.json()).code,'OPENAI_QUOTA');
    assert.equal(calls.filter(c=>c.url.includes('api.openai.com')).length,2);
    delete process.env.OPENAI_API_KEY;delete process.env.OPENAI_BACKUP;calls=[];
    assert.equal((await POST(request())).status,503);assert.equal(calls.length,0);
  } finally {
    globalThis.fetch=originalFetch;
    if(savedPrimary===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=savedPrimary;
    if(savedBackup===undefined)delete process.env.OPENAI_BACKUP;else process.env.OPENAI_BACKUP=savedBackup;
  }
});
