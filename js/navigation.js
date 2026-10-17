
(()=>{
 const menu=document.getElementById('v12menu');
 const tabs=[...document.querySelectorAll('[data-v12-tab]')];
 const panels=[...document.querySelectorAll('[data-v12-panel]')];
 const anchor=document.createElement('div');anchor.id='v12anchor';menu.before(anchor);
 const KEY='vibratech_main_tab_v12';
 function openPanel(which,scroll=true){
  if(!['rapport','clients','historique','synchronisation'].includes(which))which='rapport';
  tabs.forEach(b=>b.setAttribute('aria-selected',String(b.dataset.v12Tab===which)));
  panels.forEach(p=>{p.hidden=p.dataset.v12Panel!==which});
  try{localStorage.setItem(KEY,which)}catch(e){}
  if(scroll){
   document.documentElement.style.overflowAnchor='none';document.body.style.overflowAnchor='none';
   const go=()=>window.scrollTo({top:Math.max(0,window.scrollY+anchor.getBoundingClientRect().top-8),behavior:'instant'});
   go();requestAnimationFrame(()=>{go();document.documentElement.style.overflowAnchor='';document.body.style.overflowAnchor=''})
  }
 }
 tabs.forEach(b=>b.addEventListener('click',()=>openPanel(b.dataset.v12Tab)));
 document.getElementById('v12new').addEventListener('click',()=>document.getElementById('new').click());
 // Keep the existing dashboard actions functional if called by other scripts.
 document.getElementById('v9goClients')?.addEventListener('click',()=>openPanel('clients'));
 document.getElementById('v9goHistory')?.addEventListener('click',()=>openPanel('historique'));
 // After selecting a client or opening a saved report, show the form.
 document.getElementById('v9apply')?.addEventListener('click',()=>{if(document.getElementById('v9clientSelect').value)openPanel('rapport')});
 document.getElementById('v9clientList')?.addEventListener('click',e=>{if(e.target.closest('button')?.textContent.trim()==='Utiliser')openPanel('rapport')});
 document.getElementById('historyList')?.addEventListener('click',e=>{const t=e.target.closest('button')?.textContent.trim().toLowerCase()||'';if(t.includes('charger')||t.includes('ouvrir')||t.includes('reprendre'))openPanel('rapport')});
 openPanel('rapport',false);
})();
