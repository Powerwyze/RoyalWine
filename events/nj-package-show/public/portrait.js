const status=document.querySelector('#status'),id=location.hash.slice(1);
history.replaceState(null,'',location.pathname);
let objectUrl=null,file=null;
async function load(){
 if(!/^[a-f0-9]{64}$/.test(id)){status.textContent='This portrait link is missing or invalid. Please use the image attached to your email.';return;}
 try{
 const response=await fetch('/api/portrait?id='+id,{cache:'no-store',referrerPolicy:'no-referrer'});
 if(!response.ok)throw Error();
 const blob=await response.blob();file=new File([blob],'royal-wine-nj-portrait.'+(blob.type==='image/png'?'png':blob.type==='image/webp'?'webp':'jpg'),{type:blob.type});
 objectUrl=URL.createObjectURL(blob);
 const image=document.querySelector('#portrait');image.src=objectUrl;await image.decode();
 image.hidden=false;document.querySelector('#download').href=objectUrl;document.querySelector('#download').download=file.name;document.querySelector('#actions').hidden=false;status.textContent='Your branded image is ready.';
 }catch{status.textContent='This portrait is unavailable right now. Please use the image attached to your email.';}
}
document.querySelector('#share').addEventListener('click',async()=>{
 if(!file)return;
 if(navigator.canShare?.({files:[file]})){try{await navigator.share({files:[file],title:'My Royal Wine portrait'});status.textContent='Share window closed. Complete your post in the app you chose.';}catch(e){if(e.name!=='AbortError')status.textContent='Sharing is unavailable. Download the image and upload it in your preferred app.';}}
 else status.textContent='Download your image, then upload it in your preferred social app. Nothing is posted automatically.';
});
addEventListener('pagehide',()=>{if(objectUrl)URL.revokeObjectURL(objectUrl);file=null;});
void load();
