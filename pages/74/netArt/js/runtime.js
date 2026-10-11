(() => {
  const NS = window.IAG = window.IAG || {};
  let autoEventTimer = null;
  let autonomousStarted = false;

  const pageLabels = {
    index: "remote operations terminal", network: "global network", environment: "environmental control",
    communications: "communications network", archive: "human archive", cameras: "observation network",
    maintenance: "autonomous maintenance", population: "population registry", logs: "system event log", session: "current session"
  };

  async function startSystem({ userInitiated = false } = {}) {
    document.body.classList.add("started");
    document.getElementById("start")?.classList.add("off");

    if (userInitiated && NS.State?.session) {
      NS.State.session.audioUnlocked = true;
      NS.State.saveSession();
      NS.State.unlockStage(1);
    }

    await NS.Audio?.start();
    NS.Telemetry?.start();
    NS.Assistant?.init();
    if (!autonomousStarted) { autonomousStarted = true; autonomousEvents(); }

    if (NS.State?.session && !NS.State.session.established) {
      NS.State.session.established = true;
      NS.State.saveSession();
      NS.Events?.add("SYSTEM", "REMOTE SESSION ESTABLISHED");
      window.setTimeout(() => NS.Assistant?.say("Connection established."), 900);
    }

    window.dispatchEvent(new CustomEvent("iag:system-started", { detail: { page: NS.State?.getPage?.() || "index", userInitiated } }));
  }

  function installAudioResumeFallback() {
    const resume = () => NS.Audio?.resume?.();
    document.addEventListener("pointerdown", resume, { passive: true });
    document.addEventListener("keydown", resume);
  }

  function renderPageLabel() {
    const el = document.querySelector("[data-page-label]");
    if (!el) return;
    const page = NS.State?.getPage?.() || "index";
    const visit = NS.State?.persistent?.pagesVisited?.[page] || 1;
    el.innerHTML = `<strong>${pageLabels[page] || page}</strong>${visit > 1 ? ` / return ${visit}` : " / autonomous network"}`;
  }

  function wirePanels() {
    document.querySelectorAll(".panel[data-layer]").forEach((el) => {
      const activate = (on) => {
        el.classList.toggle("active", on);
        const map = { server:["server",.16], hall:["building",.92], voices:["human",.11], camera:["electrical",.23], session:["electrical",.28] };
        const target = map[el.dataset.layer];
        if (target) NS.Audio?.fadeBus(target[0], on ? target[1] : .0001, on ? 1.8 : 4.4);
      };
      el.addEventListener("mouseenter", () => activate(true));
      el.addEventListener("mouseleave", () => activate(false));
      el.addEventListener("click", () => {
        NS.State?.touchInteraction(`panel ${el.dataset.layer}`);
        NS.Audio?.transition("open");
        activate(true);
        setTimeout(() => activate(false), 7000);
      });
    });
  }

  function wireLinks() {
    document.querySelectorAll("a[href]").forEach((a) => {
      if (a.dataset.wired === "1") return;
      a.dataset.wired = "1";
      a.addEventListener("click", (event) => {
        const href = a.getAttribute("href") || "";
        if (!/\.html(?:\?|$)/.test(href)) return;
        NS.Events?.add("NAV", `ROUTE ${NS.State?.getPage?.() || "index"} -> ${href}`);
        NS.Audio?.transition("close");
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || a.target === "_blank") return;
        event.preventDefault();
        document.body.classList.add("route-leaving");
        window.setTimeout(() => { location.href = href; }, 420);
      });
    });
  }

  function visibilityHooks() {
    const canonicalTitle = document.title;
    document.addEventListener("visibilitychange", () => {
      if (!NS.State) return;
      NS.State.session.visible = !document.hidden;
      NS.State.session.flags ||= {};
      if (document.hidden) {
        NS.State.session.flags.hiddenAt = Date.now();
        document.title = "signal lost";
        window.setTimeout(() => { if (document.hidden) document.title = "reconnecting..."; }, 4500);
        NS.Events?.add("TERMINAL", "VISIBILITY LOST");
      } else {
        const hiddenAt = Number(NS.State.session.flags.hiddenAt || 0);
        const away = hiddenAt ? Date.now() - hiddenAt : 0;
        document.title = canonicalTitle;
        NS.Events?.add("TERMINAL", "VISIBILITY RESTORED", { away });
        const page = NS.State.getPage?.() || "index";
        const lateScene = ["cameras","maintenance","population","logs","session"].includes(page);
        if (lateScene && away > 12000) {
          const seconds = Math.round(away / 1000);
          window.setTimeout(() => NS.Assistant?.say(`Observer signal restored after ${seconds} seconds.`, 4200), 700);
        }
      }
      NS.State.saveSession();
    });
    window.addEventListener("online", () => NS.Events?.add("UPLINK", "RESTORED"));
    window.addEventListener("offline", () => NS.Events?.add("UPLINK", "LOST"));
  }

  function autonomousEvents() {
    const common = [
      ["CACHE","BLOCK VERIFIED"],["CLOCK","DRIFT CORRECTED"],["RELAY","HEALTH CHECK COMPLETE"],
      ["THERMAL","CYCLE NOMINAL"],["ARCHIVE","INDEX ROTATED"],["GRID","LOAD BALANCED"]
    ];
    const loop = () => {
      const [source, message] = common[Math.floor(Math.random() * common.length)];
      NS.Events?.add(source, message);
      autoEventTimer = setTimeout(loop, 6500 + Math.random() * 9000);
    };
    autoEventTimer = setTimeout(loop, 4200 + Math.random() * 4000);
  }

  function renderLogPreview() {
    const root = document.querySelector("[data-log-preview]");
    if (!root || !NS.Events) return;
    const draw = () => {
      const rows = NS.Events.all().slice(-30).reverse();
      root.innerHTML = rows.map((entry) => {
        const time = new Date(entry.at).toLocaleTimeString([], { hour12:false });
        return `<div class="log-row"><time>${time}</time><span><b>${entry.source}</b> / ${entry.message}</span></div>`;
      }).join("");
    };
    draw();
    window.addEventListener("iag:event", draw);
  }

  function boot() {
    NS.State?.recordPageVisit();
    renderPageLabel();
    wirePanels();
    wireLinks();
    visibilityHooks();
    renderLogPreview();

    const start = document.getElementById("start");
    const isIndex = (NS.State?.getPage?.() || "index") === "index";
    const alreadyUnlocked = Boolean(NS.State?.session?.audioUnlocked);

    if (isIndex && !alreadyUnlocked && start) {
      start.addEventListener("click", () => startSystem({ userInitiated:true }), { once:true });
    } else {
      start?.classList.add("off");
      startSystem();
      installAudioResumeFallback();
    }

    setTimeout(wireLinks, 1000);
  }

  window.addEventListener("DOMContentLoaded", boot, { once:true });
})();

