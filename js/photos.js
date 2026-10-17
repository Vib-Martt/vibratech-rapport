
/* Photos stored in IndexedDB: avoid browser localStorage quotas and keep the existing reports compact. */
(()=>{
'use strict';
const DB='vibratech_photos_v18', STORE='photos';let photos=[];let generation=0;let dbPromise;
const $=id=>document.getElementById(id);
function db(){if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{if(!window.indexedDB)return reject(new Error('Stockage de photos indisponible'));const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});return dbPromise}
async function put(record){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record);tx.oncomplete=ok;tx.onerror=()=>no(tx.error)})}
async function get(id){const d=await db();return new Promise((ok,no)=>{const tx=d.transaction(STORE,'readonly'),r=tx.objectStore(STORE).get(id);r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)})}
function mark(){document.getElementById('client')?.dispatchEvent(new Event('input',{bubbles:true}))}
function snapshot(){return photos.map(({id,caption})=>({id,caption}))}
function render(){const root=$('v18photos');if(!root)return;root.replaceChildren();for(const [index,p] of photos.entries()){
const box=document.createElement('div');box.className='v18item';const img=document.createElement('img');img.alt='Photo '+(index+1);img.loading='lazy';if(p.data)img.src=p.data;
const label=document.createElement('label');label.textContent='Description de la photo '+(index+1);const input=document.createElement('textarea');input.value=p.caption||'';input.placeholder='Ex. Roulement endommagé avant remplacement';input.addEventListener('input',()=>{p.caption=input.value;mark()});
const row=document.createElement('div');row.className='v18row';const number=document.createElement('span');number.className='v18count';number.textContent='Photo '+(index+1);const remove=document.createElement('button');remove.type='button';remove.textContent='Supprimer';remove.addEventListener('click',()=>{if(!confirm('Retirer cette photo du rapport ?'))return;photos=photos.filter(x=>x!==p);render();mark()});row.append(number,remove);box.append(img,label,input,row);root.append(box)
}}
async function load(items){const seq=++generation;photos=(Array.isArray(items)?items:[]).filter(x=>x&&x.id).map(x=>({id:x.id,caption:x.caption||'',data:''}));render();for(const p of photos){try{const r=await get(p.id);if(seq!==generation)return;if(r)p.data=r.data;else p.missing=true;renderPreserve()}catch(e){console.warn('Photo inaccessible',e)}}}
function renderPreserve(){const inputs=[...$('v18photos').querySelectorAll('textarea')];const focused=document.activeElement;const i=inputs.indexOf(focused);const pos=i>=0?focused.selectionStart:0;render();if(i>=0){const next=$('v18photos').querySelectorAll('textarea')[i];if(next){next.focus();next.setSelectionRange(pos,pos)}}}
function reset(){generation++;photos=[];render();if($('v18pick'))$('v18pick').value=''}
function compress(file){return new Promise((resolve,reject)=>{const url=URL.createObjectURL(file),im=new Image();im.onload=()=>{try{const max=1700,r=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.max(1,Math.round(im.width*r));c.height=Math.max(1,Math.round(im.height*r));c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.79))}catch(e){reject(e)}finally{URL.revokeObjectURL(url)}};im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Image non reconnue'))};im.src=url})}
$('v18pick').addEventListener('change',async e=>{const files=[...e.target.files];e.target.value='';if(!files.length)return;const status=$('v18storage');status.textContent='Traitement des photos en cours…';let count=0;for(const f of files){try{const data=await compress(f);const id='photo-'+Date.now()+'-'+Math.random().toString(36).slice(2);await put({id,data});photos.push({id,caption:'',data});count++;render();mark()}catch(err){alert('Impossible d’ajouter '+f.name+' : '+err.message)}}status.textContent=count+' photo(s) ajoutée(s). Elles sont stockées sur cet appareil, dans ce navigateur.'});
async function appendPdfPages(o){
 if(!photos.length)return;
 // Deux photos par page au maximum; un format vertical ou une longue légende
 // peuvent réduire la taille de l'image, sans jamais la déformer.
 const TOP=245, GAP=28, SLOT=640, CAPTION_MAX=230;
 let pageStarted=false, slot=0;
 for(let i=0;i<photos.length;i++){
  const p=photos[i];let data=p.data;
  if(!data){const r=await get(p.id);data=r?.data}
  if(!data)throw new Error('Une photo du rapport est introuvable. Vérifie l’onglet Photos.');
  const im=await o.imageLoad(data);
  if(!pageStarted||slot===2){
   if(pageStarted)o.finishPage();
   o.newPage();o.heading('PHOTOS DE L’INTERVENTION');
   pageStarted=true;slot=0;
  }
  const top=TOP+slot*(SLOT+GAP);
  o.setY(top);
  o.txt('Photo '+(i+1)+' / '+photos.length,o.LEFT+8,top+20,20,true,o.green);
  // Légendes sous chaque image, avec retour à la ligne automatique.
  const caption=p.caption?.trim()||'Aucune description';
  const ctx=o.getCtx();ctx.font='18px Arial, sans-serif';
  const lines=o.wrap(ctx,caption,o.CONTENT-32);
  const maxLines=Math.max(1,Math.floor(CAPTION_MAX/23));
  const shown=lines.slice(0,maxLines);
  const captionH=shown.length*23+22;
  const imageH=SLOT-44-captionH;
  const ratio=Math.min(o.CONTENT/im.width,imageH/im.height);
  const w=im.width*ratio,h=im.height*ratio;
  o.drawImage(im,o.LEFT+(o.CONTENT-w)/2,top+33,w,h);
  const labelY=top+36+h+13;
  o.txt('Description :',o.LEFT+8,labelY,17,true,o.green);
  shown.forEach((line,j)=>o.txt(line,o.LEFT+12,labelY+23+j*23,18));
  if(lines.length>shown.length)o.txt('… (description abrégée)',o.LEFT+12,labelY+23+shown.length*23,16,false,o.gray);
  slot++;
 }
 if(pageStarted)o.finishPage();
}

window.VBTPhotos={snapshot,load,reset,appendPdfPages};render();
})();
