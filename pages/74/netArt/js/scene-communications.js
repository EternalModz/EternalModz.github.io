(() => {
  const NS = window.IAG = window.IAG || {};
  const $ = (s) => document.querySelector(s);
  const timers = [];
  const rand = (a,b) => a + Math.random() * (b-a);
  let queue = 184204771;
  let deliveryOpened = false;

  function clock(){
    const el=$("[data-scene-clock]");
    const draw=()=>{if(el)el.textContent=new Date().toLocaleTimeString([], {hour12:false});};
    draw();setInterval(draw,1000);
  }
  function addDelivery(target,status,detail){
    const root=$("[data-delivery-feed]");if(!root)return;
    const time=new Date().toLocaleTimeString([], {hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const p=document.createElement("p");p.innerHTML=`<time>${time}</time><b>${target}</b><span>${status} / ${detail}</span>`;
    root.prepend(p);while(root.children.length>5)root.lastElementChild.remove();
  }
  function deliveryLoop(){
    const events=[["AUTO-4421","delivered","service endpoint"],["RELAY-091","retry","destination sleeping"],["BOT-8172","delivered","automated account"],["ARCHIVE-NOTIFY","queued","recipient inactive"]];
    const e=events[Math.floor(Math.random()*events.length)];addDelivery(...e);queue+=Math.floor(rand(-8,26));
    const qc=$("[data-queue-count]");if(qc)qc.textContent=queue.toLocaleString("en-US");
    if(Math.random()<.28)NS.Audio?.networkPacket?.(rand(-.7,.7));timers.push(setTimeout(deliveryLoop,rand(3600,6200)));
  }
  function dialogueLoop(){
    const root=$("[data-machine-dialogue]");if(!root)return;
    const lines=[["RELAY-04 -> INDEX","queue integrity nominal"],["INDEX -> RELAY-04","route verified"],["ROUTER-12 -> ARCHIVE","recipient resolution failed"]];
    const e=lines[Math.floor(Math.random()*lines.length)],p=document.createElement("p");
    const time=new Date().toLocaleTimeString([], {hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});p.innerHTML=`<time>${time}</time><b>${e[0]}</b><span>${e[1]}</span>`;root.prepend(p);while(root.children.length>5)root.lastElementChild.remove();timers.push(setTimeout(dialogueLoop,rand(6000,9000)));
  }
  function humanCountAnomaly(){
    const id="communications-human-count",el=$("[data-human-count]");if(!el||NS.State?.persistent?.anomaliesSeen?.includes(id))return;
    el.textContent="1";el.classList.add("anomaly-flash");NS.Events?.add("COMMS","ACTIVE HUMAN USERS 1",{anomaly:true});NS.Audio?.humanResidue?.(-.15);NS.State?.markAnomaly(id);
    timers.push(setTimeout(()=>{el.textContent="0";el.classList.remove("anomaly-flash");},1500));
  }
  function revealImpossible({fresh=true}={}){
    const card=$("[data-delivery-anomaly]");if(!card)return;
    card.hidden=false;document.body.classList.add("v12-comms-interrupt","v14-impossible-live");
    const routeCopy=$("[data-archive-route-copy]");if(routeCopy)routeCopy.textContent="attachment recovered / archive object 77-A";
    if(fresh){
      addDelivery("ACCOUNT-204991","DELIVERED","receipt verified");
      NS.Events?.add("DELIVERY","ACCOUNT-204991 DELIVERED",{anomaly:true});NS.Audio?.impossiblePulse?.(.38);NS.State?.markAnomaly("communications-impossible-delivery");
      NS.State?.addLore?.("continuity-relay-dead-recipient");
      setTimeout(()=>NS.Assistant?.say("That shouldn't have delivered.",3600),450);
    }
    setTimeout(()=>window.IAG?.V12?.attend?.("[data-delivery-anomaly]","OPEN DELIVERY",10000),450);
  }
  function impossibleDelivery(){
    const seen=NS.State?.persistent?.anomaliesSeen?.includes("communications-impossible-delivery");
    if(seen){revealImpossible({fresh:false});return;}
    revealImpossible({fresh:true});
  }
  function openDelivery(){
    if(deliveryOpened||NS.State?.persistent?.tasks?.communications)return;deliveryOpened=true;
    const card=$("[data-delivery-anomaly]");if(!card)return;
    NS.State?.touchInteraction("impossible delivery opened");NS.Audio?.relayClick?.(.014);
    card.querySelector("em").textContent="opened / sender unresolved";
    NS.Audio?.presencePass?.(.15);window.IAG?.V12?.rupture?.();
    setTimeout(()=>{NS.State?.completeTask?.("communications");window.IAG?.V12?.release?.();},900);
  }
  function bind(){
    clock();$("[data-delivery-anomaly]")?.addEventListener("click",openDelivery);
    document.querySelectorAll("[data-fragment]").forEach(b=>b.addEventListener("click",()=>NS.Audio?.humanResidue?.(rand(-.65,.65))));
    const start=()=>{
      deliveryLoop();dialogueLoop();
      if(NS.State?.persistent?.tasks?.communications){revealImpossible({fresh:false});return;}
      if(NS.State?.persistent?.anomaliesSeen?.includes("communications-impossible-delivery")){revealImpossible({fresh:false});return;}
      setTimeout(()=>NS.Assistant?.say("Most of this is machine traffic.",2800),700);
      timers.push(setTimeout(humanCountAnomaly,2400));
      timers.push(setTimeout(impossibleDelivery,4700));
    };
    if(document.body.classList.contains("started"))start();else window.addEventListener("iag:system-started",start,{once:true});
  }
  window.addEventListener("DOMContentLoaded",bind,{once:true});
})();
