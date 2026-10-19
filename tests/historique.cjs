const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../js/rapports.js'),'utf8');
const code=source.slice(source.indexOf('function reportFingerprint'),source.indexOf('window.VBTReports='));
const clone=x=>JSON.parse(JSON.stringify(x));
function app(){
 const elements=new Map(),el=id=>{if(!elements.has(id))elements.set(id,{value:'',textContent:''});return elements.get(id)};
 const c={archive:[],activeId:null,dirty:false,data:{client:'Même client',finished:true,travaux:'Visite 1',signature:'signature 1',photos:[{id:'p1'}]},validateClient:()=>true,snapshot:()=>clone(c.data),persistArchive(){if(c.fail)throw Error('quota');c.persisted=clone(c.archive)},clearDraft(){},renderHistory(){},el,alert(){},confirm:()=>true,document:{dispatchEvent(){}},Event:class{},resetForm(){c.activeId=null;c.data={finished:false,signature:null,photos:[],travaux:''}},markDirty(){c.dirty=true},crypto:require('crypto').webcrypto};
 vm.createContext(c);vm.runInContext(code,c);return c;
}
const tests=[];function test(n,f){tests.push([n,f])}
test('Deux visites terminées du même client : ancien rapport et signature conservés',()=>{const c=app();c.save();const first=clone(c.archive[0]);c.data.travaux='Visite 2';c.data.signature='signature 2';c.save();assert.equal(c.archive.length,2);assert.deepEqual(c.archive.find(x=>x.id===first.id),first);assert.notEqual(c.archive[0].id,first.id)});
test('Retélécharger sans modifier : pas de doublon',()=>{const c=app();c.save();c.save();assert.equal(c.archive.length,1)});
test('Rapport en cours sur plusieurs jours : mise à jour du même rapport',()=>{const c=app();c.data.finished=false;c.save();const id=c.activeId;c.data.travaux+=' Jour 2';c.save();assert.equal(c.archive.length,1);assert.equal(c.activeId,id);c.data.finished=true;c.save();assert.equal(c.archive.length,1)});
test('Nouveau rapport pour le même client : coordonnées reprises, intervention et signature vierges',()=>{const c=app();c.save();const old=clone(c.archive);assert(c.newReportForClient({...c.data,telephone:'123',site:'Usine'}));assert.equal(c.activeId,null);assert.equal(c.el('client').value,'Même client');assert.equal(c.el('site').value,'Usine');assert.equal(c.data.signature,null);assert.deepEqual(c.data.photos,[]);assert.deepEqual(c.archive,old);c.data={...c.data,client:c.el('client').value,finished:true};c.save();assert.equal(c.archive.length,2)});
test('Échec du stockage : historique et identifiant inchangés',()=>{const c=app();c.save();const old=clone(c.archive),id=c.activeId;c.data.travaux='Modifié';c.fail=true;assert.equal(c.save(),false);assert.deepEqual(c.archive,old);assert.equal(c.activeId,id)});
test('Annuler la création : modifications conservées',()=>{const c=app();c.save();c.dirty=true;c.confirm=()=>false;const id=c.activeId;assert.equal(c.newReportForClient(c.data),false);assert.equal(c.activeId,id)});
let failures=0;for(const [n,f]of tests){try{f();console.log('PASS',n)}catch(e){failures++;console.error('FAIL',n,e)}}if(failures)process.exitCode=1;
