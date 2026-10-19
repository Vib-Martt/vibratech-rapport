const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../js/rapports.js'),'utf8');
const signatureCode=source.slice(source.indexOf('let signed=false;'),source.indexOf('function materialRow'));
const snapshotCode=source.slice(source.indexOf('function snapshot()'),source.indexOf('const DRAFT_KEY='));
const loadCode=source.slice(source.indexOf('function load(data)'),source.indexOf('function minutes('));
function app(){
 const images=[],elements=new Map(),draws=[],events={};let bitmap='blank';
 const ctx={clearRect(){bitmap='blank'},scale(){},drawImage(image,x,y,w,h){assert(w>0);bitmap=image.src;draws.push(image.src)},beginPath(){},moveTo(){},lineTo(){},stroke(){bitmap='new-signature'}};
 const canvas={clientWidth:0,width:300,height:150,style:{},getContext:()=>ctx,toDataURL:()=>bitmap,getBoundingClientRect:()=>({left:0,top:0}),setPointerCapture(){},setAttribute(){},addEventListener(n,f){(events[n]??=[]).push(f)}};
 const el=id=>{if(id==='signature')return canvas;if(!elements.has(id))elements.set(id,{value:'',textContent:'',addEventListener(){}});return elements.get(id)};
 const context={el,ids:[],checkids:[],devicePixelRatio:2,window:{addEventListener(){},VBTPhotos:{snapshot:()=>[],load(){}}},document:{querySelectorAll:()=>[]},Image:class{set src(s){this.value=s;images.push(this)}get src(){return this.value}},requestAnimationFrame:fn=>fn(),markDirty(){},formatTelephone:x=>x,getMaterials:()=>[],setMaterials(){},commitDay(){},days:[],allWork:()=>'',reportFinished:false,selectedDay:0,makeDay:()=>({}),DAY_FIELDS:[],writeDay(){},renderDays(){},updateTotals(){}};
 vm.createContext(context);vm.runInContext(signatureCode+snapshotCode+loadCode,context);
 return {context,canvas,images,draws,load:data=>context.load({days:[{}],...data}),snapshot:()=>context.snapshot(),resize:()=>context.resize(),clear:()=>el('effacerSignature').onclick(),pointer:n=>(events[n]||[]).forEach(fn=>fn({clientX:1,clientY:1,pointerId:1}))};
}
const tests=[];function test(name,fn){tests.push([name,fn])}
test('Ancien rapport chargé avec Signer masqué : signature disponible immédiatement pour le PDF',()=>{const a=app();a.load({signature:'original',signatureLocked:true});assert.equal(a.snapshot().signature,'original');assert.equal(a.snapshot().signatureLocked,true);assert.equal(a.images.length,0)});
test('Impression avant la fin du chargement de l’image : image originale conservée',()=>{const a=app();a.canvas.clientWidth=500;a.load({signature:'original'});assert.equal(a.snapshot().signature,'original');a.images[0].onload();assert.equal(a.snapshot().signature,'original');assert.deepEqual(a.draws,['original'])});
test('Passages entre onglets et redimensionnements : signature inchangée',()=>{const a=app();a.load({signature:'original'});a.canvas.clientWidth=500;a.resize();a.images.at(-1).onload();a.canvas.clientWidth=0;a.resize();assert.equal(a.snapshot().signature,'original');a.canvas.clientWidth=700;a.resize();a.images.at(-1).onload();assert.equal(a.snapshot().signature,'original')});
test('Changement rapide de rapport : une ancienne image ne remplace pas la nouvelle',()=>{const a=app();a.canvas.clientWidth=500;a.load({signature:'A'});const old=a.images.at(-1);a.load({signature:'B'});old.onload();a.images.at(-1).onload();assert.deepEqual(a.draws,['B']);assert.equal(a.snapshot().signature,'B')});
test('Effacement volontaire : une image en chargement ne rétablit pas la signature',()=>{const a=app();a.canvas.clientWidth=500;a.load({signature:'A'});const old=a.images.at(-1);a.clear();old.onload();assert.equal(a.snapshot().signature,null);assert.deepEqual(a.draws,[])});
test('Rapport non signé après un rapport signé : aucune signature précédente',()=>{const a=app();a.load({signature:'A'});a.load({signature:null});assert.equal(a.snapshot().signature,null)});
test('Nouvelle signature : les traits sont conservés après masquage',()=>{const a=app();a.canvas.clientWidth=500;a.resize();a.pointer('pointerdown');a.pointer('pointermove');a.pointer('pointerup');a.canvas.clientWidth=0;a.resize();assert.equal(a.snapshot().signature,'new-signature')});
test('Signature verrouillée : dessin sans effet',()=>{const a=app();a.load({signature:'A',signatureLocked:true});a.pointer('pointerdown');assert.equal(a.snapshot().signature,'A')});
let failed=0;for(const [name,fn]of tests){try{fn();console.log('PASS',name)}catch(e){failed++;console.error('FAIL',name,e)}}if(failed)process.exitCode=1;
