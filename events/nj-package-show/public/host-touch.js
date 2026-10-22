export function mountTouchControls({getState,start,voice,action,finish,labels}){
 const panel=document.getElementById('touchControls');let last='';
 function render(){
  const s=getState(),signature=JSON.stringify(s);if(signature===last)return;last=signature;
  panel.hidden=s.emailOpen;
  document.querySelectorAll('[data-theme]').forEach(b=>{b.disabled=!s.configured||['connecting','preparing','countdown','generating','result'].includes(s.phase)||s.emailOpen;b.setAttribute('aria-pressed',String(b.dataset.theme===s.themeId));b.onclick=()=>s.active?action('set_theme',{themeId:b.dataset.theme}):start(b.dataset.theme);});
  const title=document.createElement('h2');title.id='touchTitle';const help=document.createElement('p');help.className='touch-help';const row=document.createElement('div');row.className='touch-actions';
  const button=(label,id,fn,secondary=false)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.touch=id;b.className=secondary?'secondary':'primary';b.onclick=fn;row.append(b);return b;};
  if(s.phase==='idle'){
   title.textContent='Your royal portrait starts here';help.textContent='Choose a look below. Your photo will be unique.';
   button('Start my photo','start',()=>start()).disabled=!s.configured;
   button('Talk to Blue','voice',()=>voice(),true).disabled=!s.voiceConfigured;
  }else if(s.phase==='connecting'){
   title.textContent='Connecting to Blue…';button('Use touch controls','manual',()=>document.getElementById('useTouch').click());button('Cancel','cancel',finish,true);
  }else if(['preparing','countdown','generating'].includes(s.phase)){
   title.textContent=s.phase==='generating'?'Creating your royal portrait…':s.phase==='countdown'?'Look at the camera!':'Getting your camera ready…';
   help.textContent=s.emailQueued?'Your details are confirmed. Your checked photo will send when ready.':'Your portrait is in progress.';
   button('Start over','cancel',finish,true);
  }else if(s.phase==='result'){
   title.textContent=s.emailSent?'Your photo was accepted for delivery':'Your royal portrait is ready';
   button('Start over','restart',()=>start(),true);button('Finish','finish',finish,true);
  }else if(s.phase==='error'){
   title.textContent='Let’s try again';help.textContent=s.error;
   if(s.hasPhoto)button('Try again','retry',()=>action('retry_picture',{confirmed:true}));
   button('Retake photo','retake',()=>action('take_photo',{confirmed:true}));button('Start over','restart',()=>start(),true);
  }else{
   title.textContent='How many people are posing?';help.textContent=(labels[s.themeId]||'Royal Gallery')+' · Five-second countdown';
   for(const count of [1,2,3]){const b=button(count+' '+(count===1?'person':'people'),'people-'+count,()=>action('set_guest_count',{count}),s.guestCount!==count);b.setAttribute('aria-pressed',String(s.guestCount===count));}
   const b=button('Take photo','capture',()=>action('take_photo',{confirmed:true}));b.disabled=!s.guestCount;
   button('Start over','restart',()=>start(),true);
   if(!s.voiceConfigured){}else if(s.active)button('Talk to Blue','voice',()=>voice(),true);
  }
  panel.replaceChildren(title,help,row);
 }
 return {render};
}