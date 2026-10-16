/* Vibratech v19 — authenticated REST sync, durable local queue, revision checks. */
(()=>{
'use strict';
const URL_BASE='https://khpwmaunxituqzsvpsmq.supabase.co';
const API_KEY='sb_publishable_Gv-OT7sg5VwGnMHyCkBMXA_RMqMtXRX';
const AUTH_KEY='vbt_cloud_session_v19',OWNER_KEY='vbt_cloud_owner_v19',META_KEY='vbt_cloud_meta_v19';
const $=id=>document.getElementById(id),clone=x=>JSON.parse(JSON.stringify(x));
const read=(key,fallback)=>{try{return JSON.parse(localStorage.getItem(key))||fallback}catch{return fallback}};
let session=read(AUTH_KEY,null),meta=read(META_KEY,{}),busy=false,timer,refreshPromise=null;
const canonical=x=>JSON.stringify(sort(x));
function sort(x){if(Array.isArray(x))return x.map(sort);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])]));return x}
function status(text){$('cloudStatus').textContent=text}
function ui(){const connected=!!session;$('cloudLogin').hidden=connected;$('cloudActions').hidden=!connected;if(connected)status('Connecté : '+session.user.email+' — synchronisation en attente.');}
function persistMeta(){localStorage.setItem(META_KEY,JSON.stringify(meta))}
function bridge(kind){return kind==='rapport'?window.VBTReports:window.VBTClients}
function localItems(){return ['rapport','client'].flatMap(kind=>bridge(kind).get().map(item=>({kind,id:item.id,data:clone(item)})))}
function keyOf(item){return item.kind+':'+item.id}
function putLocal(kind,id,data){const b=bridge(kind),items=b.get().slice(),idx=items.findIndex(x=>x.id===id);if(data===null){if(idx>=0)items.splice(idx,1)}else if(idx<0)items.push(clone(data));else items[idx]=clone(data);b.set(items)}
async function raw(path,options={}){
 const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),20000);
 try{
 const r=await fetch(URL_BASE+path,{...options,signal:controller.signal,headers:{apikey:API_KEY,'Content-Type':'application/json',...(options.auth===false?{}:{Authorization:'Bearer '+session.access_token}),...options.headers}});
 const text=await r.text();let data;try{data=text?JSON.parse(text):null}catch{data=null}
 if(!r.ok){const e=new Error(data?.msg||data?.message||data?.error_description||'Erreur serveur '+r.status);e.status=r.status;throw e}return data;
 }finally{clearTimeout(timeout)}
}
async function token(){
 if(!session)throw Error('Connectez-vous pour synchroniser.');
 if(session.expires_at>Date.now()/1000+90)return;
 if(!refreshPromise)refreshPromise=(async()=>{
  const updated=await raw('/auth/v1/token?grant_type=refresh_token',{method:'POST',auth:false,body:JSON.stringify({refresh_token:session.refresh_token})});
  session={...updated,expires_at:updated.expires_at||Date.now()/1000+updated.expires_in};localStorage.setItem(AUTH_KEY,JSON.stringify(session));
 })().finally(()=>{refreshPromise=null});
 return refreshPromise;
}
function filter(item){const p=new URLSearchParams({user_id:'eq.'+session.user.id,kind:'eq.'+item.kind,id:'eq.'+item.id});return p}
async function listRemote(){const rows=[];for(let offset=0;;offset+=200){const q=new URLSearchParams({user_id:'eq.'+session.user.id,select:'*',order:'kind.asc,id.asc',limit:'200',offset:String(offset)});const batch=await raw('/rest/v1/vibratech_items?'+q);rows.push(...batch);if(batch.length<200)break}return rows}
function same(remote,desired){return remote.deleted===desired.deleted&&(remote.deleted||canonical(remote.data)===canonical(desired.data))}
function desiredItems(){const current=new Map(localItems().map(x=>[keyOf(x),{...x,deleted:false}]));for(const [k,m]of Object.entries(meta)){if(!current.has(k))current.set(k,{kind:m.kind,id:m.id,data:{},deleted:true})}return current}
function acknowledge(remote){meta[keyOf(remote)]={kind:remote.kind,id:remote.id,revision:remote.revision,base:remote.deleted?null:canonical(remote.data)};persistMeta()}
function localChanged(desired,m){return !m?!desired.deleted:(desired.deleted?m.base!==null:canonical(desired.data)!==m.base)}
function adopt(remote){putLocal(remote.kind,remote.id,remote.deleted?null:remote.data);acknowledge(remote)}
function preserveConflict(desired){
 if(desired.deleted)return; // A stale deletion never destroys a newer remote version.
 const newId=desired.id+'-copie-'+(globalThis.crypto?.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2));
 const copy=clone(desired.data);copy.id=newId;
 if(desired.kind==='rapport'){copy.data.reference=(copy.data.reference||'')+' [copie à vérifier]';copy.updated=new Date().toISOString()}
 else copy.site=(copy.site||'')+' [copie à vérifier]';
 putLocal(desired.kind,newId,copy);
 if(desired.kind==='rapport')window.VBTReports.copyId(desired.id,newId);
}
async function writeItem(desired,m){
 const body={data:desired.data,deleted:desired.deleted};
 if(!m){if(desired.deleted)return null;return (await raw('/rest/v1/vibratech_items',{method:'POST',headers:{Prefer:'return=representation'},body:JSON.stringify({...body,user_id:session.user.id,kind:desired.kind,id:desired.id})}))[0]}
 const q=filter(desired);q.set('revision','eq.'+m.revision);
 const rows=await raw('/rest/v1/vibratech_items?'+q,{method:'PATCH',headers:{Prefer:'return=representation'},body:JSON.stringify(body)});
 return rows[0]||null;
}
async function sync(){
 clearTimeout(timer);if(busy||!session)return;if(!navigator.onLine){status('Hors ligne — modifications conservées sur cet appareil.');return}
 busy=true;$('cloudSync').disabled=true;let conflicts=0;
 try{
 await token();status('Synchronisation en cours…');
 // First reconcile the server against the last acknowledged local version.
 const remote=await listRemote();
 for(const row of remote){
  const k=keyOf(row),m=meta[k],desired=desiredItems().get(k);
  if(desired&&localChanged(desired,m)){
   if(same(row,desired)){acknowledge(row);continue}
   if(m&&row.revision===m.revision)continue;
   preserveConflict(desired);conflicts++;adopt(row);
  }else adopt(row);
 }
 // Recalculate after every network await: edits made during sync stay queued.
 for(const initial of desiredItems().values()){
  const k=keyOf(initial),m=meta[k],desired=desiredItems().get(k);
  if(!desired||!localChanged(desired,m))continue;
  try{
   const result=await writeItem(desired,m);
   if(result){acknowledge(result)}else{
    const rows=await raw('/rest/v1/vibratech_items?'+filter(desired)+'&select=*');
    if(rows[0]){const latest=desiredItems().get(k);if(same(rows[0],latest)){acknowledge(rows[0])}else{preserveConflict(latest);conflicts++;adopt(rows[0])}}
    else throw Error('Élément absent du serveur. Réessayez la synchronisation.');
   }
  }catch(e){if(e.status===409){changed();continue}throw e}
 }
 const pending=[...desiredItems().values()].some(d=>localChanged(d,meta[keyOf(d)]));
 status(conflicts?'Synchronisé — '+conflicts+' différence(s) conservée(s). Consultez les copies « à vérifier » dans l’historique ou les clients.':pending?'Modifications restantes — synchronisation en cours…':'✓ Synchronisé à '+new Date().toLocaleTimeString('fr-CA')+' — '+session.user.email);
 if(pending)changed();
 }catch(e){status('Synchronisation non terminée : '+e.message+' Vos données locales sont conservées.');}
 finally{busy=false;$('cloudSync').disabled=false}
}
function changed(){clearTimeout(timer);if(session)timer=setTimeout(sync,1200)}
window.VBTCloud={changed};
$('cloudLogin').addEventListener('submit',async e=>{
 e.preventDefault();$('cloudConnect').disabled=true;
 try{
 const result=await raw('/auth/v1/token?grant_type=password',{method:'POST',auth:false,body:JSON.stringify({email:$('cloudEmail').value.trim(),password:$('cloudPassword').value})});
 const owner=localStorage.getItem(OWNER_KEY);
 if(owner&&owner!==result.user.id)throw Error('Cet appareil est associé à un autre compte. Utilisez ce compte pour préserver la séparation des données.');
 localStorage.setItem(OWNER_KEY,result.user.id);session={...result,expires_at:result.expires_at||Date.now()/1000+result.expires_in};localStorage.setItem(AUTH_KEY,JSON.stringify(session));$('cloudPassword').value='';ui();await sync();
 }catch(e){status('Connexion impossible : '+e.message)}finally{$('cloudConnect').disabled=false}
});
$('cloudSync').onclick=sync;
$('cloudLogout').onclick=async()=>{
 if(busy){status('Attendez la fin de la synchronisation avant de vous déconnecter.');return}
 if(!confirm('Se déconnecter ? Les copies locales et les modifications en attente resteront sur cet appareil.'))return;
 const old=session;session=null;clearTimeout(timer);localStorage.removeItem(AUTH_KEY);ui();status('Déconnecté — les copies locales restent disponibles sur cet appareil.');
 if(old)fetch(URL_BASE+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:API_KEY,Authorization:'Bearer '+old.access_token}}).catch(()=>{});
};
window.addEventListener('online',changed);window.addEventListener('focus',changed);document.addEventListener('visibilitychange',()=>{if(!document.hidden)changed()});
setInterval(()=>{if(!document.hidden)sync()},30000);ui();changed();
})();
