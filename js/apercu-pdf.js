/* Aperçu en mémoire : aucun enregistrement ni téléchargement. */
(()=>{
 'use strict';
 const button=document.getElementById('previewPdf');
 const dialog=document.getElementById('pdfPreviewDialog');
 const pagesBox=document.getElementById('pdfPreviewPages');
 const status=document.getElementById('pdfPreviewStatus');
 const zoom=document.getElementById('pdfPreviewZoom');
 let generation=0,previousOverflow='';
 function resetZoom(){pagesBox.classList.remove('zoomed');zoom.setAttribute('aria-pressed','false');zoom.textContent='Agrandir'}
 dialog.addEventListener('close',()=>{
  generation++;
  pagesBox.replaceChildren();resetZoom();zoom.disabled=true;
  document.body.style.overflow=previousOverflow;
  button.focus({preventScroll:true});
 });
 document.getElementById('closePdfPreview').addEventListener('click',()=>dialog.close());
 zoom.addEventListener('click',()=>{
  const expanded=pagesBox.classList.toggle('zoomed');
  zoom.setAttribute('aria-pressed',String(expanded));
  zoom.textContent=expanded?'Adapter à l’écran':'Agrandir';
 });
 button.addEventListener('click',async()=>{
  if(button.disabled)return;
  if(!validateClient())return;
  const current=++generation;
  button.disabled=true;
  const originalText=button.textContent;
  button.textContent='Préparation de l’aperçu…';
  pagesBox.replaceChildren();resetZoom();zoom.disabled=true;
  status.textContent='Préparation de l’aperçu…';
  previousOverflow=document.body.style.overflow;
  try{
   dialog.showModal();document.body.style.overflow='hidden';
   const {pages}=await window.VBTPdf.renderPreview();
   if(current!==generation||!dialog.open)return;
   pages.forEach((page,index)=>{
    page.setAttribute('role','img');
    page.setAttribute('aria-label','Page '+(index+1)+' sur '+pages.length+' du rapport');
    pagesBox.append(page);
   });
   status.textContent=pages.length+' page(s) — Consultation seulement, sans terminer ni enregistrer le rapport.';
   zoom.disabled=false;
  }catch(error){
   if(current===generation){
    status.textContent=error?.code==='PHOTO_UNAVAILABLE'
     ? 'Aperçu indisponible : '+error.message
     : 'Impossible de préparer l’aperçu. Fermez cette fenêtre et réessayez.';
    if(!dialog.open)alert(status.textContent);
    console.error(error);
   }
  }finally{
   if(!dialog.open)document.body.style.overflow=previousOverflow;
   button.disabled=false;button.textContent=originalText;
  }
 });
})();
