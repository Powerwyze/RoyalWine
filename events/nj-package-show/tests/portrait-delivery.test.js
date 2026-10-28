import test from 'node:test';import assert from 'node:assert/strict';
import {portraitId,persistPortrait,validPortraitId,deliveryActions} from '../lib/portrait-delivery.js';
test('recipient-scoped opaque IDs are stable on retries and change with content',()=>{
 const b=Buffer.from('synthetic');const a=portraitId(b,'a@example.com','test-secret');
 assert.equal(a,portraitId(b,' A@example.com ','test-secret'));assert(validPortraitId(a));
 assert.notEqual(a,portraitId(b,'b@example.com','test-secret'));assert.notEqual(a,portraitId(Buffer.from('other'),'a@example.com','test-secret'));
 assert(!validPortraitId('../secret'));assert(!validPortraitId('x'.repeat(64)));
});
test('private immutable storage retries reuse object; email buttons target correct rendition',async()=>{
 const objects=new Map();let writes=0;
 const storage={get:async p=>objects.get(p),put:async(p,b,o)=>{assert.equal(o.access,'private');assert.equal(o.allowOverwrite,false);objects.set(p,b);writes++;}};
 const args={bytes:Buffer.from('same branded bytes'),recipient:'a@example.com',key:'test-secret',storage};
 const a=await persistPortrait(args),b=await persistPortrait(args);assert.deepEqual(a,b);assert.equal(writes,1);
 const actions=deliveryActions(a);assert(actions.html.includes('Download branded image'));assert(actions.html.includes('>Share</a>'));assert(actions.html.includes(a.page));assert(actions.html.includes(a.download));
 assert(!actions.html.includes('linkedin.com'));assert(!actions.html.includes('expires'));
});
test('storage failure prevents claiming working links',async()=>{
 await assert.rejects(persistPortrait({bytes:Buffer.from('test'),recipient:'a@example.com',key:'secret',storage:{get:async()=>null,put:async()=>{throw Error('offline');}}}),/offline/);
});
