const status=document.querySelector('#status');
let objectUrl=null,file=null,request=null,epoch=0;
function clear(){if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=null;file=null;document.querySelector('#portrait').hidden=true;document.querySelector('#portrait').removeAttribute('src');document.querySelector('#actions').hidden=true;document.querySelector('#download').removeAttribute('href');}
async function load(){
 const current=++epoch;request?.abort();request=new AbortController();clear();
 const id=location.hash.slice(1);history.replaceState(null,'',location.pathname);
 if(!/^[a-f0-9]{64}$/.test(id)){status.textContent='This portrait link is missing or invalid. Please use the image attached to your email.';return;}
 status.textContent='Loading your image…';
 try{
 const response=await fetch('/api/portrait?id='+id,{cache:'no-store',referrerPolicy:'no-referrer',signal:request.signal});
 if(!response.ok)throw Error();
 const blob=await response.blob();if(current!==epoch)return;
 file=new File([blob],'royal-wine-portrait.'+(blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'),{type:blob.type});
 objectUrl=URL.createObjectURL(blob);
 const image=document.querySelector('#portrait');image.src=objectUrl;await image.decode();if(current!==epoch)return;
 image.hidden=false;document.querySelector('#download').href=objectUrl;document.querySelector('#download').download=file.name;document.querySelector('#actions').hidden=false;status.textContent='Your branded image is ready.';
 }catch{if(current===epoch)status.textContent='This portrait is unavailable right now. Please use the image attached to your email.';}
}
document.querySelector('#share').addEventListener('click',async()=>{
 if(!file)return;
 if(typeof navigator.share==='function' && (!navigator.canShare || navigator.canShare({files:[file]}))){try{await navigator.share({files:[file],title:'My Royal Wine portrait'});status.textContent='Your image was shared with the app you chose.';}catch(e){if(e.name!=='AbortError')status.textContent='Sharing is unavailable. Download the image and upload it in your preferred app.';}}
 else status.textContent='This browser cannot open image sharing. Tap Download Image, then open the saved portrait in your preferred app.';
});
addEventListener('hashchange',()=>void load());
addEventListener('pagehide',()=>{++epoch;request?.abort();clear();});
void load();
