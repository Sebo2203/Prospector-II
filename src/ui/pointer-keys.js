const pointerKeysPanel = document.getElementById('pointer-keys');
const pointerKeysToggle = document.getElementById('pointer-keys-toggle');
let pointerKeysOpen = '';
let pointerKeysShift = false;

function pointerKeysContext(){
  if(document.getElementById('feedback-overlay').style.display==='flex') return 'feedback';
  if(MENU_STATE._rebinding && (G?.showOptions && G._kbScreen || !G && MENU_STATE.screen==='keybindings')) return 'binding';
  if(!G && MENU_STATE.screen==='naming') return 'naming';
  return '';
}

function renderPointerKeys(){
  const context=pointerKeysContext();
  if(context!==pointerKeysOpen) pointerKeysOpen='';
  pointerKeysToggle.hidden=!context;
  pointerKeysPanel.hidden=!pointerKeysOpen;
  pointerKeysToggle.setAttribute('aria-expanded',String(!!pointerKeysOpen));
  if(!pointerKeysOpen) return;

  const symbols='@.-_+&?!,\'"/:;#%';
  const row = keys=>'<div>'+keys.map(([key,label=key,code=''])=>
    `<button type="button" class="hud-menu-btn" data-text-key="${htmlEsc(key)}" data-code="${htmlEsc(code)}">${htmlEsc(label)}</button>`
  ).join('')+'</div>';
  const binding=context==='binding';
  const letters=s=>[...s].map(key=>[pointerKeysShift?key.toUpperCase():key, binding?key.toUpperCase():undefined,'Key'+key.toUpperCase()]);
  pointerKeysPanel.innerHTML=[
    row([...'1234567890'].map(key=>[key,key,'Digit'+key])),
    row(letters('qwertyuiop')),
    row(letters('asdfghjkl')),
    row(letters('zxcvbnm')),
    binding ? row([[' ','Space','Space'],['.','Period','Period'],[',','Comma','Comma']])
      : row([...symbols].map(key=>[key])),
    binding ? '' : row([['Shift','Shift'],[' ','Space'],['Backspace','Backspace'],...(context==='feedback'?[['\n','New line']]:[])]),
  ].join('');
}

pointerKeysToggle.addEventListener('mousedown',event=>event.preventDefault());
pointerKeysToggle.addEventListener('click',()=>{
  pointerKeysOpen=pointerKeysOpen?'':pointerKeysContext();
  pointerKeysShift=false;
  renderPointerKeys();
});

pointerKeysPanel.addEventListener('mousedown',event=>event.preventDefault());
pointerKeysPanel.addEventListener('click',event=>{
  const button=event.target.closest('button[data-text-key]');
  if(!button || pointerKeysOpen!==pointerKeysContext()) return;
  const key=button.dataset.textKey;
  if(pointerKeysOpen==='binding'){
    activateGameKey(key,button.dataset.code);
    return;
  }
  if(key==='Shift'){
    pointerKeysShift=!pointerKeysShift;
    renderPointerKeys();
    return;
  }
  if(pointerKeysOpen==='naming'){
    editVesselName(key);
    return;
  }
  const input=document.activeElement?.matches('#feedback-email,#feedback-msg')
    ? document.activeElement : document.getElementById('feedback-email');
  const start=input.selectionStart ?? input.value.length;
  const end=input.selectionEnd ?? input.value.length;
  if(input.type==='email'){
    input.value=key==='Backspace'?input.value.slice(0,-1):input.value+key;
  } else if(key==='Backspace'){
    input.setRangeText('',start===end?Math.max(0,start-1):start,end,'end');
  } else {
    input.setRangeText(key,start,end,'end');
  }
  input.focus();
});
