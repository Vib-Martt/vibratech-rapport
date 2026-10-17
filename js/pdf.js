
(function(){
const btn=document.getElementById('downloadPdf');
const W=1240,H=1754,LEFT=76,RIGHT=1164,CONTENT=RIGHT-LEFT,BOTTOM=1650;
const green='#08785c', pale='#e7f3ed', dark='#18392f', gray='#63756e';
function safeName(v){return (v||'Client').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[\\/:*?"<>|\x00-\x1f]/g,'-').replace(/\s+/g,' ').trim().replace(/[. ]+$/,'').slice(0,85)||'Client'}
function fileName(d){return safeName(d.client)+' '+(/^\d{4}-\d{2}-\d{2}$/.test(d.date||'')?d.date:'sans-date')+'.pdf'}
function imageLoad(src){return new Promise((resolve,reject)=>{let im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src=src})}
function wrap(ctx,str,max){const lines=[];for(const para of String(str??'—').split(/\r?\n/)){let line='';for(const word of para.split(/\s+/)){let test=line?line+' '+word:word;if(ctx.measureText(test).width<=max){line=test;continue}if(line)lines.push(line);line='';let partial='';for(const ch of word){if(ctx.measureText(partial+ch).width>max&&partial){lines.push(partial);partial=''}partial+=ch}line=partial}lines.push(line||' ')}return lines}
async function generate(){
 const d=snapshot(),t=totals();const logo=await imageLoad(LOGO_DATA);
 const sig=d.signature?await imageLoad(d.signature):null;
 let pages=[],canvas,ctx,y=0;
 const font=(sz=21,bold=false)=>{ctx.font=(bold?'bold ':'')+sz+'px Arial, sans-serif'};
 const txt=(s,x,yy,sz=21,bold=false,color=dark)=>{font(sz,bold);ctx.fillStyle=color;ctx.fillText(String(s??'—'),x,yy)};
 const rule=(yy,color='#d5e5dc',width=1)=>{ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(LEFT,yy);ctx.lineTo(RIGHT,yy);ctx.stroke()};
 const rect=(x,yy,w,h,fill)=>{ctx.fillStyle=fill;ctx.fillRect(x,yy,w,h)};
 function newPage(){canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;ctx=canvas.getContext('2d');rect(0,0,W,H,'#fff');pages.push(canvas);y=72;
  // One aligned header: larger logo on the left and right-aligned company details.
  let ratio=Math.min(300/logo.width,125/logo.height);
  ctx.drawImage(logo,LEFT,47,logo.width*ratio,logo.height*ratio);
  ctx.textAlign='right';
  txt('LES SERVICES VIBRATECH INC.',RIGHT,92,22,true,green);
  txt('955 Rue Reverchon, Saint-Laurent, QC H4T 4L2',RIGHT,121,16,false,gray);
  txt('514 259-6173  ·  info@vibratech.ca',RIGHT,147,16,false,gray);
  ctx.textAlign='left';
  rule(178,green,4);y=199;
 }
 function finishPage(){const old=ctx;rule(1680,green,3);txt('Document produit à partir du formulaire de visite mobile.',LEFT,1705,13,false,gray);ctx.textAlign='right';txt('VOTRE PARTENAIRE EN FIABILITÉ',RIGHT,1705,15,true,green);ctx.textAlign='left';}
 function ensure(h){if(y+h>BOTTOM){finishPage();newPage()}}
 function heading(label){ensure(49);rect(LEFT,y,CONTENT,35,pale);rect(LEFT,y,5,35,green);txt(label,LEFT+16,y+24,20,true,green);y+=44}
 function twoFields(items){for(let i=0;i<items.length;i+=2){const pair=items.slice(i,i+2);font(19);const lines=pair.map(([k,v])=>wrap(ctx,v||'—',480));let height=Math.max(...lines.map(a=>a.length))*25+29;ensure(height+8);pair.forEach(([k,v],j)=>{if(!k)return;let x=LEFT+j*(CONTENT/2+4);txt(k,x+9,y+17,16,true,green);lines[j].forEach((l,idx)=>txt(l,x+9,y+42+idx*25,19))});y+=height;rule(y);y+=5}}
 function paragraphs(value){font(20);const lines=wrap(ctx,value||'—',CONTENT-30);let i=0;while(i<lines.length){ensure(35);txt(lines[i],LEFT+12,y+23,20);y+=29;i++}y+=5}
 function materialTable(items){heading('MATÉRIAUX UTILISÉS');let head=()=>{ensure(35);rect(LEFT,y,CONTENT,33,pale);txt('Qté',LEFT+10,y+23,18,true,green);txt('Description',LEFT+122,y+23,18,true,green);y+=33};head();if(!items.length)items=[{quantity:'—',description:'Aucun matériau indiqué'}];for(const item of items){font(18);const lines=wrap(ctx,item.description||'—',CONTENT-145);let h=Math.max(32,lines.length*24+9);if(y+h>BOTTOM){finishPage();newPage();heading('MATÉRIAUX UTILISÉS (SUITE)');head()};txt(item.quantity||'—',LEFT+10,y+23,18);lines.forEach((l,j)=>txt(l,LEFT+122,y+23+j*24,18));y+=h;rule(y)}}
 newPage();
 ensure(65);rect(LEFT,y,CONTENT,49,green);txt('RAPPORT DE VISITE',LEFT+15,y+33,30,true,'#fff');ctx.textAlign='right';txt('Début : '+(d.days[0]?.date||'—'),RIGHT-14,y+30,18,false,'#fff');ctx.textAlign='left';y+=61;
 twoFields([['Référence',d.reference],['Commande du client',d.commande],['Technicien',d.technicien],['Client',d.client],['Type',d.type],['Adresse de facturation',d.facturation],['Équipement',d.equipement],['Site des travaux',d.site],['',''],['Contact / téléphone / courriel',[d.contact,d.telephone,d.email].filter(Boolean).join(' / ')]]);
 heading('TRAVAUX EFFECTUÉS');paragraphs(d.travaux);
 materialTable((d.materials||[]).slice(0,10).filter(m=>String(m.quantity||'').trim()||String(m.description||'').trim()));
 heading('HEURES ET DÉPLACEMENTS');
 // Les heures affichées proviennent de chaque journée, sans recalcul approximatif.
 for(let i=0;i<d.days.length;i++){
  const day=d.days[i],dt=dayTotals(day),clock=v=>/^\d{2}:\d{2}$/.test(v||'')?v:'—';
  ensure(82);
  rect(LEFT,y,CONTENT,30,pale);
  txt('JOURNÉE '+(i+1)+' — '+(day.date||'Sans date'),LEFT+10,y+21,18,true,green);y+=36;
  // Quatre heures sur une seule ligne pour économiser l'espace du rapport PDF.
  const moments=[['Départ Vbt',day.departVbt],['Arrivée client',day.arriveeClient],['Départ client',day.departClient],['Retour Vbt',day.arriveeVbt]];
  moments.forEach(([label,time],j)=>txt(label+' : '+clock(time),LEFT+12+j*(CONTENT-24)/4,y+20,15));
  y+=27;
  txt('Chez client : '+fmt(dt.onsite)+'     Déplacement : '+fmt(dt.travel)+'     Km : '+(day.km||'0'),LEFT+12,y+21,17);
  y+=33;rule(y);y+=6;
 }
 const all=totalDays(d.days);
 twoFields([['TOTAL — Temps chez le client',fmt(all.onsite)],['TOTAL — Déplacement / km',fmt(all.travel)+' / '+all.km+' km']]);
 heading('VÉRIFICATION AVANT DE QUITTER');const checks=[['Cadenas retirés','cadenas'],['Système en marche','marche'],['Travaux à continuer','continuer'],['Soumission à venir','soumission'],['Satisfaction confirmée','satisfaction']];ensure(69);checks.forEach(([label,key],i)=>{const x=LEFT+i*CONTENT/5; font(15,true);const parts=wrap(ctx,label,CONTENT/5-14);parts.forEach((l,j)=>txt(l,x+5,y+17+j*17,15,true,green));txt(d[key]?'Oui':'Non',x+5,y+58,18,true)});y+=78;
 ensure(155);heading('ACCEPTATION DU CLIENT');font(19);const signerText='Signataire : '+(d.signataire||'—'),dateText='Date : '+(d.dateSignature||'—');const signerWidth=Math.min(CONTENT-445,Math.max(ctx.measureText(signerText).width,ctx.measureText(dateText).width));const signerLines=wrap(ctx,signerText,signerWidth);const acceptHeight=Math.max(103,signerLines.length*25+57);ensure(acceptHeight);const signatureX=LEFT+10+signerWidth+16;signerLines.forEach((line,i)=>txt(line,LEFT+10,y+27+i*25,19));txt(dateText,LEFT+10,y+32+signerLines.length*25,19);rect(signatureX,y-2,405,92,'#f5faf7');if(sig){let r=Math.min(390/sig.width,82/sig.height);ctx.drawImage(sig,signatureX+5+(390-sig.width*r)/2,y+3,sig.width*r,sig.height*r)}else txt('Signature : __________________',signatureX+18,y+45,17);y+=acceptHeight;
 finishPage();await window.VBTPhotos.appendPdfPages({d,newPage,finishPage,heading,paragraphs,imageLoad,drawImage:(im,x,yy,w,h)=>ctx.drawImage(im,x,yy,w,h),getY:()=>y,setY:v=>{y=v},getCtx:()=>ctx,CONTENT,LEFT,RIGHT,BOTTOM,green,dark,gray,txt,wrap});return {pages,filename:fileName(d)}
}
function encodePdf(pages){
 // A4 page contains a JPEG rendering; no network or external PDF library required.
 const encoder=new TextEncoder(),objects=[null];
 const add=x=>{objects.push(x);return objects.length-1};
 const catalog=add(null),pagesRef=add(null),pageIds=[];
 for(const canvas of pages){const uri=canvas.toDataURL('image/jpeg',0.88),binary=atob(uri.split(',')[1]);const img=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)img[i]=binary.charCodeAt(i);
 const imageId=add({head:`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>`,stream:img});
 const cmd=encoder.encode('q 595.28 0 0 841.89 0 0 cm /Im0 Do Q');const contentId=add({head:`<< /Length ${cmd.length} >>`,stream:cmd});
 pageIds.push(add(`<< /Type /Page /Parent ${pagesRef} 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`));}
 objects[catalog]=`<< /Type /Catalog /Pages ${pagesRef} 0 R >>`;objects[pagesRef]=`<< /Type /Pages /Kids [${pageIds.map(i=>i+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
 const parts=[],offsets=[0];let pos=0;const push=bytes=>{parts.push(bytes);pos+=bytes.length};const put=s=>push(encoder.encode(s));put('%PDF-1.4\n');
 for(let i=1;i<objects.length;i++){offsets[i]=pos;put(`${i} 0 obj\n`);let o=objects[i];if(typeof o==='string')put(o+'\n');else{put(o.head+'\nstream\n');push(o.stream);put('\nendstream\n')}put('endobj\n')}
 const xref=pos;put(`xref\n0 ${objects.length}\n0000000000 65535 f \n`);for(let i=1;i<objects.length;i++)put(String(offsets[i]).padStart(10,'0')+' 00000 n \n');put(`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`);
 return new Blob(parts,{type:'application/pdf'});
}
// iPhone/iPad standalone apps may not open window.print(). Share the actual PDF instead.
const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(isIOS){
 el('print').textContent='Partager / imprimer le PDF';
 el('print').onclick=async()=>{
  const printBtn=el('print');printBtn.disabled=true;
  try{
   const {pages,filename}=await generate();const blob=encodePdf(pages);
   const file=new File([blob],filename,{type:'application/pdf'});
   if(navigator.canShare&&navigator.canShare({files:[file]})){
    await navigator.share({files:[file],title:filename});
    el('status').textContent='PDF prêt : choisissez Imprimer dans le menu de partage, ou enregistrez-le dans Fichiers.';
   }else{
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
    el('status').textContent='Ouvrez le PDF dans Fichiers, puis Partager → Imprimer.';
   }
  }catch(e){if(e.name!=='AbortError'){el('status').textContent='Impression indisponible : téléchargez le PDF, puis ouvrez Fichiers → Partager → Imprimer.';alert(el('status').textContent)}}
  finally{printBtn.disabled=false}
 };
}
btn.addEventListener('click',async()=>{if(!validateClient())return;const previousFinished=reportFinished;if(!signed&&!confirm('La signature du client est absente. Voulez-vous terminer et télécharger le PDF quand même ?'))return;reportFinished=true;renderDays();btn.disabled=true;const old=btn.textContent;btn.textContent='Création du PDF…';try{const {pages,filename}=await generate();if(typeof window.vbtSaveReportForPdf!=='function'||!window.vbtSaveReportForPdf()){reportFinished=previousFinished;renderDays();return;}document.dispatchEvent(new Event('vbt-report-saved'));const blob=encodePdf(pages),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();el('status').textContent='Rapport enregistré dans l’historique et PDF téléchargé : '+filename+' ('+pages.length+' page(s)).';setTimeout(()=>URL.revokeObjectURL(url),60000)}catch(e){reportFinished=previousFinished;renderDays();console.error(e);alert('Impossible de générer le PDF : '+e.message)}finally{btn.disabled=false;btn.textContent=old}});
})();
