function drawCivilizationBoundaryOverlay(){
  const notice = civilizationActiveBoundaryNotice();
  if(!notice) return;
  const cw = canvas.width;
  const x = Math.round(cw/2 - 260);
  const y = 72;
  const w = 520;
  const h = 74;
  ctx.save();
  ctx.fillStyle = 'rgba(8,8,14,0.88)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = notice.col || '#ffaa33';
  ctx.lineWidth = 2;
  ctx.strokeRect(x+0.5, y+0.5, w-1, h-1);
  ctx.textAlign = 'center';
  ctx.font = 'bold 16px Courier New';
  ctx.fillStyle = notice.col || '#ffaa33';
  ctx.fillText(notice.title, cw/2, y+24);
  ctx.font = '13px Courier New';
  ctx.fillStyle = '#dde6ee';
  ctx.textAlign = 'left';
  drawWrappedText(notice.body, x+20, y+47, w-40, 16, 2);
  ctx.restore();
}

function drawWrappedText(text, x, y, maxW, lineH, maxLines=999){
  const words = String(text || '').split(/\s+/);
  let line = '';
  let lines = 0;
  for(let i=0;i<words.length;i++){
    const test = line ? line+' '+words[i] : words[i];
    if(ctx.measureText(test).width > maxW && line){
      ctx.fillText(line, x, y);
      y += lineH;
      lines++;
      line = words[i];
      if(lines >= maxLines) return y;
    } else {
      line = test;
    }
  }
  if(line && lines < maxLines){
    ctx.fillText(line, x, y);
    y += lineH;
  }
  return y;
}

