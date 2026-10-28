import { test } from 'node:test';
import assert from 'node:assert/strict';
import { POST, GET } from '../api/masquerade.js';
import { getScene, buildPrompt, buildPhotoMaskPrompt } from '../lib/masquerade-rules.js';

test('photo-mask uses only original image and minimal photographic-edit rules for 1–3 guests', async () => {
  const oldFetch=globalThis.fetch, primary=process.env.OPENAI_API_KEY, backup=process.env.OPENAI_BACKUP;
  process.env.OPENAI_API_KEY='test-only-placeholder';delete process.env.OPENAI_BACKUP;
  let calls=[];
  globalThis.fetch=async(url,options) => {
    calls.push({url,options});
    assert.equal(url,'https://api.openai.com/v1/images/edits','photo mode must not fetch artwork or caller URLs');
    return Response.json({data:[{b64_json:'/9j/MASKOUTPUT'}]});
  };
  try {
    const info=await GET().json();assert.equal(info.scenes.length,6);assert.equal(info.scenes[5],'photo-mask');
    for(const n of [1,2,3]) {
      const f=new FormData();f.set('scene','photo-mask');f.set('guestCount',String(n));
      f.set('guest',new File([new Uint8Array([255,216,255,42])],'photo.jpg',{type:'image/jpeg'}));
      f.set('prompt','attacker-overrides');f.set('templateUrl','https://attacker.invalid');f.set('model','attacker-model');
      calls=[];const response=await POST(new Request('https://backend.invalid/api/masquerade',{method:'POST',body:f,headers:{'x-forwarded-for':'mask-'+n}}));
      assert.equal(response.status,200);assert.equal(calls.length,1);
      assert.equal((await response.json()).mimeType,'image/jpeg');
      const payload=JSON.parse(calls[0].options.body);
      assert.equal(payload.images.length,1);assert.equal(payload.images[0].image_url,'data:image/jpeg;base64,/9j/Kg==');
      assert.equal(payload.prompt,buildPhotoMaskPrompt(n));assert.equal(payload.prompt,buildPrompt(getScene('photo-mask'),n));
      assert.match(payload.prompt,/CHANGE ONLY the small eye-mask accessory regions/);
      assert.match(payload.prompt,/original clothes/);assert.match(payload.prompt,/background.*unchanged/);
      assert.match(payload.prompt,/Do NOT add text/);assert.match(payload.prompt,/above the photograph/);
      assert.ok(!payload.prompt.includes('attacker-overrides'));assert.equal(payload.model,'gpt-image-2');
    }
    for(const n of [0,4,1.5])assert.throws(()=>buildPhotoMaskPrompt(n));
    assert.equal(getScene('padre-azul').bottleCount,1);assert.equal(getScene('don-ramon').bottleCount,2);
  } finally {
    globalThis.fetch=oldFetch;
    if(primary===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=primary;
    if(backup===undefined)delete process.env.OPENAI_BACKUP;else process.env.OPENAI_BACKUP=backup;
  }
});
