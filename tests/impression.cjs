const fs=require('fs'),vm=require('vm'),assert=require('assert');
const source=fs.readFileSync(require('path').join(__dirname,'../js/pdf.js'),'utf8');
function app({blocked=false,ios=false,photoError=false,valid=true}={}){
 const elements=new Map(),blobs=[],links=[],messages=[];let saves=0,photoPages=0,shared=null;
 function el(id){if(!elements.has(id))elements.set(id,{textContent:'',disabled:false,addEventListener(n,fn){this[n]=fn}});return elements.get(id)}
 function canvas(){const commands=[];const ctx=new Proxy({measureText:t=>({width:String(t).length*10})},{get:(obj,k)=>k in obj?obj[k]:(...args)=>commands.push([k,...args]),set:(obj,k,v)=>(obj[k]=v,true)});return {width:1240,height:1754,getContext:()=>ctx,toDataURL:()=> 'data:image/jpeg;base64,'+Buffer.from(JSON.stringify(commands)).toString('base64')}}
 const viewer={document:{body:{},title:''},closed:false,location:{replace(url){viewer.url=url}},close(){this.closed=true}};
 const window={open:()=>blocked?null:viewer,vbtSaveReportForPdf:()=>{saves++;return true},VBTPhotos:{appendPdfPages:async o=>{if(photoError)throw Error('Photo introuvable');photoPages++;o.newPage();o.heading('PHOTO TEST');o.finishPage()}}};
 const document={getElementById:el,createElement:type=>type==='canvas'?canvas():{click(){links.push(this.href)},remove(){}},body:{append(){},appendChild(){}},dispatchEvent(){}};
 const context={window,document,el,Blob,File,TextEncoder,Uint8Array,atob,navigator:{userAgent:ios?'iPhone':'Desktop',platform:'',canShare:()=>true,share:async data=>{shared=data}},Image:class{width=300;height=100;set src(value){this.onload()}},URL:{createObjectURL:blob=>{blobs.push(blob);return 'blob:'+blobs.length},revokeObjectURL(){}},setInterval:()=>1,clearInterval(){},setTimeout(){},Event:class{},alert:s=>messages.push(s),console,validateClient:()=>valid,reportFinished:false,signed:true,renderDays(){},confirm:()=>true,LOGO_DATA:'logo',snapshot:()=>({client:'Client',date:'2026-10-19',signature:'signature',days:[{date:'2026-10-19'}],materials:[],photos:[{id:'photo'}]}),totals:()=>({}),totalDays:()=>({onsite:1,travel:2,km:3}),fmt:String};
 vm.runInNewContext(source,context);
 return {context,viewer,blobs,links,messages,print:()=>el('print').onclick(),download:()=>el('downloadPdf').click(),saves:()=>saves,photoPages:()=>photoPages,shared:()=>shared,button:()=>el('print')};
}
(async()=>{
 const a=app();await a.print();assert.equal(a.saves(),0);assert.equal(a.context.reportFinished,false);assert.equal(a.viewer.url,'blob:1');await a.download();assert.equal(a.saves(),1);assert.equal(a.photoPages(),2);assert.equal(await a.blobs[0].text(),await a.blobs[1].text());console.log('PASS Impression et téléchargement : PDF identiques, photos incluses, impression sans clôture');
 const b=app({blocked:true});await b.print();assert.equal(b.links.length,1);assert.equal(b.saves(),0);assert.equal(b.button().disabled,false);console.log('PASS Nouvel onglet bloqué : téléchargement du PDF');
 const c=app({photoError:true});await c.print();assert.equal(c.viewer.closed,true);assert.equal(c.blobs.length,0);assert(c.messages[0].includes('Photo introuvable'));assert.equal(c.button().disabled,false);console.log('PASS Photo manquante : erreur explicite et bouton réactivé');
 const d=app({ios:true});await d.print();assert.equal(d.shared().files[0].type,'application/pdf');assert.equal(d.saves(),0);console.log('PASS iPhone : partage du PDF sans clôture');
 const e=app({valid:false});await e.print();assert.equal(e.blobs.length,0);console.log('PASS Validation du client avant impression');
})().catch(e=>{console.error(e);process.exitCode=1});
