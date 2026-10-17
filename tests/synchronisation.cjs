const fs=require('fs'),vm=require('vm'),assert=require('assert');
const filename=process.argv[2]||require('path').join(__dirname,'../cloud-sync.js');
const code=fs.readFileSync(filename,'utf8');
const copy=x=>JSON.parse(JSON.stringify(x));
const canon=x=>JSON.stringify(sort(x));
function sort(x){if(Array.isArray(x))return x.map(sort);if(x&&typeof x==='object')return Object.fromEntries(Object.keys(x).sort().map(k=>[k,sort(x[k])]));return x}
const report=(id,name)=>({id,updated:'2026-10-17T12:00:00Z',data:{client:name,reference:id}});
const client=(id,name)=>({id,client:name,site:''});
class Server{
 constructor(){this.rows=new Map();this.hook=null;this.fail=false;}
 async fetch(url,opts={}){
  const u=new URL(url),method=opts.method||'GET';
  if(this.fail)throw Error('réseau indisponible');
  if(this.hook){const hook=this.hook;this.hook=null;await hook(u,opts)}
  const response=(data,status=200)=>({ok:status<400,status,text:async()=>JSON.stringify(data)});
  if(!u.pathname.includes('/rest/v1/vibratech_items'))throw Error('Unexpected '+u.pathname);
  const eq=k=>u.searchParams.get(k)?.replace(/^eq\./,'');
  if(method==='GET')return response([...this.rows.values()].filter(r=>(!eq('kind')||r.kind===eq('kind'))&&(!eq('id')||r.id===eq('id'))).sort((a,b)=>(a.kind+':'+a.id).localeCompare(b.kind+':'+b.id)).slice(Number(u.searchParams.get('offset')||0),Number(u.searchParams.get('offset')||0)+Number(u.searchParams.get('limit')||10000)).map(copy));
  const body=JSON.parse(opts.body);
  if(method==='POST'){
   const key=body.kind+':'+body.id;if(this.rows.has(key))return response({},409);
   const row={...body,revision:1};this.rows.set(key,copy(row));return response([copy(row)]);
  }
  if(method==='PATCH'){
   const key=eq('kind')+':'+eq('id'),old=this.rows.get(key);
   if(!old||String(old.revision)!==eq('revision'))return response([]);
   const row={...old,...body,revision:old.revision+1};this.rows.set(key,copy(row));return response([copy(row)]);
  }
  throw Error(method);
 }
}
function device(server,{reports=[],clients=[],meta={},storage:shared}={}){
 let local={rapport:copy(reports),client:copy(clients)};
 const store=shared||new Map();
 if(!shared){store.set('vbt_cloud_session_v19',JSON.stringify({access_token:'TEST-ONLY',expires_at:9999999999,user:{id:'test-user',email:'test@example.invalid'}}));store.set('vbt_cloud_meta_v19',JSON.stringify(meta));}
 const elements=new Map(),events={};let timerId=0;
 const doc={hidden:false,getElementById:id=>{if(!elements.has(id))elements.set(id,{textContent:'',disabled:false,hidden:false,value:'',addEventListener(){},appendChild(){}});return elements.get(id)},addEventListener:(n,f)=>events[n]=f,createElement:()=>({click(){},remove(){}}),body:{appendChild(){}}};
 const localStorage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,String(v)),removeItem:k=>store.delete(k)};
 const window={addEventListener:(n,f)=>events[n]=f,VBTReports:{get:()=>local.rapport,set:a=>local.rapport=copy(a),copyId(){}},VBTClients:{get:()=>local.client,set:a=>local.client=copy(a)}};
 const context={window,document:doc,localStorage,fetch:server.fetch.bind(server),URL,URLSearchParams,AbortController,Blob,console,navigator:{onLine:true},setTimeout:()=>++timerId,clearTimeout(){},setInterval(){},confirm:()=>true,crypto:require('crypto').webcrypto};
 vm.runInNewContext(code,context,{filename});
 return {local,store,elements,context,async sync(){await elements.get('cloudSync').onclick()},delete(kind,id){window.VBTCloud.deleted?.(kind,id);local[kind]=local[kind].filter(x=>x.id!==id)},status:()=>elements.get('cloudStatus').textContent};
}
const tests=[];function test(name,fn){tests.push([name,fn])}
test('Deux appareils : réunion des clients et rapports distincts',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Mac')],clients:[client('a','Mac')]}),b=device(s,{reports:[report('b','Téléphone')],clients:[client('b','Téléphone')]});
 await a.sync();await b.sync();await a.sync();for(const d of [a,b])for(const k of ['rapport','client'])assert.deepEqual(d.local[k].map(x=>x.id).sort(),['a','b']);
});
test('Une absence locale inexpliquée ne supprime pas les données des autres appareils',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Mac')],clients:[client('a','Mac')]});await a.sync();
 const b=device(s,{meta:JSON.parse(a.store.get('vbt_cloud_meta_v19'))});await b.sync();await a.sync();
 for(const d of [a,b])for(const k of ['rapport','client'])assert.equal(d.local[k].length,1);
 for(const row of s.rows.values())assert.equal(row.deleted,false);
});
test('Suppression explicite propagée',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Mac')],clients:[client('a','Mac')]}),b=device(s);await a.sync();await b.sync();
 for(const k of ['rapport','client'])a.delete(k,'a');await a.sync();await b.sync();assert.equal(b.local.rapport.length,0);assert.equal(b.local.client.length,0);
});
test('Modification concurrente : conserver les deux versions',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Initial')],clients:[client('a','Initial')]}),b=device(s);await a.sync();await b.sync();
 a.local.rapport[0].data.client='Mac';a.local.client[0].client='Mac';b.local.rapport[0].data.client='Téléphone';b.local.client[0].client='Téléphone';
 await a.sync();await b.sync();await a.sync();
 for(const d of [a,b]){assert.deepEqual(d.local.rapport.map(x=>x.data.client).sort(),['Mac','Téléphone']);assert.deepEqual(d.local.client.map(x=>x.client).sort(),['Mac','Téléphone']);}
});
test('Une suppression ancienne ne détruit pas une modification récente',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Initial')]}),b=device(s);await a.sync();await b.sync();a.delete('rapport','a');b.local.rapport[0].data.client='Modifié';await b.sync();await a.sync();assert.equal(a.local.rapport[0].data.client,'Modifié');
});
test('Modification locale pendant un envoi : reste à envoyer',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Initial')]});await a.sync();a.local.rapport[0].data.client='Avant';
 s.hook=async(u,opts)=>{if((opts.method||'GET')==='GET')s.hook=async()=>{a.local.rapport[0].data.client='Pendant'}};
 await a.sync();await a.sync();assert.equal(s.rows.get('rapport:a').data.data.client,'Pendant');
});
test('Panne réseau : données locales conservées, reprise',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Mac')]});s.fail=true;await a.sync();assert.equal(a.local.rapport.length,1);s.fail=false;await a.sync();assert.equal(s.rows.size,1);
});
test('Demande de suppression conservée après fermeture et réouverture',async()=>{
 const s=new Server(),a=device(s,{clients:[client('a','Mac')]}),b=device(s);await a.sync();await b.sync();a.delete('client','a');
 const reopened=device(s,{storage:a.store});await reopened.sync();await b.sync();assert.equal(b.local.client.length,0);
});
test('Suppression annulée si son enregistrement local échoue',async()=>{
 const s=new Server(),a=device(s,{clients:[client('a','Mac')]});await a.sync();
 const set=a.context.localStorage.setItem;
 a.context.localStorage.setItem=(k,v)=>{if(k==='vbt_cloud_deletions_v19_7')throw Error('quota');set(k,v)};
 assert.equal(a.context.window.VBTCloud.deleted('client','a'),false);assert.equal(a.local.client.length,1);
});
test('Une suppression distante conserve une modification locale en copie',async()=>{
 const s=new Server(),a=device(s,{reports:[report('a','Initial')]}),b=device(s);await a.sync();await b.sync();
 a.delete('rapport','a');b.local.rapport[0].data.client='Travail hors ligne';await a.sync();await b.sync();await a.sync();
 for(const d of [a,b]){assert.equal(d.local.rapport.length,1);assert.equal(d.local.rapport[0].data.client,'Travail hors ligne')}
});
test('Annulation du journal après échec de suppression',async()=>{
 const s=new Server(),a=device(s,{clients:[client('a','Mac')]});await a.sync();a.context.window.VBTCloud.deleted('client','a');a.context.window.VBTCloud.cancelDeletion('client','a');
 assert.deepEqual(JSON.parse(a.store.get('vbt_cloud_deletions_v19_7')),{});
});
test('Plusieurs pages serveur sont réunies sans perte',async()=>{
 const s=new Server(),a=device(s,{clients:Array.from({length:205},(_,i)=>client('c'+i,'Client '+i))}),b=device(s,{clients:[client('autre','Autre appareil')]});
 await a.sync();await b.sync();await a.sync();assert.equal(a.local.client.length,206);assert.equal(b.local.client.length,206);
});
(async()=>{let failures=0;for(const [name,fn]of tests){try{await fn();console.log('PASS',name)}catch(e){failures++;console.log('FAIL',name,e.message)}}if(failures)process.exitCode=1;console.log(`${tests.length-failures}/${tests.length} tests réussis`);})();
