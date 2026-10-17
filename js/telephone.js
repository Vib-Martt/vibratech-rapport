
function formatTelephone(value){
 const raw=String(value||'');if(/[^\d\s().+\-]/.test(raw))return raw;
 const digits=raw.replace(/\D/g,'');let prefix='',number=digits;
 if(digits.length===11&&digits[0]==='1'){prefix='+1 ';number=digits.slice(1)}
 if(number.length>10)return raw;
 return prefix+number.slice(0,3)+(number.length>3?'-'+number.slice(3,6):'')+(number.length>6?'-'+number.slice(6):'');
}
(()=>{const input=document.getElementById('telephone');
 input.placeholder='111-222-3333';
 input.addEventListener('input',()=>{
  const old=input.value,pos=input.selectionStart??old.length;
  const count=(old.slice(0,pos).match(/\d/g)||[]).length;
  const formatted=formatTelephone(old);if(formatted===old)return;
  input.value=formatted;let caret=0,seen=0;
  while(caret<formatted.length&&seen<count){if(/\d/.test(formatted[caret]))seen++;caret++}
  try{input.setSelectionRange(caret,caret)}catch(e){}
 });
 input.addEventListener('keydown',e=>{
  const pos=input.selectionStart;if(e.key==='Backspace'&&pos===input.selectionEnd&&pos>0&&input.value[pos-1]==='-'){
   e.preventDefault();input.value=input.value.slice(0,pos-2)+input.value.slice(pos);input.setSelectionRange(pos-2,pos-2);input.dispatchEvent(new Event('input',{bubbles:true}));
  }
 });
})();
