
(()=>{
 const KEY='vibratech_ui_tab_v11';
 const tabs=[...document.querySelectorAll('[data-v11-tab]')];
 const sections=[...document.querySelectorAll('[data-v11-section]')];
 const prev=document.getElementById('v11prev'),next=document.getElementById('v11next');
 const toggle=document.getElementById('v11toggle'),bottom=document.getElementById('v11bottom');
 const progress=document.getElementById('v11progress'),nav=document.getElementById('v11navigation');
 const navAnchor=document.createElement('div');
 navAnchor.id='v11scrollAnchor';
 navAnchor.setAttribute('aria-hidden','true');
 navAnchor.style.cssText='height:0;margin:0;padding:0;pointer-events:none;overflow:hidden';
 nav.parentNode.insertBefore(navAnchor,nav);
 let current=0,all=false;
 if(!Number.isInteger(current)||current<0||current>5)current=0;
 function show(scroll=false){
   tabs.forEach((b,i)=>{b.setAttribute('aria-selected',String(i===current));b.tabIndex=i===current?0:-1});
   sections.forEach(el=>{el.hidden=!all&&Number(el.dataset.v11Section)!==current});
   bottom.hidden=all;
   toggle.textContent=all?'Afficher les onglets':'Afficher tout';
   progress.textContent=(current+1)+' / 6';
   prev.disabled=current===0;next.disabled=current===5;
   next.textContent=current===5?'Dernière étape ✓':'Suivant →';
   if(scroll){
     // Mesurer un repère NON sticky plutôt que la position du menu sticky.
     // Le menu sticky a un top de 0 même lorsque sa position réelle est plus haut.
     const targetY=()=>Math.max(0,window.scrollY+navAnchor.getBoundingClientRect().top-8);
     document.documentElement.style.overflowAnchor='none';
     document.body.style.overflowAnchor='none';
     window.scrollTo({top:targetY(),behavior:'instant'});
     requestAnimationFrame(()=>{
       window.scrollTo({top:targetY(),behavior:'instant'});
       document.documentElement.style.overflowAnchor='';
       document.body.style.overflowAnchor='';
     });
   }
 }
 function select(i){all=false;current=Math.max(0,Math.min(5,i));try{localStorage.setItem(KEY,String(current))}catch(e){}show(true)}
 tabs.forEach(b=>b.addEventListener('click',()=>select(Number(b.dataset.v11Tab))));
 prev.addEventListener('click',()=>select(current-1));next.addEventListener('click',()=>select(current+1));
 toggle.addEventListener('click',()=>{all=!all;show(false)});
 // Un nouveau rapport commence à l'onglet Client, sauf si l'utilisateur récupère un brouillon.
 document.getElementById('new')?.addEventListener('click',()=>select(0));
 show();
})();