function drawDialogueOverlay(){
  const dlg = G.dialogue;
  const def = currentDialogueDef();
  const node = currentDialogueNode();
  if(!dlg || !def || !node) return;
  const cw = canvas.width, ch = canvas.height;
  const w = Math.min(720, cw - 80);
  const h = Math.min(390, ch - 90);
  const x = Math.round((cw - w) / 2);
  const y = Math.round(ch - h - 34);
  const ctxData = dlg.context || {};
  const title = typeof def.title === 'function' ? def.title(ctxData) : (def.title || 'Dialogue');
  const subtitle = typeof def.subtitle === 'function' ? def.subtitle(ctxData) : (def.subtitle || '');
  const text = dlg.nodeText?.[dlg.node] ?? (typeof node.text === 'function' ? node.text(ctxData) : (node.text || ''));
  const opts = dialogueVisibleOptions();
  const visibleOptCount = 4;
  const maxScroll = Math.max(0, opts.length - visibleOptCount);
  dlg.optScroll = Math.max(0, Math.min(dlg.optScroll || 0, maxScroll));
  if((dlg.sel || 0) < dlg.optScroll) dlg.optScroll = dlg.sel || 0;
  if((dlg.sel || 0) >= dlg.optScroll + visibleOptCount) dlg.optScroll = (dlg.sel || 0) - visibleOptCount + 1;
  const visibleOpts = opts.slice(dlg.optScroll, dlg.optScroll + visibleOptCount);

  ctx.save();
  ctx.fillStyle='rgba(0,0,0,0.58)';
  ctx.fillRect(0,0,cw,ch);
  ctx.fillStyle='#070910';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle='#ffe066';
  ctx.lineWidth=2;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle='#334455';
  ctx.lineWidth=1;
  ctx.strokeRect(x+5, y+5, w-10, h-10);

  ctx.textAlign='left';
  ctx.font='bold 16px Courier New';
  ctx.fillStyle='#ffe066';
  ctx.fillText(title, x+18, y+26);

  // Traits: right-aligned on the title baseline in muted grey, clipped so it never overlaps the title
  const traits = typeof def.traits === 'function' ? def.traits(ctxData) : (def.traits || '');
  if(traits){
    ctx.font='11px Courier New';
    ctx.fillStyle='#445566';
    ctx.textAlign='right';
    const titleW = (() => { ctx.font='bold 16px Courier New'; const m = ctx.measureText(title).width; ctx.font='11px Courier New'; return m; })();
    const maxTraitsW = w - 36 - titleW - 20;
    let traitStr = traits;
    while(traitStr.length > 4 && ctx.measureText(traitStr).width > maxTraitsW){
      // trim last trait segment
      const lastDot = traitStr.lastIndexOf(' · ');
      if(lastDot > 0) traitStr = traitStr.slice(0, lastDot)+'…';
      else break;
    }
    ctx.fillText(traitStr, x+w-18, y+26);
    ctx.textAlign='left';
  }

  ctx.font='12px Courier New';
  ctx.fillStyle='#667788';
  ctx.fillText(subtitle, x+18, y+43);
  ctx.fillStyle='#1a2a3a';
  ctx.fillRect(x+18, y+52, w-36, 1);

  ctx.font='14px Courier New';
  ctx.fillStyle='#c8d2dd';
  const textBottom = drawWrappedText(text, x+18, y+76, w-36, 20, 8);

  if(dlg.lastCheck){
    const chk = dlg.lastCheck;
    ctx.font='12px Courier New';
    ctx.fillStyle=chk.ok ? '#88dd88' : '#ff9988';
    ctx.fillText(chk.skill+' check: roll '+chk.roll+' + '+chk.bonus+' = '+chk.total+' vs '+chk.dc+'  '+(chk.ok?'SUCCESS':'FAIL'), x+18, Math.min(textBottom+12, y+220));
  }

  const optTop = y + h - 146;
  ctx.fillStyle='#1a2a3a';
  ctx.fillRect(x+18, optTop-16, w-36, 1);
  visibleOpts.forEach((opt,visibleI)=>{
    const i = visibleI + (dlg.optScroll || 0);
    const oy = optTop + visibleI*28;
    const sel = i === (dlg.sel || 0);
    ctx.fillStyle = sel ? '#0e1a2a' : '#08080f';
    ctx.fillRect(x+18, oy-18, w-36, 24);
    ctx.strokeStyle = sel ? '#aaddff' : '#1a1a2a';
    ctx.strokeRect(x+18, oy-18, w-36, 24);
    ctx.font='bold 13px Courier New';
    ctx.fillStyle = opt.disabled ? '#4f5863' : sel ? '#ffffff' : '#aab6c2';
    const check = opt.check ? '  ['+opt.check.skill.toUpperCase()+' '+opt.check.dc+']' : '';
    const disabledReason = opt.disabled
      ? (typeof opt.disabledReason === 'function' ? opt.disabledReason(ctxData) : opt.disabledReason)
      : '';
    const label = opt.label + check + (disabledReason ? ' - '+disabledReason : '');
    ctx.fillText((i+1)+'. '+label, x+30, oy-2);
  });

  if(opts.length > visibleOptCount){
    ctx.font='11px Courier New';
    ctx.fillStyle='#667788';
    ctx.textAlign='right';
    ctx.fillText((dlg.optScroll+1)+'-'+Math.min(opts.length, dlg.optScroll+visibleOptCount)+' / '+opts.length, x+w-24, optTop-24);
  }

  // ── Debug civ stats bar ─────────────────────────────────────────────────────
  if(dlg.id === 'civilization_contact'){
    const wrap = dialogueCivilization();
    if(wrap?.civ?._debugSpawned && wrap.state){
      const s = wrap.state;
      const civ = wrap.civ;
      const rel  = (s.relation ?? 0);
      const alrt = (s.alert ?? 0);
      const lang = (s.languageProgress ?? 0);
      const agg  = civ.aggression || '?';
      const tier = civ.tierLabel || civ.tier || '?';
      const hostile = s.hostile ? '  HOSTILE' : '';
      const dbgStr = tier+' · '+agg+'  |  rel '+rel+'/10  alert '+alrt+'/5  lang '+lang+'/'+CIV_LANGUAGE_MAX+hostile;
      const traitRaw = civTraitSummary(civ) || 'no traits';
      let traitStr = traitRaw;
      ctx.font = 'bold 11px Courier New';
      ctx.textAlign = 'left';
      const maxTraitW = w - 74;
      while(traitStr.length > 8 && ctx.measureText(traitStr).width > maxTraitW){
        traitStr = traitStr.slice(0, -2);
      }
      if(traitStr !== traitRaw) traitStr = traitStr.trim()+'...';
      ctx.fillStyle = '#0d0d18';
      ctx.fillRect(x, y - 30, w, 28);
      ctx.fillStyle = s.hostile ? '#ff6655' : agg === 'Territorial' ? '#ffaa44' : '#55aaff';
      ctx.fillText('DBG  '+dbgStr, x+8, y - 18);
      ctx.fillStyle = '#88ccaa';
      ctx.fillText('TRT  '+traitStr, x+8, y - 5);
    }
  }

  ctx.font='12px Courier New';
  ctx.fillStyle='#445566';
  ctx.textAlign='center';
  ctx.fillText('↑/↓ select   Enter choose   1-9 quick choose   ESC close', x+w/2, y+h-14);
  ctx.restore();
}

