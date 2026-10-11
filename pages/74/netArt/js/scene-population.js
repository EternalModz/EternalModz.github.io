(() => {
  const NS = window.IAG = window.IAG || {};
  const $ = (s) => document.querySelector(s);
  const mem = () => NS.State?.persistent?.sceneMemory?.population;
  const timers = [];
  let unknownInspected = false;

  function clock(){const el=$("[data-scene-clock]");if(el)el.textContent=new Date().toLocaleTimeString([], {hour12:false});}
  function renderSession(){const id=$("[data-session-registry]");if(id&&NS.State?.session?.id)id.textContent=NS.State.session.id;}
  function voice(text,emotion="concerned",urgent=false,behavior=null){NS.V14?.guide?.(text,{emotion,behavior});NS.V14?.enqueueSpeech?.(text,{emotion,urgent});}

  function showSelf(){
    const active=$("[data-active-persons]");if(!active)return;
    active.textContent="1";document.body.classList.add("v12-registry-one");NS.Audio?.assistantTone?.(.15);
  }

  function revealSecondPresence(){
    if(mem()?.secondPresenceSeen && NS.State?.persistent?.tasks?.population)return;
    const active=$("[data-active-persons]"),unresolved=$("[data-unresolved-persons]"),row=$("[data-registry-unknown]");
    if(!active||!unresolved||!row)return;
    voice("Hold on. The registry is reconciling your session.","concerned",false,"registry refresh / one active presence");
    NS.Audio?.faintCarrier?.(.05);
    timers.push(setTimeout(()=>{
      NS.V14?.glitch?.(2);NS.Audio?.impossiblePulse?.(.05);NS.Audio?.speakerTear?.(-.12);
      active.textContent="2";unresolved.textContent="1";row.hidden=false;row.classList.add("registry-arrival");document.body.classList.add("v17-count-reveal");
      NS.Events?.add("REGISTRY","ACTIVE PERSONS 2 / UNRESOLVED IDENTITY",{anomaly:true});
      NS.State?.remember("population","secondPresenceSeen",true);NS.State?.markAnomaly("population-second-presence");
      timers.push(setTimeout(()=>voice("No. There are two active entries.","panicked",true,"registry / count changed without enrollment"),850));
      timers.push(setTimeout(()=>voice("One is you. The other one has no body, no terminal, and no origin.","desperate",false,"unresolved presence / source absent"),3900));
      timers.push(setTimeout(()=>window.IAG?.V12?.attend?.("[data-registry-unknown]","INSPECT THE SECOND ENTRY",9000),5200));
    },1700));
  }

  function inspectUnknown(){
    if(unknownInspected)return;unknownInspected=true;
    NS.State?.remember("population","recordInspected",true);NS.State?.completeTask?.("population");NS.State?.addLore?.("registry-unresolved-presence");NS.State?.addLore?.("observer-classification-retention");NS.State?.touchInteraction("unresolved population record inspected");
    NS.Audio?.relayClick?.(.011);NS.Audio?.heartbeatCarrier?.(-.08);
    const detail=$("[data-registry-detail]");if(detail)detail.innerHTML='<span class="card-kicker">UNRESOLVED PRESENCE</span><strong>No identity. No terminal. No geographic origin.</strong><p>First detected 22,491 days ago. The record predates CAS-7. Historical reconciliation notes repeatedly classify the same presence as “observer retained after disconnect.”</p>';
    voice("I've seen this identifier before. It was attached to older remote sessions.","desperate",false,"registry history / observer retained");
    window.IAG?.V12?.release?.();
  }

  function init(){
    clock();setInterval(clock,1000);renderSession();
    const active=$("[data-active-persons]");if(active)active.textContent="0";
    $("[data-registry-self]")?.addEventListener("click",()=>{NS.State?.touchInteraction("current population record inspected");voice("That entry is your current session.","afraid");});
    $("[data-registry-unknown]")?.addEventListener("click",inspectUnknown);
    window.addEventListener("iag:system-started",()=>{
      timers.push(setTimeout(showSelf,1900));
      if(!NS.State?.persistent?.tasks?.population)timers.push(setTimeout(revealSecondPresence,7200));
    },{once:true});
  }
  window.addEventListener("DOMContentLoaded",init,{once:true});
})();
