import {createHmac} from 'node:crypto';
export const PORTRAIT_ORIGIN='https://royal-wine-nj-package-kiosk.vercel.app';
export const validPortraitId=id=>typeof id==='string'&&/^[a-f0-9]{64}$/.test(id);
export function portraitId(bytes,recipient,key){
 if(!key)throw Error('Missing signing configuration');
 return createHmac('sha256',key).update('nj-portrait-v1\\0'+recipient.trim().toLowerCase()+'\\0').update(bytes).digest('hex');
}
export async function persistPortrait({bytes,recipient,key,mimeType='image/jpeg',storage}){
 const id=portraitId(bytes,recipient,key),pathname='nj-portraits/'+id+'.image';
 const existing=await storage.get(pathname,{access:'private'});
 if(!existing){try{await storage.put(pathname,bytes,{access:'private',addRandomSuffix:false,allowOverwrite:false,contentType:mimeType});}catch(error){
  // Concurrent identical sends may race to create the same immutable object.
  if(!await storage.get(pathname,{access:'private'}))throw error;
 }}
 return {id,page:PORTRAIT_ORIGIN+'/portrait#'+id,download:PORTRAIT_ORIGIN+'/api/portrait?id='+id+'&download=1'};
}
export function deliveryActions(links){
 return {html:`<p><a href="${links.download}" style="display:inline-block;padding:16px 22px;margin:6px;background:#101c35;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:bold">Download Image</a><a href="${links.page}" style="display:inline-block;padding:16px 22px;margin:6px;background:#e8d8b1;color:#101c35;border-radius:8px;text-decoration:none;font-weight:bold">Share Image</a></p><p style="font-size:13px">Tap Share Image, then tap Share Image on the portrait page to choose an app on your device. You choose where to share and complete your own post. Keep the attached image as your backup.</p>`,text:'\nDownload Image: '+links.download+'\nShare your image: '+links.page+'\nYou choose where to share and complete your own post. Keep the attachment as your backup.\n'};
}
