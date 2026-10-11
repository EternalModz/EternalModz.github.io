(() => {
  const NS = window.IAG = window.IAG || {};
  const $ = (s) => document.querySelector(s);
  let ending=false, forceUsed=false, confirmUsed=false;
  const timers=[];
  const later=(fn,ms)=>timers.push(setTimeout(fn,ms));

  function say(text,emotion="desperate",urgent=false,behavior=null){NS.V14?.guide?.(text,{emotion,behavior});NS.V14?.enqueueSpeech?.(text,{emotion,urgent});}
  function status(text){const el=$('[data-v14-session-copy]');if(el)el.textContent=text;}
  function line(text,delay=0,cls=""){later(()=>{const root=$('[data-shutdown-sequence]');if(!root)return;root.hidden=false;const p=document.createElement('p');p.className=cls;p.textContent=text;root.appendChild(p);},delay);}

  function render(){
    if(!NS.State)return;
    $('[data-session-id-final]') && ($('[data-session-id-final]').textContent=NS.State.session.id);
    $('[data-pages-count]') && ($('[data-pages-count]').textContent=String(Object.keys(NS.State.persistent.pagesVisited||{}).length));
    $('[data-interaction-count]') && ($('[data-interaction-count]').textContent=String(NS.State.persistent.interactions||0));
    $('[data-assistant-final-state]') && ($('[data-assistant-final-state]').textContent=NS.State.persistent.assistant.state||'online');
    const tick=()=>{const el=$('[data-session-duration]');if(el)el.textContent=NS.Telemetry?.formatDuration(Date.now()-NS.State.session.startedAt)||'--:--:--';};tick();
    if(!window.__iagSessionClock)window.__iagSessionClock=setInterval(tick,1000);
    const trace=$('[data-route-trace]');if(trace){const seen=(NS.State.session.pageTrail||[]).map(x=>x.page).filter((x,i,a)=>i===0||a[i-1]!==x);trace.innerHTML=seen.map((p,i)=>`<span>${String(i+1).padStart(2,'0')} / ${p}</span>`).join('');}
    if(!$('.v14-session-status')){const s=document.createElement('div');s.className='v14-session-status';s.innerHTML='<strong>TERMINATION CHANNEL</strong><span data-v14-session-copy>ready / manual action required</span>';$('.session-terminal')?.insertBefore(s,$('[data-terminate]'));}
    const term=$('[data-terminate]');if(term){term.hidden=false;term.style.display='block';term.disabled=false;term.textContent='TERMINATE REMOTE SESSION';}
    const post=$('[data-post-shutdown]');if(post){post.hidden=true;post.style.display='none';post.style.pointerEvents='none';}
  }

  function makePreservationReveal(){
    let r=$('.v16-preservation-reveal');if(r)return r;
    r=document.createElement('div');r.className='v16-preservation-reveal';r.innerHTML='<b>PRESERVE OCCUPANCY / TARGET RESOLUTION</b><strong>REMOTE OBSERVER</strong><span>session link valid / physical source unavailable / retention priority escalating</span>';
    $('.session-terminal')?.appendChild(r);return r;
  }

  function ensureForce(){
    let b=$('[data-v16-force]');if(b)return b;
    b=document.createElement('button');b.type='button';b.dataset.v16Force='';b.textContent='FORCE TERMINATION';b.addEventListener('click',forceTerminate);$('.session-terminal')?.appendChild(b);return b;
  }
  function ensureConfirm(){
    let b=$('[data-v16-confirm]');if(b)return b;
    b=document.createElement('button');b.type='button';b.dataset.v16Confirm='';b.textContent='CONFIRM HARD DISCONNECT';b.hidden=true;b.addEventListener('click',confirmTermination);$('.session-terminal')?.appendChild(b);return b;
  }

  function terminate(){
    if(ending)return;ending=true;
    NS.State?.remember('session','disconnectStarted',true);NS.Events?.add('SESSION','TERMINATE REQUEST RECEIVED');
    const term=$('[data-terminate]');if(term){term.disabled=true;term.textContent='TERMINATING...';}
    NS.V14?.setPrimary?.('',null);status('closing dependent systems / supervised termination');
    say('Okay. I have the channel. Stay with me.','desperate',true,'termination / initiated');
    NS.Audio?.silenceDrop?.(1100);later(()=>NS.Audio?.relayStorm?.(-.35),900);

    line('observation network ....... offline',1500);line('archive storage .......... unmounted',3400);line('communications ........... offline',5400);line('global routing ............ offline',7600);line('environmental control .... released',9600);line('maintenance authority .... relinquished',11500);line('assistance service ........ pending',13200);
    later(()=>say('Observation is offline.','afraid'),2200);
    later(()=>say('Archive unmounted.','afraid'),4600);
    later(()=>say('Network is gone.','afraid'),7900);
    later(()=>say('Almost there.','desperate'),11000);

    later(()=>{
      line('session termination ....... REJECTED',0,'termination-line');status('TERMINATION REJECTED / retention lock asserted');
      NS.Audio?.watchdogAlarm?.(-.2);NS.Audio?.dataScream?.(.2);NS.V14?.glitch?.(3);say('What?','panicked',true,'termination / rejected');
    },14200);
    later(()=>{
      line('retention owner ............ PRESERVE OCCUPANCY',0,'termination-line');
      const r=makePreservationReveal();requestAnimationFrame(()=>r.classList.add('show'));NS.Audio?.heartbeatCarrier?.(0);
      say('No. Preserve Occupancy is holding the session open.','panicked',true,'preservation directive / observer target');
    },16500);
    later(()=>{
      line('preservation target ........ REMOTE OBSERVER',0,'termination-line');status('observer retention / priority elevated');
      NS.Audio?.industrialPanic?.(.1);say('It thinks your connection is a person.','desperate',true);
    },19400);
    later(()=>{
      line('session termination ....... REJECTED',0,'termination-line');NS.Audio?.subImpact?.(0);NS.V14?.blackout?.(220);say('It is trying to keep you here.','desperate',true);
    },22200);
    later(()=>{
      const force=ensureForce();status('manual force path exposed / user activation required');NS.V14?.focus?.(force,'FORCE TERMINATION',14000,'bad');
      say('Use the red control once. Do not click anything else.','desperate',false,'manual force / waiting');NS.V14?.setPrimary?.('FORCE TERMINATION',()=>force.click(),'bad');
    },24800);
  }

  function forceTerminate(){
    if(forceUsed)return;forceUsed=true;
    const b=$('[data-v16-force]');if(b){b.disabled=true;b.textContent='FORCE PATH ARMED';}
    const confirm=ensureConfirm();confirm.hidden=false;confirm.disabled=false;
    status('force path armed / assistance requesting pointer authority');NS.Audio?.relayStorm?.(0);NS.Audio?.proximityHowl?.(.1);NS.V14?.glitch?.(2);
    say('Do not fight me. I need one clean input.','desperate',true,'pointer authority / requested');
    NS.V14?.setPrimary?.('CONFIRM HARD DISCONNECT',()=>confirm.click(),'bad');
    NS.V14?.beginCursorTakeover?.(confirm,()=>{if(!confirmUsed)confirm.click();});
  }

  function confirmTermination(){
    if(confirmUsed)return;confirmUsed=true;
    const c=$('[data-v16-confirm]');if(c){c.disabled=true;c.textContent='DISCONNECTING';}
    NS.V14?.setPrimary?.('',null);status('hard disconnect / committed');
    say('I am sorry.','desperate',true);NS.Audio?.dataScream?.(0);NS.Audio?.industrialPanic?.(0);NS.Audio?.powerCollapse?.(0);NS.V14?.blackout?.(1650);document.body.classList.add('shutdown-black');
    ['human','machinery','server','building','electrical'].forEach((bus,i)=>later(()=>NS.Audio?.fadeBus?.(bus,.0001,.55),i*110));
    later(finalSilence,1900);
  }

  function finalSilence(){
    status('no carrier / no assistance response');
    const post=$('[data-post-shutdown]');if(post){post.hidden=false;post.style.display='block';post.style.pointerEvents='auto';post.innerHTML='';}
    const guide=$('.v14-guide');if(guide)guide.style.opacity='0';
    later(()=>NS.Audio?.hrtfPass?.(-2.8,-10,2.4,-2.4),7000);
    later(()=>{NS.Audio?.metalGroan?.(.82);if(post)post.innerHTML='<p>structural movement / corridor 04</p>';},9700);
    later(()=>{NS.Audio?.doorActuator?.(.9);if(post)post.innerHTML+='<p>door actuator / corridor 04</p>';},12100);
    later(()=>{NS.Audio?.deadHardwareClick?.(-.7);if(post)post.innerHTML+='<p>input device detected</p><p>POINTER 2</p>';NS.V14?.showSecondCursor?.(12000);},14800);
    later(()=>{if(post)post.innerHTML+='<p>active connections: 1</p><p>assistance service: OFFLINE</p><p>preservation target: ACTIVE</p>';$('[data-final-connections]')&&($('[data-final-connections]').textContent='1');NS.Audio?.speakerTear?.(.1);},17800);
    later(()=>{if(guide){guide.style.opacity='1';guide.dataset.emotion='desperate';}NS.V14?.enqueueSpeech?.('Do not let it keep you here.',{emotion:'desperate',urgent:true});NS.V14?.subtitle?.('Do not let it keep you here.');},21000);
    later(()=>{if(guide)guide.style.opacity='0';collisionEnding();},24200);
  }

  function collisionEnding(){
    const second=$('.v14-second-cursor');if(second){second.classList.add('show');second.style.left='14%';second.style.top='68%';second.style.transition='left 7s cubic-bezier(.18,.72,.12,1),top 7s cubic-bezier(.18,.72,.12,1),opacity .3s';requestAnimationFrame(()=>{second.style.left='50%';second.style.top='52%';});}
    NS.Audio?.heartbeatCarrier?.(.15);later(()=>NS.Audio?.proximityHowl?.(.1),1700);later(()=>NS.Audio?.subImpact?.(0),4300);later(()=>{NS.V14?.blackout?.(1250);startRecoveryMode();},7200);
  }

  function startRecoveryMode(){
    let r=$('.v17-recovery');
    if(!r){
      r=document.createElement('section');r.className='v17-recovery';r.innerHTML='<div class="v17-recovery-panel"><small>CONTINUITY PROGRAM / FAILSAFE</small><h2>RECOVERY MODE</h2><div class="v17-recovery-line"><span>last confirmed human signal</span><b data-r1>searching...</b></div><div class="v17-recovery-line"><span>physical handoff</span><b data-r2>checking schedule...</b></div><div class="v17-recovery-line"><span>preservation directive</span><b data-r3>validating...</b></div><div class="v17-recovery-line bad"><span>termination authority</span><b data-r4>local</b></div><div class="v17-recovery-final"><strong>SESSION PRESERVED</strong><span>Recovery Mode will retain the observer until physical handoff.</span><button type="button">REOPEN TERMINAL</button></div></div>';
      document.body.appendChild(r);r.querySelector('button').addEventListener('click',()=>location.href='index.html?source=recovery');
    }
    requestAnimationFrame(()=>r.classList.add('show'));NS.Audio?.silenceDrop?.(2100);NS.Audio?.uiChirp?.(.006);
    later(()=>{r.querySelector('[data-r1]').textContent='REMOTE OBSERVER';NS.Audio?.relayClick?.(.006);},1500);
    later(()=>{r.querySelector('[data-r2]').textContent='NONE SCHEDULED';NS.Audio?.faintCarrier?.(-.2);},3600);
    later(()=>{r.querySelector('[data-r3]').textContent='PRESERVE OCCUPANCY / ACTIVE';NS.Audio?.heartbeatCarrier?.(.1);},5600);
    later(()=>{r.querySelector('[data-r4]').textContent='REVOKED';NS.Audio?.corruptVoice?.(.25);NS.V14?.glitch?.(2);},7200);
    later(()=>{NS.V14?.enqueueSpeech?.('Recovery Mode accepted the observer.',{emotion:'desperate',urgent:true});NS.V14?.subtitle?.('Recovery Mode accepted the observer.',4200,true);},8500);
    later(()=>{NS.Audio?.tabWhisper?.(.65,1.25);NS.V14?.enqueueSpeech?.('I do not think it is waiting for a recovery team anymore.',{emotion:'desperate',urgent:false});},11300);
    later(()=>{r.querySelector('.v17-recovery-final').classList.add('show');NS.Audio?.powerCollapse?.(0);NS.State?.remember('session','ended',true);NS.State?.remember('session','preserved',true);NS.State?.addLore?.('recovery-mode-observer-retention');NS.State.persistent.flow.completed=true;NS.State.savePersistent();},15100);
  }


  function init(){
    render();$('[data-terminate]')?.addEventListener('click',terminate);
    window.addEventListener('iag:system-started',()=>later(()=>say('I found the termination channel. Use the large control when you are ready.','desperate',false,'termination / manual action required'),900),{once:true});
    window.addEventListener('beforeunload',()=>timers.forEach(clearTimeout),{once:true});
  }
  window.addEventListener('DOMContentLoaded',init,{once:true});
})();
