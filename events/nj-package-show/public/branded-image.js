export const BRAND_LOGOS=[
 {src:'/assets/royal-wine-logo.png',label:'Kedem'},
 {src:'/assets/bartenura-logo.jpg',label:'Bartenura'},
 {src:'/assets/black-irish-logo.png',label:'Black Irish'}
];
async function loadLogo(src){
 const response=await fetch(src,{cache:'force-cache'});
 if(!response.ok)throw new Error('A brand logo could not load. Please try again.');
 return createImageBitmap(await response.blob());
}
export async function brandPortrait(blob){
 const portrait=await createImageBitmap(blob);
 const logos=[];
 try{
  for(const brand of BRAND_LOGOS)logos.push(await loadLogo(brand.src));
  const w=portrait.width,h=portrait.height,band=Math.round(w*.30);
  const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h+band;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(portrait,0,0);
  ctx.fillStyle='#ffffff';ctx.fillRect(0,h,w,band);
  ctx.fillStyle='#b49b60';ctx.fillRect(0,h,w,Math.max(3,w*.005));
  ctx.fillStyle='#101c35';ctx.textAlign='center';
  ctx.font='bold '+Math.round(w*.032)+'px Arial';
  ctx.fillText('ROYAL WINE · NJ PACKAGE SHOW',w/2,h+band*.20);
  const cell=w/3,pad=w*.035,top=h+band*.30,logoH=band*.40;
  logos.forEach((logo,i)=>{
   const scale=Math.min((cell-pad*2)/logo.width,logoH/logo.height);
   const lw=logo.width*scale,lh=logo.height*scale;
   ctx.drawImage(logo,cell*i+(cell-lw)/2,top+(logoH-lh)/2,lw,lh);
  });
  ctx.font=Math.round(w*.021)+'px Arial';ctx.fillStyle='#526077';
  ctx.fillText('AI-created portrait · Powered by PowerWyze',w/2,h+band*.88);
  const output=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.94));
  canvas.width=canvas.height=0;
  if(!output)throw new Error('The branded portrait could not be prepared.');
  return output;
 }finally{portrait.close();logos.forEach(logo=>logo.close());}
}
