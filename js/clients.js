
(()=>{
'use strict';
const $=id=>document.getElementById(id),KEY='vibratech_clients_v9';
const companyFields=['client','facturation','site'];
const contactFields=['contact','telephone','email'];
const fields=[...companyFields,...contactFields];
const normalize=value=>String(value||'').trim().toLocaleLowerCase('fr');
const sameSite=(a,b)=>normalize(a.client)===normalize(b.client)&&normalize(a.site)===normalize(b.site);
const picker=$('savedContact');
function contactDetails(c){
 return {contact:String(c.contact||'').trim().slice(0,1000),
  telephone:formatTelephone(c.telephone).slice(0,1000),email:String(c.email||'').trim().slice(0,1000)};
}
function savedContacts(c){
 const contacts=Array.isArray(c.contacts)?c.contacts.filter(x=>x&&typeof x==='object').map(contactDetails):[];
 const legacy=contactDetails(c);
 if(contactFields.some(field=>legacy[field])&&!contacts.some(x=>normalize(x.contact)===normalize(legacy.contact)))contacts.push(legacy);
 return contacts;
}
function refreshContactPicker(){
 const company=normalize($('client').value),site=normalize($('site').value);
 const matches=clients.filter(c=>company&&normalize(c.client)===company);
 matches.sort((a,b)=>Number(normalize(b.site)===site)-Number(normalize(a.site)===site));
 const contacts=new Map();
 for(const c of matches){
  for(const person of savedContacts(c)){
   const key=normalize(person.contact)||JSON.stringify(person);
   if(!contacts.has(key))contacts.set(key,person);
  }
 }
 const choices=[...contacts.values()];
 picker.replaceChildren(new Option('— Choisir un contact enregistré —',''),new Option('Saisir un autre contact','new'));
 for(const [index,person] of choices.entries()){
  picker.add(new Option(person.contact||person.email||person.telephone,String(index)));
 }
 picker.hidden=!choices.length;
 picker.onchange=()=>{
  if(!picker.value)return;
  const person=choices[Number(picker.value)];
  for(const field of contactFields)$(field).value=person?.[field]||'';
  markDirty();
  if(!person)$('contact').focus();
 };
}
for(const field of ['client','site'])$(field).addEventListener('input',refreshContactPicker);
document.addEventListener('vbt-client-applied',refreshContactPicker);
document.addEventListener('vbt-report-loaded',refreshContactPicker);
let clients=[];
try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(x))clients=x.filter(c=>c&&typeof c==='object'&&typeof c.id==='string')}catch(e){}
function msg(s){for(const id of ['v9msg','clientSaveStatus','clientTransferStatus']){const target=$(id);if(target&&!target.closest('[data-v12-panel]')?.hidden)target.textContent=s}}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(clients));window.VBTCloud?.changed();return true}catch(e){msg('Stockage indisponible : exportez les clients avant de quitter.');return false}}
function label(c){return (c.client||'Sans nom')+(c.site?' — '+c.site:'')}
window.VBTClients={refreshContacts:refreshContactPicker,apply:id=>{const c=clients.find(x=>x.id===id);return c?apply(c):false},get:()=>clients,set:items=>{localStorage.setItem(KEY,JSON.stringify(items));clients=items;render()}};function clean(c){const r={};for(const f of fields)r[f]=(f==='telephone'?formatTelephone(c[f]):String(c[f]||'')).slice(0,1000);return r}
function stats(){const count=typeof archive!=='undefined'?archive.length:0;$('v9reportCount').textContent=count;$('v9clientCount').textContent=clients.length;$('v9draftStatus').textContent=(typeof activeId!=='undefined'&&activeId)?'Ouvert':'Nouveau'}
function render(){const sel=$('v9clientSelect'),selected=sel.value;sel.replaceChildren(new Option('— Sélectionner un client —',''));for(const c of clients.slice().sort((a,b)=>label(a).localeCompare(label(b),'fr'))){sel.add(new Option(label(c),c.id))}sel.value=selected;const list=$('v9clientList');list.replaceChildren();for(const c of clients.slice().sort((a,b)=>label(a).localeCompare(label(b),'fr'))){const row=document.createElement('div');row.className='v9client';const detail=document.createElement('div');const title=document.createElement('strong');title.textContent=label(c);const sub=document.createElement('small');sub.textContent=savedContacts(c).map(person=>person.contact||person.email||person.telephone).filter(Boolean).join(' • ');detail.append(title,sub);const actions=document.createElement('div');actions.className='v9buttons';const use=document.createElement('button');use.textContent='Utiliser';use.onclick=()=>apply(c);const del=document.createElement('button');del.className='delete';del.textContent='Supprimer';del.onclick=()=>{if(!confirm('Supprimer cette fiche client sur les appareils synchronisés ? Les anciens rapports ne seront pas supprimés.'))return;if(window.VBTCloud?.deleted?.('client',c.id)!==true){alert('Suppression annulée. Vérifiez le stockage disponible et rechargez la version 19.7 de l’application.');return;}const before=clients;clients=clients.filter(x=>x.id!==c.id);if(!persist()){clients=before;window.VBTCloud?.cancelDeletion?.('client',c.id)}render()};actions.append(use,del);row.append(detail,actions);list.append(row)}if(!list.children.length){const e=document.createElement('p');e.className='hint';e.textContent='Aucun client correspondant.';list.append(e)}stats();refreshContactPicker()}
function apply(c){if(typeof dirty!=='undefined'&&dirty&&!confirm('Remplacer la compagnie, le site et le contact du rapport actuel ?'))return false;for(const f of companyFields)$(f).value=c[f]||'';for(const f of contactFields)$(f).value='';if(typeof markDirty==='function')markDirty();msg('Coordonnées chargées : '+label(c));stats();document.dispatchEvent(new Event('vbt-client-applied'));return true}
$('v9saveClient').onclick=()=>{
 const c=clean(Object.fromEntries(fields.map(f=>[f,$(f).value.trim()])));
 if(!c.client){msg('Saisissez d’abord le nom de la compagnie dans le rapport.');return}
 const existing=clients.find(x=>sameSite(x,c));
 if(existing&&companyFields.some(field=>String(existing[field]||'')!==c[field])&&!confirm('Mettre à jour les coordonnées de cette compagnie et de ce site ?'))return;
 const contacts=existing?savedContacts(existing):[];
 const person=contactDetails(c);
 if(contactFields.some(field=>person[field])){
  const index=contacts.findIndex(x=>normalize(x.contact)===normalize(person.contact)
   &&(person.contact||x.email===person.email&&x.telephone===person.telephone));
  if(index<0)contacts.push(person);
  else contacts[index]=person;
 }
 const company=Object.fromEntries(companyFields.map(field=>[field,c[field]]));
 const before=clients;
 // Keep the legacy contact fields readable by older exports and app versions.
 const entry={...existing,id:existing?.id||'client-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),
  ...company,...contacts[0],contacts};
 clients=existing?clients.map(x=>x===existing?entry:x):[...clients,entry];
 if(!persist()){clients=before;return}
 render();msg('Compagnie et coordonnées enregistrées dans le répertoire.');
};
$('v9clientSelect').onchange=()=>{window.VBTClients.apply($('v9clientSelect').value)};
$('v9new').onclick=()=>document.getElementById('new').click();
$('v9goClients').onclick=()=>$('v9directory').scrollIntoView({behavior:'smooth'});
$('v9goHistory').onclick=()=>document.getElementById('historyList').closest('.card').scrollIntoView({behavior:'smooth'});
$('v9exportClients').onclick=()=>{const b=new Blob([JSON.stringify({format:'vibratech-clients-v9',clients},null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='vibratech-clients-'+new Date().toLocaleDateString('en-CA')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
$('v9importClients').onclick=()=>$('v9clientFile').click();
$('v9clientFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>2000000)throw Error('Fichier trop volumineux');const d=JSON.parse(await f.text());if(d.format!=='vibratech-clients-v9'||!Array.isArray(d.clients))throw Error('Format non reconnu');if(d.clients.length>5000)throw Error('Trop de fiches');let added=0;for(const x of d.clients){if(!x||typeof x!=='object'||typeof x.client!=='string'||!x.client.trim())continue;const c=clean(x);const existing=clients.find(y=>sameSite(y,c));if(existing){const contacts=savedContacts(existing);for(const person of savedContacts(x)){if(!contacts.some(y=>normalize(y.contact)===normalize(person.contact)&&y.telephone===person.telephone&&y.email===person.email))contacts.push(person)}Object.assign(existing,{contacts});continue}clients.push({id:'client-import-'+Date.now()+'-'+added,...c,contacts:savedContacts(x)});added++}if(persist()){render();msg(added+' client(s) importé(s).')}}catch(err){msg('Import impossible : '+err.message)}e.target.value=''};
for(const id of ['save','new','restore'])$(id)?.addEventListener('click',()=>setTimeout(stats,50));document.addEventListener('vbt-report-saved',()=>setTimeout(stats,50));
render();
})();
