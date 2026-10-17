
/* v13 : recherche directe d'entreprise dans le formulaire Client. Réutilise le répertoire v9. */
(()=>{
'use strict';
const input=document.getElementById('client');
const box=document.getElementById('v13suggestions');
const select=document.getElementById('v9clientSelect');
const apply=document.getElementById('v9apply');
if(!input||!box||!select||!apply)return;

const normalize=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('fr').trim();
function close(){box.hidden=true;box.replaceChildren()}
function show(){
 const q=normalize(input.value);
 box.replaceChildren();
 if(!q){close();return}
 const matches=[...select.options].filter(o=>o.value&&normalize(o.textContent).includes(q)).slice(0,12);
 if(!matches.length){const msg=document.createElement('div');msg.className='v13empty';msg.textContent='Nouveau client : ce nom peut être utilisé sans fiche au répertoire.';box.append(msg)}
 for(const o of matches){
   const btn=document.createElement('button');btn.type='button';
   const name=document.createElement('span');name.textContent=o.textContent;
   btn.append(name);
   btn.addEventListener('click',()=>{
      const selectedId=o.value;
      select.value=selectedId;
      // L'action d'origine vérifie si des données risquent d'être remplacées.
      apply.click();
      close()
   });
   box.append(btn);
 }
 const manual=document.createElement('button');manual.type='button';
 const typedName=input.value.trim();manual.textContent='Utiliser ce nom : '+typedName;
 manual.addEventListener('click',()=>{input.value=typedName;input.dispatchEvent(new Event('change',{bubbles:true}));if(typeof markDirty==='function')markDirty();close();input.blur()});
 box.append(manual);
 box.hidden=false;
}
input.addEventListener('input',show);
input.addEventListener('focus',show);
input.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
document.addEventListener('click',e=>{if(!input.contains(e.target)&&!box.contains(e.target))close()});
})();
