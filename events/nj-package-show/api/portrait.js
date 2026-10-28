import {get} from '@vercel/blob';
import {validPortraitId} from '../lib/portrait-delivery.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','private, no-store');res.setHeader('Referrer-Policy','no-referrer');
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Robots-Tag','noindex, nofollow, noarchive');
 if(req.method!=='GET')return res.status(405).end();
 const id=req.query?.id;
 if(!validPortraitId(id))return res.status(404).send('Portrait unavailable. Please use the image attached to your email.');
 try{
 const result=await get('nj-portraits/'+id+'.image',{access:'private'});
 if(!result||result.statusCode!==200)return res.status(404).send('Portrait unavailable. Please use the image attached to your email.');
 const mime=['image/jpeg','image/png','image/webp'].includes(result.blob.contentType)?result.blob.contentType:'application/octet-stream';
 res.setHeader('Content-Type',mime);
 res.setHeader('Content-Disposition',(req.query.download==='1'?'attachment':'inline')+'; filename="royal-wine-nj-portrait.'+(mime==='image/png'?'png':mime==='image/webp'?'webp':'jpg')+'"');
 const reader=result.stream.getReader();
 for(;;){const {done,value}=await reader.read();if(done)break;res.write(Buffer.from(value));}res.end();
 }catch{if(!res.headersSent)return res.status(503).send('Portrait temporarily unavailable. Please use your email attachment.');res.end();}
}
