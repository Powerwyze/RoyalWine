const byId=id=>document.getElementById(id);
async function check(){
  byId('refresh').disabled=true;byId('statusTitle').textContent='Checking configuration…';
  try{
    const response=await fetch('/api/health',{cache:'no-store',signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new Error('Unavailable');
    const status=await response.json();if(status.packetId!=='DEMO-009')throw new Error('Unexpected app');
    const ai=status.voiceConfigured===true&&status.imageConfigured===true,email=status.emailConfigured===true,host=status.hostEnabled===true;
    byId('aiStatus').textContent=ai?'Present · live test needed':'Key pending';
    byId('emailStatus').textContent=email?'Present · delivery test needed':'Credentials pending';
    byId('hostStatus').textContent=host?'Enabled':'Set ENABLE_FACE_HOST=true';
    byId('statusTitle').textContent=ai&&email&&host?'Configured · live checks next':'Build complete · keys pending';
    byId('statusSummary').textContent=ai&&email&&host?'Refresh the kiosk and complete the live checklist below before welcoming guests.':'The app is deployed. Add the missing credentials and redeploy to activate the guest experience.';
  }catch{
    byId('statusTitle').textContent='Configuration could not be checked';
    byId('statusSummary').textContent='Check your connection and try again. The service may be redeploying.';
    for(const id of ['aiStatus','emailStatus','hostStatus'])byId(id).textContent='Unknown';
  }finally{byId('refresh').disabled=false;}
}
byId('refresh').addEventListener('click',check);check();