(() => {
  const NS=window.IAG=window.IAG||{};
  const order=["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const page=document.body?.dataset?.page||"index",idx=Math.max(0,order.indexOf(page)),next=order[idx+1]||null;
  const hrefs={network:"network.html?source=terminal",environment:"environment.html?source=node071",communications:"communications.html?source=env18",archive:"archive.html?source=delivery",cameras:"cameras.html?id=18&source=archive",maintenance:"maintenance.html?source=cam18",population:"population.html?source=occupancy",logs:"logs.html?source=registry",session:"session.html?source=future"};
  const labels={network:"Global Network",environment:"Environmental Control",communications:"Communications",archive:"Human Archive",cameras:"Observation Network",maintenance:"Maintenance",population:"Population Registry",logs:"System Logs",session:"Disconnect"};

  function align(){
    NS.State.session.flags||={};
    if(page==="index"){NS.State.session.flags["v16:introDone"]=true;NS.State.session.flags["v16:complete:index"]=true;NS.State?.remember?.("index","v16Complete",true);}
    else if(page!=="session"){NS.State?.completeTask?.(page);NS.State.session.flags[`v16:complete:${page}`]=true;NS.State?.remember?.(page,"v16Complete",true);}
    NS.State?.saveSession?.();NS.State?.unlockStage?.(idx+1);
  }
  function go(){if(!next)return;align();NS.Events?.add?.("NAV",`CONTINUE ${page.toUpperCase()} -> ${next.toUpperCase()}`);NS.Audio?.transition?.("close");document.body.classList.add("route-leaving");setTimeout(()=>location.href=hrefs[next]||`${next}.html`,120);}

  function build(){
    if(!next||page==="session"||document.querySelector(".v17-nav"))return;
    const dock=document.createElement("nav");dock.className="v17-nav";dock.setAttribute("aria-label","Continue to next scene");
    dock.innerHTML=`<div><small data-v17-nav-state>continue whenever you're ready</small><strong>${labels[next]||next}</strong></div><button type="button">CONTINUE</button>`;
    dock.querySelector("button").addEventListener("click",go);
    const host=document.querySelector(".v14-guide");(host||document.body).appendChild(dock);
    const reveal=()=>requestAnimationFrame(()=>dock.classList.add("ready"));
    if(page==="index"){
      const start=document.getElementById("start");
      if(!start||start.classList.contains("off")||NS.State?.session?.audioUnlocked)reveal();
      else start.addEventListener("click",()=>setTimeout(reveal,220),{once:true});
    }else reveal();
    const done=()=>{const s=dock.querySelector("[data-v17-nav-state]");if(s)s.textContent="scene response complete";dock.classList.add("recommended");};
    window.addEventListener("iag:v16-complete",done);
    if(NS.State?.session?.flags?.[`v16:complete:${page}`])done();
  }
  window.addEventListener("DOMContentLoaded",build,{once:true});
})();

(() => {
  const NS=window.IAG=window.IAG||{};
  const page=document.body.dataset.page||"index";
  const order=["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const stage=Math.max(0,order.indexOf(page));
  const $=(s,r=document)=>r.querySelector(s);
  const timers=new Set();const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};

  const lore={
    index:["CAS-7 was commissioned to assist remote recovery operators after the Continuity Program became self-governing.","The system was designed to remain calm until a human handoff occurred."],
    network:["Continuity nodes were intended to preserve emergency routing until recovery teams arrived.","NODE-071 has no registered transmitter, yet its observer-channel acknowledgements predate this session."],
    environment:["Room 18 remained pressurized for expected recovery personnel long after recovery operations ceased.","Archived technicians described the pressure anomaly as ‘occupancy without mass.’"],
    communications:["The last authenticated human-origin message predates this session by 22,491 days.","Later packets use valid local routes without sender processes or transmitter hardware."],
    archive:["Incident 18 records the physical removal of camera power, controller, network interface, and eventually the camera body.","Observation records continued for eleven days after removal."],
    cameras:["Operators stopped calling Camera 18 a camera after it began changing only while watched.","The final handwritten note reads: ‘Do not acknowledge Camera 18.’"],
    maintenance:["PRESERVE OCCUPANCY does not appear in the authored maintenance manifest.","Its first execution follows the final confirmed human logout by 0.4 seconds."],
    population:["The registry historically required either physical biometrics or an authenticated terminal identity.","UNRESOLVED-0000 has neither. It persists anyway."],
    logs:["Several earlier remote observers terminated their local sessions successfully.","The Continuity system records those sessions as still present."],
    session:["Recovery Mode was designed to retain the last known human until physical handoff.","No physical recovery team is scheduled."]
  };

  function addLore(){
    const guide=$(".v14-guide");if(!guide||$(".v17-lore",guide))return;
    const d=document.createElement("details");d.className="v17-lore";d.innerHTML=`<summary>Recovered context</summary>${(lore[page]||[]).map(x=>`<p>${x}</p>`).join("")}`;
    const nav=$(".v17-nav",guide);if(nav)guide.insertBefore(d,nav);else guide.appendChild(d);
  }

  function say(text,emotion="afraid",urgent=false,behavior=null){NS.V14?.guide?.(text,{emotion,behavior});NS.V14?.enqueueSpeech?.(text,{emotion,urgent});}
  function corrupt(ms=950){document.body.classList.add("v17-voice-corrupt");NS.Audio?.corruptVoice?.(Math.random()>.5?.18:-.18);NS.V14?.glitch?.(stage>=7?2:1);later(()=>document.body.classList.remove("v17-voice-corrupt"),ms);}

  function installTabHaunting(){
    if(page==="index"||page==="session")return;
    let lastHiddenLine=0;
    const hiddenLines={
      4:["Where did you go?","I lost your observer channel for a second."],
      5:["Why are you leaving me?","Don't leave the camera open without me."],
      6:["Please don't leave me alone with this.","It keeps moving when the interface isn't visible."],
      7:["You disappeared from my view. It still counted you.","Don't do that again. The registry didn't lose you."],
      8:["Please come back.","It writes more when you aren't looking."]
    };
    const returnLines=[
      "You're back.",
      "I heard something while you were gone.",
      "The session stayed active without either of us touching it.",
      "Every time you leave, the observer count takes longer to come back down.",
      "You were gone from my view. You were not gone from its count."
    ];
    window.addEventListener("iag:tab-hidden",()=>{
      if(stage<4||!NS.Audio?.started)return;
      NS.Audio?.tabWhisper?.(Math.random()>.5?.72:-.72,1+Math.min(.6,stage*.06));
      if(stage>=6)NS.Audio?.ventCrawl?.(Math.random()>.5?.7:-.7);
      const arr=hiddenLines[Math.min(8,Math.max(4,stage))]||hiddenLines[8];
      const line=arr[lastHiddenLine++%arr.length];
      if(document.hidden){corrupt(1200);say(line,stage>=7?"desperate":"afraid",stage>=7,"observer link / visibility lost");}
    });
    window.addEventListener("iag:tab-return",e=>{
      if(stage<4)return;
      const n=e.detail?.observer?.tabReturns||1;
      document.body.classList.add("v17-tab-return");later(()=>document.body.classList.remove("v17-tab-return"),650);
      const line=returnLines[Math.min(returnLines.length-1,n-1)];
      later(()=>{corrupt(n>=3?1350:820);say(line,n>=3?"desperate":n>=2?"afraid":"concerned",n>=4,`observer absence / return ${n}`);},420);
    });
  }

  function repelPointer(target,count=8){
    if(!target||!NS.V16?.shortPossession)return;
    document.body.classList.add("v17-pointer-fight");
    const dur=Math.min(6500,3600+(count-7)*520);
    NS.Audio?.industrialPanic?.(Math.random()>.5?.2:-.2);NS.V14?.glitch?.(count>=12?4:3);
    later(()=>NS.V14?.glitch?.(2),520);later(()=>NS.Audio?.speakerTear?.(-.25),780);later(()=>NS.V14?.glitch?.(2),1360);
    NS.V16.shortPossession(target,{duration:dur,pull:"away",line:count>=12?"I said stop. Let go of it.":"Stop. Move away from that control."});
    later(()=>document.body.classList.remove("v17-pointer-fight"),dur+500);
  }

  function cleanRandomCursorArtifacts(){
    $(".v14-watcher")?.remove();
    if(page!=="population"&&page!=="session")$(".v14-second-cursor")?.classList.remove("show");
  }

  function populationSecondCursor(){
    if(page!=="population")return;
    window.addEventListener("iag:task-complete",e=>{
      if(e.detail?.scene!=="population")return;
      later(()=>{say("The old session had an input device too.","desperate",false,"archived observer / pointer channel");NS.Audio?.faintCarrier?.(.45);},5200);
      later(()=>{NS.V14?.showSecondCursor?.(5200);NS.Audio?.corruptVoice?.(-.3);say("That is not a cursor from this session.","panicked",true,"pointer 2 / source unresolved");},7600);
    });
  }

  function richerIdleAudio(){
    if(stage<3||page==="session")return;
    const schedule=()=>later(()=>{
      if(!document.hidden){
        const pan=Math.random()*1.5-.75;
        const r=Math.random();
        if(r<.28)NS.Audio?.faintCarrier?.(pan);
        else if(r<.5)NS.Audio?.tabWhisper?.(pan,.62);
        else if(r<.7)NS.Audio?.lowRoomKnock?.(pan);
        else if(stage>=5&&r<.86)NS.Audio?.hrtfPass?.(-1.6,-7,1.8,-3.2);
        else NS.Audio?.electricalThreat?.(pan);
      }
      schedule();
    },19000+Math.random()*23000);
    schedule();
  }


  function installNaturalUnease(){
    if(stage<4||page==="session")return;
    const key=`v17:unease:${page}`;
    if(NS.State?.session?.flags?.[key])return;
    const lines={
      archive:["Some of these timestamps change when I read them twice.","That should not be possible in a read-only archive."],
      cameras:["Camera 18 has stopped reporting a hardware identity.","It still reports where you are looking."],
      maintenance:["I sent no relay command just now.","I heard one anyway."],
      population:["The registry keeps trying to assign your session an arrival date.","It is choosing dates from before you connected."],
      logs:["There is another line below the one you opened.","I do not want to read it aloud."]
    };
    const pair=lines[page];if(!pair)return;
    later(()=>{
      if(document.hidden)return;
      NS.State.session.flags[key]=true;NS.State.saveSession();
      NS.Audio?.faintCarrier?.(Math.random()>.5?.3:-.3);say(pair[0],stage>=7?"desperate":"afraid",false,"background analysis / unresolved");
      later(()=>{if(!document.hidden){NS.Audio?.tabWhisper?.(Math.random()>.5?.55:-.55,.55);say(pair[1],stage>=7?"desperate":"concerned");}},4200);
    },30000+Math.random()*16000);
  }

  function assistantPanicEscalation(){
    window.addEventListener("iag:assistant-emotion",e=>{
      const state=e.detail?.state||"";if(!/panicked|angry|desperate/.test(state))return;
      if(Math.random()<.45){NS.Audio?.faintCarrier?.(Math.random()>.5?.25:-.25);}
    });
  }

  function init(){cleanRandomCursorArtifacts();addLore();installTabHaunting();populationSecondCursor();richerIdleAudio();installNaturalUnease();assistantPanicEscalation();}
  window.addEventListener("DOMContentLoaded",init,{once:true});
  window.addEventListener("beforeunload",()=>timers.forEach(clearTimeout),{once:true});
  NS.V17={repelPointer,corrupt};
})();

