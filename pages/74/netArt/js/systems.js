(() => {
  const NS = window.IAG = window.IAG || {};
  const page = document.body.dataset.page || "index";
  const order = ["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const stage = Math.max(0, order.indexOf(page));
  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  const assets = {
    garage: "https://images.unsplash.com/photo-1726103845428-1681fa8f92a4?auto=format&fit=crop&fm=jpg&q=72&w=1800",
    hallway: "https://images.unsplash.com/photo-1771233458510-2d11a6ea7923?auto=format&fit=crop&fm=jpg&q=72&w=1800",
    industry: "https://images.unsplash.com/photo-1774170962409-c9ed248de723?auto=format&fit=crop&fm=jpg&q=72&w=1800",
    stairs: "https://images.unsplash.com/photo-1690406282752-358876e59134?auto=format&fit=crop&fm=jpg&q=72&w=1800",
    hospital: "https://images.unsplash.com/photo-1775519739368-296dab931a35?auto=format&fit=crop&fm=jpg&q=72&w=1800",
    subway: "https://images.unsplash.com/photo-1768677738917-3a4ab7ecb58c?auto=format&fit=crop&fm=jpg&q=72&w=1800"
  };

  function el(tag, className, html = "") {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (html) node.innerHTML = html;
    return node;
  }

  function injectEnvironment() {
    const backdrop = el("div", "v11-scene-backdrop");
    const darkness = el("div", "v11-darkness");
    const signal = el("div", "v11-signal-layer", '<div class="v11-tear"></div>');
    document.body.prepend(backdrop);
    document.body.append(darkness, signal);

    const progress = el("div", "v11-progress");
    order.forEach((name, i) => {
      const tick = el("i", i < stage ? "past" : i === stage ? "current" : "");
      tick.dataset.scene = name;
      progress.appendChild(tick);
    });
    progress.appendChild(el("small", "", `${String(stage + 1).padStart(2,"0")} / 10`));
    document.body.appendChild(progress);

    const orb = el("div", "v11-assistant-orb");
    orb.setAttribute("aria-hidden", "true");
    document.body.appendChild(orb);

    const msg = document.querySelector("[data-assistant-message]");
    if (msg) {
      const update = () => {
        orb.classList.toggle("speaking", msg.classList.contains("visible") && Boolean(msg.textContent.trim()));
        if (msg.classList.contains("visible")) NS.Audio?.assistantTone?.(stage >= 6 ? -0.25 : 0.3);
      };
      new MutationObserver(update).observe(msg, { attributes:true, childList:true, characterData:true, subtree:true });
      update();
    }

    const presence = document.querySelector("[data-assistant-presence]");
    if (presence) {
      const updateState = () => {
        const t = presence.textContent.toLowerCase();
        orb.classList.toggle("afraid", /uncertain|concern|review|watch|afraid/.test(t) || stage >= 7);
      };
      new MutationObserver(updateState).observe(presence, { childList:true, characterData:true, subtree:true });
      updateState();
    }

    return { backdrop, darkness, signal, orb };
  }

  const env = injectEnvironment();

  function makeArchiveStrip() {
    const host = document.querySelector(".archive-record-card");
    if (!host || host.querySelector(".v11-archive-strip")) return;
    const strip = el("div", "v11-archive-strip");
    const items = [
      ["summer", assets.garage, "SUMMER_2048"],
      ["school", assets.subway, "COURSEWORK"],
      ["camera", assets.hospital, "FACILITY_REFERENCE"],
      ["impossible", assets.hallway, "UNSORTED_MEDIA"]
    ];
    items.forEach(([record, src, label]) => {
      const b = el("button", "v11-archive-thumb", `<img alt="" src="${src}"/><span>${label}</span>`);
      b.type = "button";
      b.setAttribute("aria-label", `Open ${label} archive record`);
      b.addEventListener("click", () => document.querySelector(`[data-record="${record}"]`)?.click());
      strip.appendChild(b);
    });
    const preview = host.querySelector(".archive-preview");
    host.insertBefore(strip, preview || host.firstChild);
  }

  function makeCameraHero() {
    const main = document.querySelector(".camera-layout, .scene-content");
    if (!main || main.querySelector(".v11-camera-hero")) return;
    const hero = el("section", "v11-focus-stage v11-camera-hero");
    hero.innerHTML = `
      <div class="visual-photo" style="--photo:url('${assets.hospital}')"></div>
      <div class="v11-camera-reticle" aria-hidden="true"></div>
      <span class="visual-label" data-v11-cam-label>CAM 04 / LIVE OPTICAL FEED</span>
      <span class="visual-state" data-v11-cam-state>nominal</span>`;
    main.prepend(hero);

    const label = hero.querySelector("[data-v11-cam-label]");
    const state = hero.querySelector("[data-v11-cam-state]");
    const title = document.querySelector("[data-camera-title]");
    const tracking = document.querySelector("[data-camera-tracking]");
    const cam18Status = document.querySelector("[data-cam18-status]");
    const feed = hero.querySelector(".visual-photo");

    function sync() {
      const cam = (title?.textContent || "CAM 04").replace("CAM ", "").trim();
      const map = { "04":assets.hospital, "07":assets.subway, "18":assets.hallway, "22":assets.stairs, "31":assets.garage, "42":assets.industry };
      feed.style.setProperty("--photo", `url('${map[cam] || assets.hospital}')`);
      label.textContent = `CAM ${cam} / ${cam === "18" ? "ARCHIVE OPTICAL ENDPOINT" : "LIVE OPTICAL FEED"}`;
      const isTracking = cam === "18" && ((tracking?.textContent || "").toLowerCase().includes("tracking") || (cam18Status?.textContent || "").includes("TRACKING"));
      hero.classList.toggle("tracking", isTracking);
      state.textContent = isTracking ? "tracking / no control path" : cam === "18" ? "decommissioned" : "nominal";
      if (isTracking) document.body.classList.add("v11-decay");
    }
    [title, tracking, cam18Status].filter(Boolean).forEach(node => new MutationObserver(sync).observe(node, { childList:true, characterData:true, subtree:true }));
    sync();
  }

  function makeMaintenancePhoto() {
    const host = document.querySelector(".maintenance-machine-card");
    if (!host || host.querySelector(".v11-maint-photo")) return;
    host.prepend(el("div", "v11-maint-photo"));
  }

  function directAttention() {
    const selectors = {
      index: ".primary-route",
      network: '[data-node="NODE-071"]',
      environment: '[data-room="18"]',
      communications: "[data-delivery-anomaly]",
      archive: '[data-record="camera"]',
      cameras: '[data-camera="18"]',
      maintenance: '[data-job="camera18"]',
      population: "[data-registry-self]",
      logs: "[data-history-expand]",
      session: "[data-terminate]"
    };
    const target = document.querySelector(selectors[page]);
    if (!target) return;
    const delay = [2400,4200,3600,1000,4200,3200,4200,2400,2200,1800][stage] || 3000;
    setTimeout(() => {
      if (page === "communications" && target.hidden) return;
      target.classList.add("v11-attention");
    }, delay);
  }

  function watchConditionalAttention() {
    const anomaly = document.querySelector("[data-delivery-anomaly]");
    if (anomaly) {
      new MutationObserver(() => {
        if (!anomaly.hidden) {
          anomaly.classList.add("v11-attention");
          NS.Audio?.incomingSignal?.(-0.2);
        }
      }).observe(anomaly, { attributes:true, attributeFilter:["hidden"] });
    }

    const unknown = document.querySelector("[data-registry-unknown]");
    if (unknown) {
      new MutationObserver(() => {
        if (!unknown.hidden) {
          document.body.classList.add("registry-duplicated");
          env.orb.classList.add("duplicate");
          unknown.classList.add("v11-attention");
          glitch("tear", 220);
          NS.Audio?.impossiblePulse?.(0.45);
        }
      }).observe(unknown, { attributes:true, attributeFilter:["hidden"] });
    }
  }

  function pointerLight() {
    if (reduceMotion) return;
    let tx = 50, ty = 48, cx = 50, cy = 48, raf = 0;
    document.addEventListener("pointermove", (e) => {
      tx = (e.clientX / innerWidth) * 100;
      ty = (e.clientY / innerHeight) * 100;
      if (!raf) raf = requestAnimationFrame(move);
    }, { passive:true });
    function move() {
      cx += (tx - cx) * .08;
      cy += (ty - cy) * .08;
      document.documentElement.style.setProperty("--v11-focus-x", `${cx}%`);
      document.documentElement.style.setProperty("--v11-focus-y", `${cy}%`);
      raf = Math.abs(tx-cx)+Math.abs(ty-cy) > .1 ? requestAnimationFrame(move) : 0;
    }
  }

  let glitchLocked = false;
  function glitch(kind = "tear", duration = 140) {
    if (reduceMotion || glitchLocked) return;
    glitchLocked = true;
    const layer = env.signal;
    const tear = layer.querySelector(".v11-tear");
    if (kind === "dropout") {
      layer.className = "v11-signal-layer active dropout";
    } else {
      layer.className = "v11-signal-layer active";
      tear.style.setProperty("--tear-y", `${12 + Math.random()*74}%`);
      tear.style.setProperty("--tear-h", `${4 + Math.random()*10}%`);
      tear.style.setProperty("--tear-x", `${Math.random()>.5 ? 1 : -1}${3 + Math.floor(Math.random()*9)}px`);
      document.body.classList.toggle("v11-chroma", Math.random() < .45);
      document.body.classList.toggle("v11-shift", Math.random() < .62);
    }
    window.setTimeout(() => {
      layer.className = "v11-signal-layer";
      document.body.classList.remove("v11-chroma","v11-shift");
      window.setTimeout(() => { glitchLocked = false; }, 700);
    }, duration);
  }

  function scheduleGlitches() {
    if (reduceMotion || stage < 1) return;
    const ranges = [999, 26000, 24000, 22000, 19000, 16500, 14500, 13000, 11000, 16000];
    const loop = () => {
      const base = ranges[stage] || 18000;
      const delay = base + Math.random() * base * .9;
      setTimeout(() => {
        const rareBlackout = stage >= 5 && Math.random() < Math.min(.18, .04 + stage*.014);
        glitch(rareBlackout ? "dropout" : "tear", rareBlackout ? 320 + Math.random()*360 : 80 + Math.random()*150);
        loop();
      }, delay);
    };
    loop();

    window.addEventListener("iag:anomaly", () => {
      setTimeout(() => glitch(stage >= 7 && Math.random() < .22 ? "dropout" : "tear", 100 + Math.random()*180), 180 + Math.random()*500);
    });
  }

  function routeWatch() {
    const exits = [...document.querySelectorAll("[data-flow-exit]")];
    exits.forEach(exit => {
      let announced = false;
      const sync = () => {
        const visible = !exit.hidden && exit.classList.contains("flow-visible");
        if (visible && !announced) {
          announced = true;
          exit.classList.add("v11-attention");
          NS.Audio?.routeReveal?.(stage % 2 ? 0.28 : -0.28);
          if (navigator.vibrate && stage >= 5) navigator.vibrate(12);
        }
      };
      new MutationObserver(sync).observe(exit, { attributes:true, attributeFilter:["class","hidden"] });
      sync();
    });
  }

  function ambientAudio() {
    const events = {
      index: ["fluorescent","transformer"],
      network: ["dataSweep","transformer"],
      environment: ["fluorescent","airDuct","distantStep"],
      communications: ["incomingSignal","dataSweep"],
      archive: ["storageTick","distantStep"],
      cameras: ["fluorescent","doorActuator","distantStep"],
      maintenance: ["machineryShift","pressureValve","doorActuator"],
      population: ["fluorescent","lowRoom"],
      logs: ["lowRoom","distantStep"],
      session: ["lowRoom"]
    }[page] || [];
    if (!events.length) return;

    const loop = () => {
      const slow = stage < 4 ? 26000 : stage < 7 ? 21000 : 27000;
      setTimeout(() => {
        if (document.hidden || !NS.Audio?.started) { loop(); return; }
        const choice = events[Math.floor(Math.random()*events.length)];
        const pan = -0.85 + Math.random()*1.7;
        if (choice === "fluorescent") NS.Audio?.fluorescentFlicker?.(pan);
        if (choice === "transformer") NS.Audio?.transformerShift?.(pan);
        if (choice === "airDuct") NS.Audio?.airDuct?.(pan);
        if (choice === "distantStep") NS.Audio?.distantStep?.(pan);
        if (choice === "dataSweep") NS.Audio?.dataSweep?.(pan);
        if (choice === "incomingSignal") NS.Audio?.incomingSignal?.(pan);
        if (choice === "storageTick") NS.Audio?.storageTick?.(pan);
        if (choice === "doorActuator") NS.Audio?.doorActuator?.(pan);
        if (choice === "machineryShift") NS.Audio?.machineryShift?.(pan);
        if (choice === "pressureValve") NS.Audio?.pressureValve?.(pan);
        if (choice === "lowRoom") NS.Audio?.lowRoomKnock?.(pan);
        loop();
      }, slow + Math.random()*22000);
    };
    setTimeout(loop, 9000 + Math.random()*9000);
  }

  function sceneSpecific() {
    if (page === "archive") makeArchiveStrip();
    if (page === "cameras") makeCameraHero();
    if (page === "maintenance") makeMaintenancePhoto();

    if (page === "environment") {
      const room = document.querySelector('[data-room="18"]');
      room?.addEventListener("mouseenter", () => NS.Audio?.airDuct?.(0.52));
    }
    if (page === "network") {
      document.querySelector('[data-node="NODE-071"]')?.addEventListener("mouseenter", () => NS.Audio?.dataSweep?.(0.55));
    }
    if (page === "cameras") {
      const feed = document.querySelector('[data-camera="18"]');
      feed?.addEventListener("mouseenter", () => NS.Audio?.deadHardwareClick?.(0.75));
    }
    if (page === "maintenance") {
      document.querySelector('[data-job="camera18"]')?.addEventListener("mouseenter", () => NS.Audio?.machineryShift?.(0.4));
    }
  }

  function sessionOrbShutdown() {
    if (page !== "session") return;
    const sessionPresence = document.querySelector(".session-assistant");
    if (sessionPresence) {
      new MutationObserver(() => {
        if (sessionPresence.classList.contains("assistant-offline")) env.orb.style.opacity = "0";
      }).observe(sessionPresence, { attributes:true, attributeFilter:["class"] });
    }
    new MutationObserver(() => {
      if (document.body.classList.contains("shutdown-black")) env.orb.style.opacity = "0";
    }).observe(document.body, { attributes:true, attributeFilter:["class"] });
  }

  function revisitVisuals() {
    const visits = Number(NS.State?.persistent?.pagesVisited?.[page] || 1);
    if (visits < 2) return;
    document.body.classList.add("v11-returned");
    env.backdrop.style.filter = `saturate(.32) contrast(1.2) brightness(${Math.max(.20,.34 - stage*.012)})`;
    if (page === "environment" && NS.State?.persistent?.sceneMemory?.cameras?.camera18Moved) {
      env.backdrop.style.transform = "scale(1.035) translateX(-1.2%)";
    }
    if (page === "archive" && NS.State?.persistent?.sceneMemory?.cameras?.camera18Moved) {
      document.querySelectorAll(".v11-archive-thumb img").forEach((img, i) => { if (i === 2) img.style.filter = "grayscale(.95) brightness(.33) contrast(1.3)"; });
    }
  }

  function initAfterSystem() {
    routeWatch();
    watchConditionalAttention();
    directAttention();
    ambientAudio();
    revisitVisuals();
    if (stage >= 5) document.body.classList.add("v11-decay");
  }

  document.addEventListener("click", (event) => {
    const route = event.target.closest?.("[data-flow-exit]");
    if (route && !route.hidden) {
      glitch(stage >= 5 ? "dropout" : "tear", stage >= 5 ? 220 : 110);
      NS.Audio?.routeReveal?.(stage % 2 ? .34 : -.34);
    }
  }, { capture:true });

  pointerLight();
  sceneSpecific();
  sessionOrbShutdown();
  scheduleGlitches();
  window.addEventListener("iag:system-started", initAfterSystem, { once:true });
  if (document.body.classList.contains("started")) initAfterSystem();
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  const page = document.body.dataset.page || "index";
  const order = ["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const stage = Math.max(0, order.indexOf(page));
  const $ = (s,root=document) => root.querySelector(s);
  const $$ = (s,root=document) => [...root.querySelectorAll(s)];
  const reduceMotion = matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  let subtitleTimer=null, focusTimer=null, staticTimer=null, voiceEnabled=true;
  let primaryAction=null, primaryLabel="", primaryTone="ok";
  const storyKey=`v14:storyComplete:${page}`;

  const guideCopy = {
    index:"Enter the system. I'll stay with you.",
    network:"Watch the routing fabric. I'll mark anything that breaks the rules.",
    environment:"Room 18 is the only zone I don't trust.",
    communications:"Watch the live relay map. Human endpoints are dead.",
    archive:"Incident 18 is the record you need. The rest is evidence.",
    cameras:"Use a normal camera first. Then select Camera 18.",
    maintenance:"Watch the causal chain. Power should always come first.",
    population:"The registry should show one active person. You.",
    logs:"These logs know more about this session than I do.",
    session:"I'll get you out. Do exactly what I say."
  };

  const actionTargets = {
    network:{sel:'[data-node="NODE-071"]',label:"TRACE NODE-071",anomaly:"network-node071-sync"},
    environment:{sel:'[data-room="18"]',label:"INSPECT ROOM 18",anomaly:"environment-room18-respiratory"},
    communications:{sel:'[data-delivery-anomaly]',label:"OPEN DELIVERY",anomaly:"communications-impossible-delivery"},
    archive:{sel:'[data-record="camera"]',label:"OPEN INCIDENT 18"},
    cameras:{sel:'[data-camera="18"]',label:"SELECT CAMERA 18"},
    maintenance:{sel:'[data-job="occupancy"]',label:"OPEN PRESERVE OCCUPANCY"},
    population:{sel:'[data-registry-unknown]',label:"INSPECT SECOND PRESENCE",anomaly:"population-second-presence"},
    logs:{sel:'[data-future-line]',label:"OPEN FUTURE ENTRY",anomaly:"logs-future-disconnect"}
  };

  const emotionByStage = ["calm","calm","calm","concerned","concerned","afraid","afraid","panicked","desperate","desperate"];

  function makePresentation(){
    if($(".v14-guide")) return;
    const focus=document.createElement("div");focus.className="v14-focus-mask";focus.setAttribute("aria-hidden","true");document.body.appendChild(focus);
    const blackout=document.createElement("div");blackout.className="v14-blackout";blackout.setAttribute("aria-hidden","true");document.body.appendChild(blackout);
    const staticLayer=document.createElement("div");staticLayer.className="v14-static";staticLayer.setAttribute("aria-hidden","true");document.body.appendChild(staticLayer);
    const tear=document.createElement("div");tear.className="v14-screen-tear";tear.setAttribute("aria-hidden","true");document.body.appendChild(tear);
    const subtitle=document.createElement("div");subtitle.className="v14-subtitle";subtitle.setAttribute("aria-live","polite");document.body.appendChild(subtitle);
    const fake=document.createElement("div");fake.className="v14-fake-cursor";fake.setAttribute("aria-hidden","true");document.body.appendChild(fake);
    const second=document.createElement("div");second.className="v14-second-cursor";second.setAttribute("aria-hidden","true");document.body.appendChild(second);

    const guide=document.createElement("aside");guide.className="v14-guide";guide.dataset.emotion=emotionByStage[stage];guide.setAttribute("aria-live","polite");
    guide.innerHTML=`<div class="v14-guide-orb" aria-hidden="true"></div><div class="v14-guide-copy"><b>ASSISTANCE SERVICE <i data-v14-emotion>${emotionByStage[stage]}</i></b><span data-v14-guide>${guideCopy[page]||"I'm here."}</span><small data-v14-behavior>observer link active</small></div><button class="v14-primary" type="button" hidden></button><button class="v14-mini" type="button" data-v14-voice>VOICE ON</button><div class="v14-emotion-meter"><i></i></div>`;
    document.body.appendChild(guide);
    guide.querySelector(".v14-primary").addEventListener("click",()=>primaryAction?.());
    const voiceButton=guide.querySelector("[data-v14-voice]");voiceButton.addEventListener("click",toggleVoice);if(!window.speechSynthesis){voiceButton.textContent="VOICE UNAVAILABLE";voiceButton.disabled=true;voiceEnabled=false;}
    updateEmotion(emotionByStage[stage], Math.min(88,stage*10));
  }

  function guide(text,{emotion=null,behavior=null}={}){
    makePresentation();
    if(emotion) updateEmotion(emotion);
    const line=$("[data-v14-guide]"); if(line) line.textContent=text;
    if(behavior!=null){const b=$("[data-v14-behavior]");if(b)b.textContent=behavior;}
  }

  function setPrimary(label,fn,tone="ok"){
    makePresentation(); primaryLabel=label||"";primaryAction=fn||null;primaryTone=tone;
    const b=$(".v14-primary"); if(!b)return;
    b.hidden=!fn; b.textContent=label||"";b.classList.toggle("bad",tone==="bad");
  }

  function updateEmotion(state,fear=null){
    makePresentation();
    const g=$(".v14-guide"); if(!g)return;
    g.dataset.emotion=state;
    const e=$("[data-v14-emotion]"); if(e)e.textContent=state;
    const currentFear=Number.isFinite(fear)?fear:({calm:8,curious:18,concerned:34,afraid:52,panicked:72,angry:80,desperate:92}[state]||20);
    g.style.setProperty("--fear",`${currentFear}%`);
    NS.State?.setAssistantEmotion?.(state,{fear:currentFear});
  }

  function subtitle(text,ms=3400,bad=false){
    const el=$(".v14-subtitle"); if(!el)return;
    el.textContent=text;el.classList.toggle("bad",bad);el.classList.add("visible");
    clearTimeout(subtitleTimer);subtitleTimer=setTimeout(()=>el.classList.remove("visible"),ms);
  }

  function focus(target,label="LOOK",duration=7000,tone="bad"){
    makePresentation();releaseFocus();
    const el=typeof target==="string"?$(target):target;if(!el||el.hidden)return;
    const r=el.getBoundingClientRect(); const x=(r.left+r.width/2)/innerWidth*100,y=(r.top+r.height/2)/innerHeight*100;
    const mask=$(".v14-focus-mask");mask.style.setProperty("--fx",`${x}%`);mask.style.setProperty("--fy",`${y}%`);mask.classList.add("active");
    el.classList.add("v14-focus-target");if(tone==="ok")el.classList.add("ok");
    const cue=document.createElement("div");cue.className="v14-cue";cue.textContent=label;cue.style.setProperty("--x",`${x}%`);cue.style.setProperty("--y",`${y}%`);document.body.appendChild(cue);
    NS.Audio?.attentionCue?.(x<50?-.62:.62);
    clearTimeout(focusTimer);focusTimer=setTimeout(releaseFocus,duration);
  }
  function releaseFocus(){$$(".v14-focus-target").forEach(x=>x.classList.remove("v14-focus-target","ok"));$(".v14-focus-mask")?.classList.remove("active");$(".v14-cue")?.remove();clearTimeout(focusTimer);}

  function glitch(level=1){if(reduceMotion)return;const tear=$(".v14-screen-tear"),s=$(".v14-static");if(!tear||!s)return;tear.style.setProperty("--ty",`${12+Math.random()*74}%`);tear.style.setProperty("--th",`${3+Math.random()*11}%`);tear.style.setProperty("--tx",`${Math.random()>.5?1:-1}${4+Math.floor(Math.random()*13)}px`);tear.classList.add("active");s.classList.add("active");NS.Audio?.screenRupture?.(.25+level*.18);clearTimeout(staticTimer);staticTimer=setTimeout(()=>{tear.classList.remove("active");s.classList.remove("active")},110+level*80)}
  function blackout(ms=430){const b=$(".v14-blackout");b?.classList.add("active");setTimeout(()=>b?.classList.remove("active"),ms)}

  
  const Voice={queue:[],speaking:false,last:"",voice:null};
  function pickVoice(){const vs=window.speechSynthesis?.getVoices?.()||[];const prefs=[/Natural/i,/Aria/i,/Jenny/i,/Ava/i,/Sonia/i,/Samantha/i,/Google.*English/i,/Microsoft.*English/i];for(const re of prefs){const v=vs.find(x=>re.test(x.name)&&/^en/i.test(x.lang));if(v)return v}return vs.find(v=>/^en-US/i.test(v.lang))||vs.find(v=>/^en/i.test(v.lang))||null}
  function voiceProfile(emotion){return {calm:[.98,1],curious:[.97,1],concerned:[.93,.98],afraid:[.88,.94],panicked:[1.03,.91],angry:[1.08,.86],desperate:[.84,.9]}[emotion]||[.96,1]}
  function enqueueSpeech(text,{urgent=false,emotion=null}={}){
    if(!voiceEnabled||!window.speechSynthesis||!text||text.length>420)return;
    if(text===Voice.last && !urgent)return;
    Voice.last=text;
    if(urgent){window.speechSynthesis.cancel();Voice.queue.length=0;Voice.speaking=false;}
    Voice.queue.push({text,emotion:emotion||$(".v14-guide")?.dataset.emotion||"calm"});runVoice();
  }
  function runVoice(){if(Voice.speaking||!Voice.queue.length||!voiceEnabled)return;const item=Voice.queue.shift();const u=new SpeechSynthesisUtterance(item.text);Voice.voice=pickVoice();if(Voice.voice)u.voice=Voice.voice;u.lang=Voice.voice?.lang||"en-US";const [rate,pitch]=voiceProfile(item.emotion);u.rate=rate;u.pitch=pitch;u.volume=.92;u.onstart=()=>{Voice.speaking=true;subtitle(item.text,Math.max(2600,item.text.length*72),/afraid|panicked|angry|desperate/.test(item.emotion))};u.onend=()=>{Voice.speaking=false;NS.State.persistent.assistant.linesSpoken=(NS.State.persistent.assistant.linesSpoken||0)+1;NS.State.savePersistent();setTimeout(runVoice,120)};u.onerror=()=>{Voice.speaking=false;setTimeout(runVoice,100)};window.speechSynthesis.speak(u)}
  function toggleVoice(){voiceEnabled=!voiceEnabled;const b=$("[data-v14-voice]");if(b)b.textContent=voiceEnabled?"VOICE ON":"VOICE OFF";if(!voiceEnabled){window.speechSynthesis?.cancel?.();Voice.queue.length=0;Voice.speaking=false}else enqueueSpeech("Voice channel restored.",{emotion:"calm"})}

  function wrapAssistant(){
    if(!NS.Assistant?.say||NS.Assistant.say.__v14)return;
    const old=NS.Assistant.say.bind(NS.Assistant);
    const wrapped=(message,duration=4200)=>{
      old(message,duration);
      NS.State.session.flags.v14AssistantCounts ||= {};
      const lineCount=(NS.State.session.flags.v14AssistantCounts[message]||0)+1;
      NS.State.session.flags.v14AssistantCounts[message]=lineCount;NS.State.saveSession();
      if(lineCount>1) return;
      const bad=/don't|no\b|wrong|impossible|shouldn't|stop|please|not me|didn't|there should|what\?|afraid/i.test(message);
      let emotion=$(".v14-guide")?.dataset.emotion||emotionByStage[stage];
      if(/stop|don't|please|no\b|there should only|not me/i.test(message))emotion=stage>=7?"desperate":"afraid";
      guide(message,{emotion});
      enqueueSpeech(message,{urgent:/STOP|NO\.|DON'T MOVE|I SAID/i.test(message),emotion});
    };
    wrapped.__v14=true;NS.Assistant.say=wrapped;
  }

  function controlElement(target){
    return target.closest?.("button,a,[role=button],[data-node],[data-room],[data-camera],[data-job],[data-record],[data-registry-unknown],[data-history-expand],[data-pan],[data-center],[data-terminate],[data-v14-force]")||null;
  }
  function behaviorKey(target){
    const el=controlElement(target);
    if(!el)return null;
    return el.dataset.node||el.dataset.room||el.dataset.camera||el.dataset.job||el.dataset.record||el.dataset.flowExit||el.dataset.pan&&`pan:${el.dataset.pan}`||el.hasAttribute("data-center")&&"camera:center"||el.hasAttribute("data-terminate")&&"terminate"||el.hasAttribute("data-v14-force")&&"force-terminate"||el.getAttribute("data-history-expand")!==null&&"history"||el.textContent.trim().replace(/\s+/g," ").slice(0,42)||el.tagName.toLowerCase();
  }
  function reactiveControl(target,key){
    const el=controlElement(target); if(!el||!key)return false;
    if(el.matches?.('[data-pan]'))return /18/.test(document.querySelector('[data-camera-title]')?.textContent||'');
    return Boolean(el.matches?.('[data-camera="18"],[data-job="occupancy"],[data-registry-unknown],[data-future-line],[data-delivery-anomaly],[data-node="NODE-071"],[data-room="18"],[data-record="camera"],[data-terminate],[data-v14-force]'));
  }

  function repeatedClickReaction(key,count,target){
    if(count<3)return;
    const generic={3:"That control already registered.",5:"It is still processing the same command.",8:"Please stop repeating that input.",12:"Stop. You're not helping."};
    const camera={3:"Camera 18 still has no control board.",5:"I already checked that path twice.",8:"Please stop touching Camera 18.",12:"I said stop touching it."};
    const maintenance={3:"That maintenance job is already open.",5:"Running it again will not make the state safer.",8:"Please stop. Something is responding to the repetition.",12:"STOP. Do not run it again."};
    const map=/18|camera/i.test(key)?camera:/occupancy|889104/i.test(key)?maintenance:generic;
    const line=map[count] || (count>12 && count%5===0 ? `${count} inputs. Stop.` : null);if(!line)return;
    const emotion=count>=12?"angry":count>=8?"afraid":count>=5?"concerned":"calm";
    updateEmotion(emotion,Math.min(96,12+count*6));guide(line,{emotion,behavior:`${key} / repeated input ${count}`});enqueueSpeech(line,{urgent:count>=12,emotion});
    if(count>=7){
      glitch(count>=12?4:count>=9?3:2);
      NS.Audio?.radioBreak?.(Math.random()*.8-.4);
      NS.Audio?.speakerTear?.(Math.random()*.7-.35);
      if(count>=8) NS.V17?.repelPointer?.(target,count);
    }
  }

  function installBehaviorTracking(){
    let lastX=innerWidth/2,lastY=innerHeight/2;
    document.addEventListener("pointermove",e=>{const o=NS.State?.session?.observer;if(!o)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;o.pointerMoves++;o.pointerDistance+=Math.hypot(dx,dy);o.lastPointer={x:e.clientX,y:e.clientY,at:Date.now()};lastX=e.clientX;lastY=e.clientY;if(o.pointerMoves%40===0)NS.State.saveSession()}, {passive:true});
    document.addEventListener("click",e=>{const key=behaviorKey(e.target);if(!key)return;const count=NS.State?.recordClick?.(key)||1;if(reactiveControl(e.target,key))repeatedClickReaction(key,count,e.target);},{capture:true});
    document.addEventListener("pointerover",e=>{const el=e.target.closest?.("[data-camera],[data-node],[data-room],[data-job],[data-record]");if(!el||el.contains(e.relatedTarget))return;const key=behaviorKey(el);NS.State.session.observer.hoverStarted[key]=Date.now();NS.State.saveSession()},{passive:true});
    document.addEventListener("pointerout",e=>{const el=e.target.closest?.("[data-camera],[data-node],[data-room],[data-job],[data-record]");if(!el||el.contains(e.relatedTarget))return;const key=behaviorKey(el),start=NS.State.session.observer.hoverStarted[key];if(!start)return;const ms=Date.now()-start;NS.State.session.observer.hoverMs[key]=(NS.State.session.observer.hoverMs[key]||0)+ms;if(/18/.test(key))NS.State.session.observer.camera18HoverMs=(NS.State.session.observer.camera18HoverMs||0)+ms;delete NS.State.session.observer.hoverStarted[key];NS.State.saveSession()},{passive:true});
    document.addEventListener("visibilitychange",()=>{
      NS.State?.recordTab?.(document.hidden);
      window.dispatchEvent(new CustomEvent(document.hidden?"iag:tab-hidden":"iag:tab-return",{detail:{page,stage,observer:NS.State?.session?.observer}}));
    });
  }

  function semanticize(){
    const nodes=$$("dd,.scene-state,.node-badge,.feed-status,.feed-count,.job-row em,.registry-row span,.climate-copy strong,.v14-comm-node small,[data-machine-state],[data-camera-state],[data-sequence-state]");
    nodes.forEach(el=>{const t=(el.textContent||"").toLowerCase();el.classList.remove("v14-ok","v14-warn","v14-bad");if(/impossible|unresolved|terminated|unknown|tracking|no sender|rejected|failed|preserve occupancy|active persons 2/.test(t))el.classList.add("v14-bad");else if(/offline|degraded|retry|queued|unavailable|removed|pending|standby/.test(t))el.classList.add("v14-warn");else if(/online|nominal|verified|connected|stable|delivered|operational|active/.test(t))el.classList.add("v14-ok")});
    if(page==="cameras"){
      const track=$("[data-camera-tracking]");if(track&&/tracking/i.test(track.textContent))track.classList.add("v14-bad");
      const power=$("[data-camera-power]");if(power&&/0\.00/.test(power.textContent)){power.classList.remove("v14-bad");power.classList.add("v14-ok")}
      const net=$("[data-camera-network]");if(net&&/offline|disconnected/i.test(net.textContent)){net.classList.remove("v14-bad");net.classList.add("v14-ok")}
    }
  }

  function currentAction(){
    if(page==="logs"&&NS.State?.session?.flags?.["v14:logsFutureInspected"]&&!NS.State?.persistent?.sceneMemory?.logs?.oldSessionSeen){const history=$("[data-history-expand]");if(history)return {target:history,label:"EXPAND HISTORY"};}
    const cfg=actionTargets[page];if(!cfg)return null;const target=$(cfg.sel);if(!target||target.hidden)return null;
    if(cfg.anomaly&&!NS.State?.persistent?.anomaliesSeen?.includes(cfg.anomaly))return null;
    if(NS.State?.persistent?.tasks?.[page])return null;
    if(page==="cameras"){
      const moved=NS.State?.persistent?.sceneMemory?.cameras?.camera18Moved;
      if(moved){const pan=$("[data-pan='1']");return pan?{target:pan,label:"TEST CONTROL PATH"}:null;}
    }
    return {target,label:cfg.label};
  }

  function refreshAction(){
    if(page==="session")return;
    const a=currentAction();
    if(a){setPrimary(a.label,()=>{a.target.click();focus(a.target,a.label,3200,"bad")},"bad");return;}
    const exit=$("[data-flow-exit]:not([hidden])");
    if(exit){
      const labels={network:"OPEN ENVIRONMENTAL CONTROL",environment:"FOLLOW THE INCOMING SIGNAL",communications:"OPEN RECOVERED ARCHIVE",archive:"OPEN OBSERVATION NETWORK",cameras:"OPEN MAINTENANCE CONTROL",maintenance:"OPEN POPULATION REGISTRY",population:"OPEN SYSTEM LOGS",logs:"DISCONNECT NOW"};
      setPrimary(labels[page]||"CONTINUE",()=>exit.click(),"ok");return;
    }
    setPrimary("",null);
  }

  function markStoryComplete(delay=0){
    setTimeout(()=>{NS.State.session.flags[storyKey]=true;NS.State.saveSession();window.dispatchEvent(new CustomEvent("iag:v14-story-complete",{detail:{page}}));window.dispatchEvent(new CustomEvent("iag:flow-unlock",{detail:{stage}}));refreshAction();},delay);
  }

  function aftermathNetwork(){
    updateEmotion("concerned",32);guide("That node has no transmitter.",{emotion:"concerned",behavior:"NODE-071 / hardware: none / transmission: active"});
    NS.Audio?.duckWorld?.(3600,.07);setTimeout(()=>{subtitle("NODE-071 -> LOCAL / 0 ms",3000,true);NS.Audio?.carrierScream?.(.42);glitch(1)},1700);
    setTimeout(()=>{guide("Wait.",{emotion:"afraid"});enqueueSpeech("Wait.",{emotion:"afraid"})},4100);
    setTimeout(()=>{guide("I didn't route that.",{emotion:"afraid",behavior:"second packet / origin unresolved"});enqueueSpeech("I didn't route that.",{emotion:"afraid"});markStoryComplete(1800)},6200);
  }

  function aftermathEnvironment(){
    document.body.classList.add("v14-presence-live");updateEmotion("concerned",38);NS.Audio?.ductBreath?.(.45);NS.Audio?.duckWorld?.(4300,.09);
    setTimeout(()=>{guide("The pressure change is moving.",{emotion:"concerned"});enqueueSpeech("The pressure change is moving.",{emotion:"concerned"})},1300);
    setTimeout(()=>{NS.Audio?.hrtfPass?.(-1.8,-6,1.4,-3.2);glitch(1)},3600);
    setTimeout(()=>{guide("It moved.",{emotion:"afraid"});enqueueSpeech("It moved.",{emotion:"afraid"})},6200);
    setTimeout(()=>{guide("Go to Communications.",{emotion:"afraid"});enqueueSpeech("Go to Communications.",{emotion:"afraid"});markStoryComplete(1700)},8100);
  }

  function aftermathCommunications(){
    updateEmotion("afraid",48);const stageEl=$(".v14-comms-stage");if(stageEl&&!$(".v14-live-message",stageEl)){const box=document.createElement("div");box.className="v14-live-message";box.innerHTML='<b>SENDER: NONE / SOURCE: LOCAL</b><p data-v14-typed>...</p><small>recipient terminated 61 years ago</small>';stageEl.appendChild(box);setTimeout(()=>box.classList.add("show"),150);const p=$("[data-v14-typed]",box);setTimeout(()=>p.textContent="are you",1600);setTimeout(()=>p.textContent="are you still there",3300)}
    NS.Audio?.duckWorld?.(6500,.05);setTimeout(()=>{guide("Don't answer it.",{emotion:"afraid"});enqueueSpeech("Don't answer it.",{emotion:"afraid"})},2300);
    setTimeout(()=>{guide("I'm closing it.",{emotion:"panicked"});enqueueSpeech("I'm closing it.",{emotion:"panicked"});$(".v14-live-message")?.classList.remove("show");glitch(2);NS.Audio?.radioBreak?.(.2)},5200);
    setTimeout(()=>{subtitle("ATTACHMENT RECOVERED / INCIDENT 18",3000,true);guide("It attached an archive record by itself.",{emotion:"afraid"});markStoryComplete(1800)},7600);
  }

  function aftermathArchive(){
    updateEmotion("afraid",52);NS.Audio?.storageWake?.(-.25);setTimeout(()=>{guide("They removed the whole camera.",{emotion:"concerned"});enqueueSpeech("They removed the whole camera.",{emotion:"concerned"})},1200);
    setTimeout(()=>{document.body.classList.add("v14-photo-changed");NS.State?.remember?.("archive","changedPhotoSeen",true);subtitle("OBSERVATION SERVICE CONTINUED / 11 DAYS AFTER REMOVAL",3500,true);NS.Audio?.deadHardwareClick?.(.5)},4300);
    setTimeout(()=>{guide("That person wasn't in the photo before.",{emotion:"afraid"});enqueueSpeech("That person wasn't in the photo before.",{emotion:"afraid"});glitch(1)},7200);
    setTimeout(()=>{guide("I remember this image differently.",{emotion:"afraid"});enqueueSpeech("I remember this image differently.",{emotion:"afraid"});markStoryComplete(1900)},9400);
  }

  function aftermathCameras(){
    updateEmotion("panicked",68);document.body.classList.add("v14-cam-shift","v14-cam-follow");NS.Audio?.duckWorld?.(6200,.035);glitch(2);
    setTimeout(()=>{guide("Don't touch it.",{emotion:"afraid"});enqueueSpeech("Don't touch it.",{urgent:true,emotion:"afraid"})},900);
    setTimeout(()=>NS.Audio?.reverseServo?.(.7),2900);
    setTimeout(()=>{guide("The image moved before the motor did.",{emotion:"panicked"});enqueueSpeech("The image moved before the motor did.",{emotion:"panicked"})},4800);
    setTimeout(()=>{guide("It's following the pointer.",{emotion:"panicked"});enqueueSpeech("It's following the pointer.",{emotion:"panicked"});NS.State?.remember?.("cameras","trackedPointer",true)},7200);
    setTimeout(()=>{guide("I didn't do that.",{emotion:"panicked"});enqueueSpeech("I didn't do that.",{emotion:"panicked"});markStoryComplete(2200)},9300);
  }

  function aftermathMaintenance(){
    updateEmotion("panicked",78);const host=$(".maintenance-machine-card");if(host&&!$(".v14-maint-path",host)){const p=document.createElement("div");p.className="v14-maint-path";p.innerHTML="<i></i><i></i><i></i><i></i>";host.appendChild(p);setTimeout(()=>p.classList.add("run"),200)}
    NS.Audio?.machineryShift?.(.3);setTimeout(()=>NS.Audio?.doorActuator?.(-.7),1300);setTimeout(()=>NS.Audio?.hrtfPass?.(-2.2,-7,2,-3),2500);setTimeout(()=>NS.Audio?.distantStep?.(.6),4400);
    setTimeout(()=>{guide("Stop.",{emotion:"panicked"});enqueueSpeech("Stop.",{urgent:true,emotion:"panicked"})},1600);
    setTimeout(()=>{guide("STOP.",{emotion:"angry"});enqueueSpeech("STOP.",{urgent:true,emotion:"angry"});glitch(3)},4200);
    setTimeout(()=>{guide("There's nothing there. I checked.",{emotion:"desperate"});enqueueSpeech("There's nothing there. I checked.",{emotion:"desperate"});NS.State?.remember?.("maintenance","movementPathSeen",true)},6900);
    setTimeout(()=>{guide("It's moving through systems that aren't connected.",{emotion:"desperate"});enqueueSpeech("It's moving through systems that aren't connected.",{emotion:"desperate"});markStoryComplete(2200)},9300);
  }

  function aftermathPopulation(){
    document.body.classList.add("v14-count-two");updateEmotion("panicked",86);NS.Audio?.duckWorld?.(5400,.04);
    setTimeout(()=>{guide("No.",{emotion:"panicked"});enqueueSpeech("No.",{urgent:true,emotion:"panicked"})},700);
    setTimeout(()=>{subtitle("REGISTRY REFRESH / ACTIVE PERSONS: 2",2700,true);NS.Audio?.relayClick?.(.012)},2600);
    setTimeout(()=>{guide("No, that's wrong.",{emotion:"panicked"});enqueueSpeech("No, that's wrong.",{emotion:"panicked"})},4300);
    setTimeout(()=>{guide("There should only be one.",{emotion:"desperate"});enqueueSpeech("There should only be one.",{emotion:"desperate"})},6400);
    setTimeout(()=>{markStoryComplete(1600)},8400);
  }

  function observerSummary(){
    const o=NS.State?.session?.observer;if(!o)return;const avg=o.hesitationSamples?.length?Math.round(o.hesitationSamples.reduce((a,b)=>a+b,0)/o.hesitationSamples.length):0;
    const tz=Intl.DateTimeFormat().resolvedOptions().timeZone||"unknown";const viewport=`${innerWidth}x${innerHeight}`;
    const box=document.createElement("section");box.className="v14-observer-summary";box.innerHTML=`<h3>OBSERVER MODEL / CURRENT SESSION</h3><div class="v14-observer-grid"><div><span>CLICKS</span><b>${o.clicks}</b></div><div><span>TAB ABSENCES</span><b>${o.tabAbsences}</b></div><div><span>RAPID INPUTS</span><b>${o.rapidClicks}</b></div><div><span>POINTER MOVES</span><b>${o.pointerMoves.toLocaleString()}</b></div><div><span>AVG HESITATION</span><b>${avg} ms</b></div><div><span>CAM 18 REVISITS</span><b>${NS.State?.persistent?.observer?.camera18Visits||0}</b></div><div><span>VIEWPORT</span><b>${viewport}</b></div><div><span>TIME ZONE</span><b>${tz}</b></div><div><span>NETWORK</span><b>${navigator.onLine?"ONLINE":"OFFLINE"}</b></div></div>`;
    const root=$(".forensic-log");root?.insertBefore(box,$("[data-history-expand]"));
  }

  function aftermathLogs(){
    updateEmotion("desperate",94);observerSummary();NS.State?.remember?.("logs","behaviorMatchSeen",true);
    setTimeout(()=>{subtitle("BEHAVIOR MATCH FOUND / OPERATOR SESSION 0041 / 92.4%",4200,true);NS.Audio?.carrierScream?.(-.25);glitch(2)},1600);
    setTimeout(()=>{guide("That's impossible.",{emotion:"desperate",behavior:`current session / clicks ${NS.State.session.observer.clicks} / absences ${NS.State.session.observer.tabAbsences}`});enqueueSpeech("That's impossible.",{emotion:"desperate"})},3800);
    setTimeout(()=>{guide("Don't read any more.",{emotion:"desperate"});enqueueSpeech("Don't read any more.",{urgent:true,emotion:"desperate"})},6200);
    setTimeout(()=>{guide("Please disconnect.",{emotion:"desperate"});enqueueSpeech("Please disconnect.",{emotion:"desperate"});markStoryComplete(1600)},8200);
  }

  const aftermathMap={network:aftermathNetwork,environment:aftermathEnvironment,communications:aftermathCommunications,archive:aftermathArchive,cameras:aftermathCameras,maintenance:aftermathMaintenance,population:aftermathPopulation,logs:aftermathLogs};
  function runAftermath(){
    if(!aftermathMap[page])return markStoryComplete();
    const k=`v14:aftermath:${page}`;
    if(NS.State.session.flags[k]){markStoryComplete(300);return;}
    NS.State.session.flags[k]=true;NS.State.saveSession();aftermathMap[page]();
  }

  async function integrateWeather(){
    if(page!=="environment"||!navigator.geolocation||!window.fetch)return;
    const climate=$(".climate-card");if(!climate)return;
    const badge=document.createElement("div");badge.className="v14-weather-badge";badge.innerHTML='<span>LIVE LOCAL EXTERIOR</span><strong>requesting permission...</strong><em>used only in this browser to shape the scene</em>';climate.appendChild(badge);
    navigator.geolocation.getCurrentPosition(async pos=>{
      try{
        const {latitude,longitude}=pos.coords;
        const q=new URLSearchParams({latitude:String(latitude),longitude:String(longitude),current:"temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,surface_pressure,wind_speed_10m,is_day",temperature_unit:"fahrenheit",wind_speed_unit:"mph",timezone:"auto"});
        const res=await fetch(`https://api.open-meteo.com/v1/forecast?${q}`);if(!res.ok)throw new Error("weather unavailable");const data=await res.json();const c=data.current||{};
        const code=Number(c.weather_code||0);const wet=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99].includes(code);const night=Number(c.is_day)===0;
        if(wet)document.body.classList.add("v14-weather-rain");if(night)document.body.classList.add("v14-weather-night");if(Number(c.wind_speed_10m||0)>=12)document.body.classList.add("v14-weather-wind");
        badge.innerHTML=`<span>LIVE LOCAL EXTERIOR</span><strong>${Math.round(c.temperature_2m)} F / ${Math.round(c.wind_speed_10m||0)} MPH WIND</strong><em>${Math.round(c.relative_humidity_2m||0)}% humidity / ${Math.round(c.surface_pressure||0)} hPa / ${wet?"precipitation detected":night?"night conditions":"live weather linked"} / Open-Meteo</em>`;
        const climateCopy=$(".climate-copy strong");if(climateCopy)climateCopy.textContent=wet?"LIVE / PRECIPITATION":night?"LIVE / NIGHT CONDITIONS":"LIVE / CURRENT CONDITIONS";
        $("[data-env-temp]")&&( $("[data-env-temp]").textContent=String(Math.round(c.temperature_2m)) );
        $(".climate-temp span")&&( $(".climate-temp span").textContent="F" );
        $("[data-env-pressure]")&&( $("[data-env-pressure]").textContent=`${Math.round(c.surface_pressure||0)} hPa` );
        $("[data-env-humidity]")&&( $("[data-env-humidity]").textContent=`${Math.round(c.relative_humidity_2m||0)}%` );
        $("[data-env-wind]")&&( $("[data-env-wind]").textContent=`${Math.round(c.wind_speed_10m||0)} mph` );
        NS.State?.cacheWeather?.({temperature:c.temperature_2m,wind:c.wind_speed_10m,humidity:c.relative_humidity_2m,pressure:c.surface_pressure,wet,night});
        if(wet)NS.Audio?.weatherRain?.();if(Number(c.wind_speed_10m||0)>=12)NS.Audio?.airDuct?.(.25);
      }catch(_){badge.innerHTML='<span>LIVE LOCAL EXTERIOR</span><strong>weather link unavailable</strong><em>facility telemetry retained</em>'}
    },()=>{badge.innerHTML='<span>LIVE LOCAL EXTERIOR</span><strong>location permission declined</strong><em>facility telemetry retained</em>'},{enableHighAccuracy:false,timeout:7000,maximumAge:900000});
  }

  function showSecondCursor(ms=2600){const c=$(".v14-second-cursor");if(!c)return;c.style.left=`${55+Math.random()*25}%`;c.style.top=`${35+Math.random()*35}%`;c.classList.add("show");setTimeout(()=>c.classList.remove("show"),ms)}

  function cameraPointerTracking(){
    if(page!=="cameras")return;
    document.addEventListener("pointermove",e=>{
      if(!document.body.classList.contains("v14-cam-follow"))return;
      const hero=$(".v11-camera-hero");if(!hero)return;const r=hero.getBoundingClientRect();const x=Math.max(-30,Math.min(30,(e.clientX-(r.left+r.width/2))/r.width*70));const y=Math.max(-22,Math.min(22,(e.clientY-(r.top+r.height/2))/r.height*55));hero.style.setProperty("--cam-x",`${x}px`);hero.style.setProperty("--cam-y",`${y}px`);
    },{passive:true});
    $("[data-camera='18']")?.addEventListener("click",()=>{NS.State.persistent.observer.camera18Visits=(NS.State.persistent.observer.camera18Visits||0)+1;NS.State.savePersistent()});
  }

  function beginCursorTakeover(target,callback){
    makePresentation();const fake=$(".v14-fake-cursor");if(!fake)return callback?.();
    const last=NS.State?.session?.observer?.lastPointer;
    let x=Number(last?.x)||innerWidth*.5,y=Number(last?.y)||innerHeight*.56,vx=0,vy=0,auto=0;
    document.body.classList.add("v14-cursor-possessed");fake.classList.add("show");fake.style.left=`${x}px`;fake.style.top=`${y}px`;
    let lockRequested=false;try{const req=document.body.requestPointerLock?.();lockRequested=true;req?.catch?.(()=>{})}catch(_){lockRequested=false}
    const start=performance.now();
    const move=e=>{
      const locked=Boolean(document.pointerLockElement);
      const dx=locked?e.movementX:(e.clientX-x),dy=locked?e.movementY:(e.clientY-y);
      const resistance=(performance.now()-start>1700)?.34:.72;
      vx+=dx*resistance;vy+=dy*resistance;
    };
    document.addEventListener("mousemove",move);
    function tick(t){
      const r=typeof target==="string"?$(target)?.getBoundingClientRect():target?.getBoundingClientRect?.();
      const elapsed=t-start;
      if(r&&elapsed>1650){
        const tx=r.left+r.width/2,ty=r.top+r.height/2;auto=Math.min(1,(elapsed-1650)/3600);
        const pull=.012+.105*auto*auto;x+=(tx-x)*pull;y+=(ty-y)*pull;
        if(auto>.42){vx*=.52;vy*=.52}
      }
      x+=vx;y+=vy;vx*=.72;vy*=.72;
      x=Math.max(5,Math.min(innerWidth-25,x));y=Math.max(5,Math.min(innerHeight-30,y));fake.style.left=`${x}px`;fake.style.top=`${y}px`;
      if(elapsed<6800)requestAnimationFrame(tick);else finish();
    }
    function finish(){document.removeEventListener("mousemove",move);if(document.pointerLockElement)document.exitPointerLock?.();document.body.classList.remove("v14-cursor-possessed");fake.classList.remove("show");callback?.()}
    requestAnimationFrame(tick);
  }

  function requestImmersive(){NS.Audio?.resume?.()}

  function syncExistingState(){
    if(page==="environment"&&!$(".v14-air-presence")){const host=$(".rooms-card");if(host){const shape=document.createElement("div");shape.className="v14-air-presence";shape.setAttribute("aria-hidden","true");host.appendChild(shape)}}
    if(NS.State?.persistent?.tasks?.[page]){NS.State.session.flags[storyKey]=true;NS.State.saveSession();}
    refreshAction();
    if(page==="archive"&&NS.State?.persistent?.sceneMemory?.archive?.changedPhotoSeen)document.body.classList.add("v14-photo-changed");
    if(page==="cameras"&&NS.State?.persistent?.sceneMemory?.cameras?.trackedPointer)document.body.classList.add("v14-cam-shift","v14-cam-follow");
    if(page==="population"&&NS.State?.persistent?.sceneMemory?.population?.secondPresenceSeen)document.body.classList.add("v14-count-two");
  }

  function monitorTaskCompletion(e){
    if(e.detail?.scene!==page)return;
    releaseFocus();setPrimary("",null);
    if(NS.V16)return;
    runAftermath();
  }
  function monitorAnomaly(e){const id=e.detail?.id||"";glitch(/camera|maintenance|population|logs/.test(id)?2:1);setTimeout(refreshAction,100);if(page==="environment"&&id==="environment-room18-respiratory")setTimeout(()=>focus('[data-room="18"]',"RESPIRATION DETECTED",6800,"bad"),200);if(page==="communications"&&id==="communications-impossible-delivery")setTimeout(()=>focus('[data-delivery-anomaly]',"DELIVERED TO TERMINATED ACCOUNT",7600,"bad"),200);if(page==="population"&&id==="population-second-presence")setTimeout(()=>focus('[data-registry-unknown]',"SECOND PRESENCE",9000,"bad"),250)}

  function installAmbientThreats(){
    if(stage<3||page==="session")return;
    const loop=()=>setTimeout(()=>{if(!document.hidden&&Math.random()<.72){const pan=Math.random()*1.6-.8;const choices=[()=>NS.Audio?.radioBreak?.(pan),()=>NS.Audio?.electricalThreat?.(pan),()=>NS.Audio?.lowRoomKnock?.(pan),()=>stage>=5&&NS.Audio?.hrtfPass?.(-1.8,-7,1.8,-3),()=>NS.Audio?.faintCarrier?.(pan)];const fn=choices[Math.floor(Math.random()*choices.length)];fn?.()}loop()},15000+Math.random()*22000);loop();
  }

  function installObserverIdle(){
    if(stage<6||page==="session")return;
    let lastMoves=NS.State?.session?.observer?.pointerMoves||0, warned=false;
    setInterval(()=>{
      if(document.hidden)return;
      const moves=NS.State?.session?.observer?.pointerMoves||0;
      if(moves===lastMoves&&!warned){
        warned=true;
        const idleLines={
          cameras:["Why did you stop moving?","Camera 18 stopped when you did."],
          maintenance:["Something in maintenance is waiting for input.","I can hear a relay that is not on this page."],
          population:["The registry still sees you.","It refreshed again. I did not ask it to."],
          logs:["Do not leave the pointer over that entry.","The next event already has an input timestamp."]
        };
        const pool=idleLines[page]||["The observer channel is still active."];
        const line=pool[(NS.State?.session?.observer?.tabReturns||0)%pool.length];
        guide(line,{emotion:stage>=7?"desperate":"afraid",behavior:"observer / pointer stationary"});enqueueSpeech(line,{emotion:stage>=7?"desperate":"afraid"});
        if(page==="cameras"){document.body.classList.add("v14-cam-shift");NS.Audio?.reverseServo?.(.65)}
      }
      if(moves!==lastMoves)warned=false;
      lastMoves=moves;
    },14000);
  }

  function init(){
    makePresentation();wrapAssistant();installBehaviorTracking();cameraPointerTracking();integrateWeather();syncExistingState();installAmbientThreats();installObserverIdle();
    if(page==="index"){setPrimary("",null);guide("Enter the Continuity System. I'll stay with you.",{emotion:"calm"});}
    else guide(guideCopy[page]||"Stay with me.",{emotion:emotionByStage[stage]});
    window.addEventListener("iag:task-complete",monitorTaskCompletion);window.addEventListener("iag:anomaly",monitorAnomaly);window.addEventListener("iag:memory",()=>setTimeout(refreshAction,80));window.addEventListener("iag:flow-unlock",()=>setTimeout(refreshAction,100));window.addEventListener("iag:v14-story-complete",()=>setTimeout(refreshAction,120));
    document.addEventListener("click",e=>{if(e.target.closest?.("#start,button,a,[role=button],[data-node],[data-room],[data-camera],[data-job],[data-record]"))requestImmersive()},{capture:true});
    semanticize();setInterval(()=>{refreshAction();semanticize()},700);
    window.addEventListener("iag:system-started",()=>{
      if(page!=="index")setTimeout(()=>enqueueSpeech(guideCopy[page]||"Stay with me.",{emotion:emotionByStage[stage]}),700);
    },{once:true});
    if(window.speechSynthesis)window.speechSynthesis.onvoiceschanged=()=>{Voice.voice=pickVoice()};
  }

  window.addEventListener("DOMContentLoaded",init,{once:true});
  NS.V14={guide,focus,release:releaseFocus,glitch,blackout,subtitle,setPrimary,updateEmotion,enqueueSpeech,beginCursorTakeover,requestImmersive,markStoryComplete,showSecondCursor,routeReady:(p)=>Boolean(NS.State?.session?.flags?.[`v14:storyComplete:${p}`])};
  NS.V12={attend:focus,release:releaseFocus,rupture:glitch};
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  const page = document.body.dataset.page || "index";
  const order = ["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const stage = Math.max(0, order.indexOf(page));
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const completeKey = `v16:complete:${page}`;
  const sequenceKey = `v16:sequence:${page}`;
  const timers = new Set();
  const later = (fn,ms) => { const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id; };
  let sequenceStarted = false;
  let observerText = null;

  const entryLines = {
    network:["Global routing fabric is healthy. Start with the live topology.","I can resolve anything unusual for you."],
    environment:["Environmental control is responding normally.","Room 18 has one inconsistent sensor history. Nothing urgent."],
    communications:["This is mostly machine traffic now.","Human accounts are archived. Delivery should be impossible."],
    archive:["The archive is read-only. I can help interpret what survived.","Incident 18 is the first record I don't fully understand."],
    cameras:["Observation endpoints are old, but predictable.","Use a normal camera first. Camera 18 should not respond."],
    maintenance:["Maintenance is causal. Power, controller, motor, result.","If that order changes, tell me immediately."],
    population:["Population registry is authoritative.","There should be one active person now. You."],
    logs:["These are the raw records beneath the interface.","I don't like what they're doing with your session."],
    session:["I'm going to close the connection cleanly.","Stay with me until the terminal goes dark."]
  };

  const nextLabels = {
    network:"OPEN ENVIRONMENTAL CONTROL",
    environment:"FOLLOW THE INCOMING SIGNAL",
    communications:"OPEN RECOVERED ARCHIVE",
    archive:"OPEN OBSERVATION NETWORK",
    cameras:"OPEN MAINTENANCE CONTROL",
    maintenance:"OPEN POPULATION REGISTRY",
    population:"OPEN SYSTEM LOGS",
    logs:"DISCONNECT NOW"
  };

  function speak(text, emotion="calm", urgent=false, behavior=null){
    NS.V14?.guide?.(text,{emotion,behavior});
    NS.V14?.enqueueSpeech?.(text,{emotion,urgent});
  }

  function eventCard(title,copy,{tone="bad",life=6200}={}){
    const old=$('.v16-event'); old?.remove();
    const c=document.createElement('div');c.className=`v16-event ${tone==='ok'?'ok':''}`;
    c.innerHTML=`<b>${title}</b><span>${copy}</span>`;document.body.appendChild(c);
    requestAnimationFrame(()=>c.classList.add('show'));
    later(()=>{c.classList.remove('show');later(()=>c.remove(),320)},life);
    return c;
  }

  function lockBadge(active=true,copy="SYSTEM RESPONSE ACTIVE"){
    let b=$('.v16-chapter-lock');
    if(!b){b=document.createElement('div');b.className='v16-chapter-lock';document.body.appendChild(b);}
    b.textContent=copy;b.classList.toggle('active',active);b.hidden=!active;
    return b;
  }

  function setupStageClass(){document.body.classList.add(`v16-stage-${stage}`);}

  function setupRail(){
    const guide=$('.v14-guide');if(!guide)return;
    const old=$('.v15-rail-tools',guide);old?.remove();$('.v15-observer-chip',guide)?.remove();
    if(!$('.v16-rail-tools',guide)){
      const tools=document.createElement('div');tools.className='v16-rail-tools';
      tools.innerHTML='<button type="button" data-v16-evidence>EVIDENCE</button>';
      guide.insertBefore(tools,$('.v14-emotion-meter',guide));
      tools.querySelector('[data-v16-evidence]').addEventListener('click',()=>document.body.classList.toggle('v16-evidence-open'));
    }
    if(!$('.v16-observer',guide)){
      const obs=document.createElement('div');obs.className='v16-observer';obs.innerHTML='<b>OBSERVER LINK</b><span data-v16-observer>session model initializing</span>';
      guide.insertBefore(obs,$('.v14-emotion-meter',guide));observerText=obs.querySelector('[data-v16-observer]');
    } else observerText=$('[data-v16-observer]',guide);
    updateObserver();
  }

  function updateObserver(){
    const o=NS.State?.session?.observer;if(!o||!observerText)return;
    const controls=o.clicks||0, abs=o.tabAbsences||0, dist=Math.round((o.pointerDistance||0)/1000);
    observerText.textContent=`${controls} registered controls / ${abs} absences / ${dist}m pointer path`;
  }
  function requestImmersive(){ NS.Audio?.resume?.(); }

  function wrapRouteReady(){
    if(!NS.V14 || NS.V14.routeReady?.__v16)return;
    const old=NS.V14.routeReady.bind(NS.V14);
    const wrapped=(p)=>{
      if(!old(p))return false;
      if(p==='index'||p==='session')return true;
      return Boolean(NS.State?.session?.flags?.[`v16:complete:${p}`] || NS.State?.persistent?.sceneMemory?.[p]?.v16Complete);
    };
    wrapped.__v16=true;NS.V14.routeReady=wrapped;
  }

  function rewritePrimaryWhenRouteAppears(){
    if(page==='index'||page==='session')return;
    const sync=()=>{
      const exit=$('[data-flow-exit]:not([hidden])');
      if(exit && NS.State?.session?.flags?.[completeKey]){
        NS.V14?.setPrimary?.(nextLabels[page]||'CONTINUE',()=>exit.click(),'ok');
      }
    };
    window.addEventListener('iag:flow-unlock',()=>later(sync,120));
    window.addEventListener('iag:v16-complete',()=>later(sync,180));
    setInterval(sync,1200);
  }

  function markComplete(){
    if(NS.State.session.flags[completeKey])return;
    NS.State.session.flags[completeKey]=true;NS.State.saveSession();NS.State?.remember?.(page,'v16Complete',true);
    lockBadge(false);
    window.dispatchEvent(new CustomEvent('iag:v16-complete',{detail:{page}}));
    window.dispatchEvent(new CustomEvent('iag:flow-unlock',{detail:{stage}}));
  }

  function installGrandOpening(){
    if(page!=='index')return;
    const start=$('#start');
    const route=$('.primary-route');
    document.body.classList.add('v16-intro-complete');
    if(route){route.removeAttribute('aria-disabled');route.tabIndex=0;}
    window.addEventListener('iag:system-started',()=>{
      if(NS.State.session.flags['v16:introDone']){document.body.classList.add('v16-intro-complete');if(route){route.removeAttribute('aria-disabled');route.tabIndex=0;}return;}
      const intro=document.createElement('section');intro.className='v16-intro';intro.innerHTML='<small>CONTINUITY PROGRAM / REMOTE OPERATIONS</small><strong>FACILITY NETWORK 03</strong><p data-v16-intro-copy>Establishing supervised access.</p><div class="v16-line"></div>';
      document.body.appendChild(intro);requestAnimationFrame(()=>intro.classList.add('show'));
      NS.V14?.updateEmotion?.('calm',4);
      later(()=>{intro.querySelector('[data-v16-intro-copy]').textContent='Autonomous infrastructure has remained operational for 61 years.';speak('Hello. I am the Continuity Assistance Service. You can call me C A S seven.','calm',false,'supervised session / nominal');NS.Audio?.assistantTone?.(.1);},1200);
      later(()=>{intro.querySelector('[data-v16-intro-copy]').textContent='No emergency condition is currently declared.';speak('This facility is stable. I will guide you through the surviving systems.','calm');NS.Audio?.transformerShift?.(-.3);},3200);
      later(()=>{intro.querySelector('[data-v16-intro-copy]').textContent='Observer authenticated. Assistance service linked.';speak('You do not need to understand every control. If something requires your attention, I will show you.','calm');NS.Audio?.uiChirp?.(.016);},5200);
      later(()=>{intro.classList.add('hide');document.body.classList.add('v16-intro-complete');if(route){route.removeAttribute('aria-disabled');route.tabIndex=0;}NS.State.session.flags['v16:introDone']=true;NS.State.saveSession();NS.State?.remember?.('index','v16Complete',true);speak('Everything looks normal. Let us begin with the network.','calm');const route=$('.primary-route');if(route)NS.V14?.setPrimary?.('BEGIN FACILITY REVIEW',()=>route.click(),'ok');later(()=>intro.remove(),1100);},7200);
    },{once:true});
  }

  function sceneEntryDialogue(){
    if(page==='index'||page==='session')return;
    window.addEventListener('iag:system-started',()=>{
      const lines=entryLines[page]||[];
      if(!lines.length)return;
      const key=`v16:entry:${page}`;
      if(NS.State.session.flags[key])return;
      NS.State.session.flags[key]=true;NS.State.saveSession();
      later(()=>speak(lines[0],stage<4?'calm':stage<6?'concerned':stage<7?'afraid':'panicked'),1200);
      later(()=>speak(lines[1],stage<4?'calm':stage<6?'concerned':stage<7?'afraid':'panicked'),6700);
    },{once:true});
  }

  function sequenceNetwork(){
    later(()=>{document.body.classList.add('v16-observer-handshake');eventCard('UNSOLICITED HANDSHAKE','NODE-071 acknowledged an observer channel before the terminal requested one.');NS.Audio?.neuralCarrier?.(.1);speak('That address is not another node. It is this terminal.','concerned',false,'observer channel / local endpoint');},11500);
    later(()=>{NS.Audio?.powerCollapse?.(-.15);NS.V14?.glitch?.(1);eventCard('ROUTE TABLE','observer / accepted / source unresolved');speak('It knows which system you are looking at.','afraid');},17200);
    later(()=>{speak('I am opening Environmental Control. I want to see whether it follows us.','afraid');markComplete();},22500);
  }

  function sequenceEnvironment(){
    later(()=>{document.body.classList.add('v16-presence-shown');NS.Audio?.ductBreath?.(.45);eventCard('ROOM 18 / OPTICAL CROSSCHECK','The airflow displacement now occupies the camera boundary.');speak('There. You can see it now.','concerned');},10800);
    later(()=>{document.body.classList.add('v16-presence-moved');NS.Audio?.hrtfPass?.(2.1,-7,-1.7,-3);NS.Audio?.metalGroan?.(-.45);speak('It moved while the sensor sweep was looking somewhere else.','afraid',false,'room 18 / movement correlated with observation');},16500);
    later(()=>{eventCard('EXTERNAL / INTERNAL MISMATCH','No door cycle was recorded. The door is open.');speak('Do not go back to that room. Follow the signal into Communications.','afraid');markComplete();},23500);
  }

  function sequenceCommunications(){
    later(()=>{document.body.classList.add('v16-listening');NS.Audio?.radioBreak?.(-.35);eventCard('LOCAL RELAY','new observer accepted / session '+(NS.State.session.id||'unknown'));speak('It is not sending a message anymore. It is registering you.','afraid',false,'relay / observer registration');},11200);
    later(()=>{const stageEl=$('.v14-comms-stage');if(stageEl&&!$('.v16-message',stageEl)){const m=document.createElement('div');m.className='v14-message-reveal v16-message';m.innerHTML='<b>SOURCE: LOCAL / DESTINATION: LOCAL</b><p>we remember the ones who leave</p>';stageEl.appendChild(m);}NS.Audio?.speakerTear?.(.35);NS.V14?.glitch?.(2);speak('I did not generate that sentence.','panicked');},17600);
    later(()=>{speak('Take the attachment. Incident 18 is older than me.','afraid');markComplete();},24400);
  }

  function sequenceArchive(){
    later(()=>{document.body.classList.add('v16-incorporation-photo');const meta=$('.archive-meta');if(meta)meta.dataset.v16Viewport=`${innerWidth}x${innerHeight}`;NS.Audio?.storageSeek?.(-.25);eventCard('ARCHIVE FRAME MISMATCH',`A remote terminal frame matches this viewport: ${innerWidth}x${innerHeight}.`);speak('That resolution matches your screen.','afraid');},11600);
    later(()=>{NS.Audio?.hardDriveChoke?.(.2);NS.V14?.blackout?.(320);speak('The frame is dated sixty-one years before this session.','panicked',false,'archive / impossible observer frame');},17100);
    later(()=>{speak('Camera 18 was the first thing they tried to remove. I need you to see what it became.','afraid');markComplete();},24200);
  }

  function sequenceCameras(){
    later(()=>{document.body.classList.add('v16-figure');NS.Audio?.silenceDrop?.(4200);NS.Audio?.reverseServo?.(.55);eventCard('CAMERA 18','new foreground object / no motion event / no optical controller');speak('There is something in the frame now.','panicked',true);},10400);
    later(()=>{document.body.classList.add('v16-figure-near');NS.Audio?.proximityHowl?.(.3);NS.V14?.glitch?.(2);speak('It is closer. I did not move the camera.','panicked');},16400);
    later(()=>{speak('Do not move yourself either. It is using your pointer to decide where to look.','desperate',false,'tracking / observer-linked');NS.Audio?.heartbeatCarrier?.(.1);},20700);
    later(()=>{speak('Maintenance. Now. I want the physical records.','desperate');markComplete();},26700);
  }

  function sequenceMaintenance(){
    later(()=>{document.body.classList.add('v16-presence-route');NS.Audio?.relayStorm?.(-.7);later(()=>NS.Audio?.relayStorm?.(.7),800);eventCard('CAUSAL PATH','camera -> elevator -> corridor -> ventilation -> door / no shared power');speak('It is moving through the building as if those systems are one body.','panicked',true);},11200);
    later(()=>{NS.Audio?.industrialPanic?.(.1);NS.V14?.glitch?.(3);speak('Stop. Stop touching anything.','angry',true,'physical systems / sequence repeating');},16900);
    later(()=>{eventCard('PRESERVE OCCUPANCY','target resolution: observer candidate / status pending');speak('No. That directive was supposed to preserve people who were physically here.','desperate');},22500);
    later(()=>{speak('Open Population. I need to know what it thinks you are.','desperate');markComplete();},29200);
  }

  function sequencePopulation(){
    later(()=>{document.body.classList.add('v16-target-acquired');NS.Audio?.heartbeatCarrier?.(0);eventCard('PRESERVATION CANDIDATE','REMOTE OBSERVER / biometric source unavailable / session link valid');speak('It is not counting another person. It is counting your connection as a person.','desperate',true);},10400);
    later(()=>{NS.Audio?.speakerTear?.(-.2);NS.V14?.glitch?.(2);speak('That is why the old sessions never disappeared.','panicked');},16100);
    later(()=>{speak('Go to the raw logs. Do not let the registry refresh again.','desperate');markComplete();},22800);
  }

  function sequenceLogs(){
    later(()=>{document.body.classList.add('v16-model-open');eventCard('INCORPORATION MODEL','observer behavior / session persistence / preservation target scoring');NS.Audio?.dataScream?.(-.15);speak('This is not an occupancy model. It is an incorporation model.','desperate',true);},9600);
    later(()=>{const root=$('[data-forensic-log]');if(root){const p=document.createElement('p');p.className='forensic-row anomaly';p.innerHTML='<time>now</time><b>PRESERVE</b><span>REMOTE OBSERVER / TARGET ACQUIRED</span>';root.prepend(p);}NS.Audio?.industrialPanic?.(.3);speak('It has been trying to keep every observer who connects.','desperate');},15100);
    later(()=>{speak('Do not wait for another prediction. Disconnect now.','desperate',true);markComplete();},21500);
  }

  const sequences={network:sequenceNetwork,environment:sequenceEnvironment,communications:sequenceCommunications,archive:sequenceArchive,cameras:sequenceCameras,maintenance:sequenceMaintenance,population:sequencePopulation,logs:sequenceLogs};

  function startSequence(){
    if(sequenceStarted||!sequences[page]||NS.State.session.flags[completeKey])return;
    sequenceStarted=true;NS.State.session.flags[sequenceKey]=true;NS.State.saveSession();lockBadge(true,'SYSTEM RESPONSE ACTIVE');
    sequences[page]();
  }

  function syncCompletedTask(){
    if(page==='index'||page==='session')return;
    if(NS.State?.persistent?.sceneMemory?.[page]?.v16Complete){NS.State.session.flags[completeKey]=true;NS.State.saveSession();return;}
    if(NS.State?.persistent?.tasks?.[page] && !NS.State.session.flags[completeKey]) later(startSequence,1300);
  }

  function setupTaskExtension(){
    if(page==='index'||page==='session')return;
    window.addEventListener('iag:task-complete',e=>{if(e.detail?.scene!==page)return;later(startSequence,800);});
    syncCompletedTask();
  }

  function shortPossession(target,{duration=3000,pull='away',line=null}={}){
    if(!target||document.pointerLockElement)return;
    const onLock=()=>{
      if(document.pointerLockElement!==document.body)return;
      document.removeEventListener('pointerlockchange',onLock);
      const fake=$('.v14-fake-cursor');if(!fake){document.exitPointerLock?.();return;}
      document.documentElement.classList.add('v16-pointer-locked');document.body.classList.add('v16-pointer-locked');fake.classList.add('show','v16-active');
      const last=NS.State?.session?.observer?.lastPointer;let x=Number(last?.x)||innerWidth*.5,y=Number(last?.y)||innerHeight*.5,vx=0,vy=0;fake.style.left=`${x}px`;fake.style.top=`${y}px`;
      if(line)speak(line,stage>=6?'panicked':'afraid',true,'pointer authority / temporary');
      const note=document.createElement('div');note.className='v16-possession-note';note.textContent='POINTER AUTHORITY CONTESTED / ESC TO RELEASE';document.body.appendChild(note);
      const start=performance.now();
      const move=e=>{const elapsed=performance.now()-start;const userScale=elapsed<900?.72:elapsed<2200?.48:.28;vx+=e.movementX*userScale;vy+=e.movementY*userScale;};document.addEventListener('mousemove',move);
      const tick=t=>{const elapsed=t-start;const r=target.getBoundingClientRect();const tx=pull==='toward'?r.left+r.width/2:(r.left+r.width/2<innerWidth/2?innerWidth*.82:innerWidth*.18);const ty=pull==='toward'?r.top+r.height/2:Math.max(60,Math.min(innerHeight-60,r.top-90));const surge=(Math.sin(elapsed/170)*.5+.5)*(elapsed>900?.022:0);const k=.026+Math.min(.12,elapsed/duration*.095)+surge;x+=(tx-x)*k;y+=(ty-y)*k;x+=vx;y+=vy;vx*=elapsed>1800?.48:.68;vy*=elapsed>1800?.48:.68;x=Math.max(4,Math.min(innerWidth-24,x));y=Math.max(4,Math.min(innerHeight-28,y));fake.style.left=`${x}px`;fake.style.top=`${y}px`;if(elapsed<duration&&document.pointerLockElement===document.body)requestAnimationFrame(tick);else finish();};
      const finish=()=>{document.removeEventListener('mousemove',move);document.documentElement.classList.remove('v16-pointer-locked');document.body.classList.remove('v16-pointer-locked');fake.classList.remove('show','v16-active');note.remove();if(document.pointerLockElement===document.body)document.exitPointerLock?.();};
      requestAnimationFrame(tick);
    };
    document.addEventListener('pointerlockchange',onLock);
    try{const p=document.body.requestPointerLock?.();if(!p&& !document.body.requestPointerLock){document.removeEventListener('pointerlockchange',onLock);return;}p?.catch?.(()=>document.removeEventListener('pointerlockchange',onLock));}catch(_){document.removeEventListener('pointerlockchange',onLock);return;}
    later(()=>document.removeEventListener('pointerlockchange',onLock),1200);
  }

  function installPossessionMoments(){
    document.addEventListener('click',e=>{
      const pan=e.target.closest?.('[data-pan]');
      if(page==='cameras'&&pan&&/CAM 18/i.test($('[data-camera-title]')?.textContent||'')&&!NS.State.session.flags['v16:possession:cameras']){
        NS.State.session.flags['v16:possession:cameras']=true;NS.State.saveSession();shortPossession(pan,{duration:4300,pull:'away',line:'No. Let go of that control.'});
      }
      const occ=e.target.closest?.('[data-job="occupancy"]');
      if(page==='maintenance'&&occ&&!NS.State.session.flags['v16:possession:maintenance']){
        NS.State.session.flags['v16:possession:maintenance']=true;NS.State.saveSession();shortPossession(occ,{duration:5200,pull:'away',line:'Wait. Do not open that. I am taking the pointer.'});
      }
      const hist=e.target.closest?.('[data-history-expand],[data-future-line]');
      if(page==='logs'&&hist&&!NS.State.session.flags['v16:possession:logs']){
        NS.State.session.flags['v16:possession:logs']=true;NS.State.saveSession();shortPossession(hist,{duration:4100,pull:'away',line:'No. Do not read that line.'});
      }
    },{capture:true});
  }

  function replaceFullTakeover(){
    if(!NS.V14)return;
    NS.V14.beginCursorTakeover=(target,callback)=>{
      const el=typeof target==='string'?$(target):target;if(!el){callback?.();return;}
      let launched=false;
      const lock=()=>{
        if(document.pointerLockElement!==document.body||launched)return;launched=true;document.removeEventListener('pointerlockchange',lock);
        const fake=$('.v14-fake-cursor');if(!fake){document.exitPointerLock?.();callback?.();return;}
        document.documentElement.classList.add('v16-pointer-locked');document.body.classList.add('v16-pointer-locked');fake.classList.add('show','v16-active');
        const last=NS.State?.session?.observer?.lastPointer;let x=Number(last?.x)||innerWidth*.5,y=Number(last?.y)||innerHeight*.55,vx=0,vy=0;fake.style.left=`${x}px`;fake.style.top=`${y}px`;
        const start=performance.now();const move=e=>{const elapsed=performance.now()-start;const resistance=elapsed>3600?.12:elapsed>2200?.26:.62;vx+=e.movementX*resistance;vy+=e.movementY*resistance;};document.addEventListener('mousemove',move);
        const note=document.createElement('div');note.className='v16-possession-note';note.textContent='POINTER AUTHORITY CONTESTED / ESC TO RELEASE';document.body.appendChild(note);
        const finish=()=>{document.removeEventListener('mousemove',move);document.documentElement.classList.remove('v16-pointer-locked');document.body.classList.remove('v16-pointer-locked');fake.classList.remove('show','v16-active');note.remove();if(document.pointerLockElement===document.body)document.exitPointerLock?.();callback?.();};
        const tick=t=>{const r=el.getBoundingClientRect(),elapsed=t-start,tx=r.left+r.width/2,ty=r.top+r.height/2;const auto=Math.min(1,Math.max(0,(elapsed-900)/4300)),pulse=(Math.sin(elapsed/150)*.5+.5)*.018,pull=.016+.19*auto*auto+pulse;x+=(tx-x)*pull;y+=(ty-y)*pull;x+=vx;y+=vy;vx*=auto>.45?.45:.7;vy*=auto>.45?.45:.7;x=Math.max(4,Math.min(innerWidth-24,x));y=Math.max(4,Math.min(innerHeight-28,y));fake.style.left=`${x}px`;fake.style.top=`${y}px`;if(elapsed<8200&&document.pointerLockElement===document.body)requestAnimationFrame(tick);else finish();};requestAnimationFrame(tick);
      };
      document.addEventListener('pointerlockchange',lock);
      try{const request=document.body.requestPointerLock?.();if(!request && !document.body.requestPointerLock){launched=true;document.removeEventListener('pointerlockchange',lock);callback?.();return;}request?.catch?.(()=>{if(!launched){launched=true;document.removeEventListener('pointerlockchange',lock);callback?.();}});}catch(_){launched=true;document.removeEventListener('pointerlockchange',lock);callback?.();return;}
      later(()=>{if(!launched){document.removeEventListener('pointerlockchange',lock);callback?.();}},1200);
    };
  }

  function directorIncident(){
    if(page==='index'||page==='session'||stage<3)return;
    const key=`v16:ambient:${page}`;if(NS.State.session.flags[key])return;
    const delay=14500+Math.random()*10000;
    later(()=>{
      if(document.hidden||NS.State.session.flags[key])return;
      NS.State.session.flags[key]=true;NS.State.saveSession();
      if(stage<5){NS.Audio?.speakerTear?.(Math.random()>.5?.45:-.45);NS.V14?.glitch?.(1);}
      else if(stage<7){NS.Audio?.heartbeatCarrier?.(Math.random()>.5?.25:-.25);NS.Audio?.faintCarrier?.(Math.random()>.5?.4:-.4);}
      else {NS.Audio?.industrialPanic?.(Math.random()>.5?.3:-.3);NS.V14?.blackout?.(180);later(()=>NS.Audio?.speakerTear?.(Math.random()>.5?.25:-.25),420);}
    },delay);
  }

  function lateBreakdown(){
    if(stage<5)return;
    later(()=>document.body.classList.add('v16-breakdown-1'),9000);
    if(stage>=7)later(()=>document.body.classList.add('v16-breakdown-2'),18000);
    if(stage>=8)later(()=>document.body.classList.add('v16-breakdown-3'),27000);
  }

  function fixClickTemper(){
    setInterval(updateObserver,1800);
  }

  function sessionIntro(){
    if(page!=='session')return;
    window.addEventListener('iag:system-started',()=>later(()=>speak('I found the termination channel. Use the large control. I will handle the rest.','desperate',true,'termination / manual entry'),700),{once:true});
  }

  function init(){
    setupStageClass();setupRail();wrapRouteReady();rewritePrimaryWhenRouteAppears();replaceFullTakeover();installGrandOpening();sceneEntryDialogue();setupTaskExtension();installPossessionMoments();directorIncident();lateBreakdown();fixClickTemper();sessionIntro();
    window.addEventListener('beforeunload',()=>timers.forEach(clearTimeout),{once:true});
  }

  window.addEventListener('DOMContentLoaded',init,{once:true});
  NS.V16={shortPossession,eventCard,markComplete};
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  const order = ["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const path = Object.fromEntries(order.map((p, i) => [p, i === 0 ? "index.html" : `${p}.html`]));
  const stageOf = (page) => Math.max(0, order.indexOf(page));
  const page = document.body.dataset.page || "index";
  const currentStage = stageOf(page);

  const finished = (scene) => Boolean(NS.State.persistent.tasks?.[scene] && (NS.State.session.flags?.[`v16:complete:${scene}`] || NS.State.persistent.sceneMemory?.[scene]?.v16Complete));
  const requirements = {
    network: () => Boolean(NS.State.session.flags?.["v16:introDone"] || NS.State.persistent.sceneMemory?.index?.v16Complete),
    environment: () => finished("network"),
    communications: () => finished("environment"),
    archive: () => finished("communications"),
    cameras: () => finished("archive"),
    maintenance: () => finished("cameras"),
    population: () => finished("maintenance"),
    logs: () => finished("population"),
    session: () => finished("logs")
  };

  const nextPage = order[currentStage + 1] || null;

  function syncUnlocks() {
    let unlocked = 0;
    for (let i = 1; i < order.length; i++) {
      const candidate = order[i];
      const req = requirements[candidate];
      if (req && req()) unlocked = i;
      else break;
    }
    if (NS.State.persistent.flow.unlockedStage !== unlocked) {
      NS.State.persistent.flow.unlockedStage = unlocked;
      NS.State.savePersistent();
      window.dispatchEvent(new CustomEvent("iag:flow-unlock", { detail: { stage: unlocked } }));
    }
    return unlocked;
  }

  function guardRoute() { return true; }

  if (!guardRoute()) return;

  function revealExit() {
    if (!nextPage) return;
    const unlocked = syncUnlocks();
    if (unlocked < currentStage + 1) return;
    if (page !== "index" && window.IAG?.V14 && !window.IAG.V14.routeReady(page)) return;
    let newlyVisible = false;
    document.querySelectorAll(`[data-flow-exit="${nextPage}"]`).forEach((el) => {
      if (el.hidden) newlyVisible = true;
      el.hidden = false;
      requestAnimationFrame(() => el.classList.add("flow-visible"));
    });
    if (newlyVisible) {
      NS.State.session.flags ||= {};
      const key = `flowCue:${page}->${nextPage}`;
      if (!NS.State.session.flags[key]) {
        NS.State.session.flags[key] = true;
        NS.State.saveSession();
        const cues = {
          index: "Network access restored.",
          network: "Room 18.",
          environment: "Incoming.",
          communications: "Archive attached.",
          archive: "Camera 18.",
          cameras: "Service record.",
          maintenance: "Population.",
          population: "Logs.",
          logs: "Disconnect."
        };
        const cueDelay = { index:800, network:900, environment:900, communications:900, archive:900, cameras:1100, maintenance:900, population:900, logs:1100 }[page] || 900;
        setTimeout(() => NS.Assistant?.say(cues[page] || "Route resolved.", 5200), cueDelay);
      }
    }
  }

  function routeHref(target) {
    const sources = {
      network: "terminal", environment: "node071", communications: "env18",
      archive: "delivery", cameras: "archive", maintenance: "cam18",
      population: "occupancy", logs: "registry", session: "future"
    };
    if (target === "cameras") return `cameras.html?id=18&source=archive`;
    return `${path[target]}?source=${sources[target] || page}`;
  }

  function decorateExits() {
    document.querySelectorAll("[data-flow-exit]").forEach((el) => {
      const target = el.dataset.flowExit;
      if (target) el.setAttribute("href", routeHref(target));
      el.hidden = true;
    });
    revealExit();
  }

  function routeDeniedNotice() {
    const q = new URLSearchParams(location.search);
    if (q.get("route") !== "unresolved") return;
    const note = document.createElement("div");
    note.className = "route-denied-echo";
    note.textContent = "requested route unresolved / returned to last valid system";
    document.body.appendChild(note);
    setTimeout(() => note.classList.add("visible"), 80);
    setTimeout(() => note.classList.remove("visible"), 5200);
  }

  function revisitMutations() {
    const visits = NS.State.persistent.pagesVisited[page] || 0;
    if (visits <= 1) return;
    document.body.classList.add("is-revisit");

    const marker = document.querySelector("[data-page-label]");
    if (marker) marker.dataset.revisit = String(visits);

    if (page === "network" && NS.State.persistent.sceneMemory.maintenance.impossibleCycleSeen) {
      const node = document.querySelector('[data-node="NODE-071"]');
      if (node) {
        node.classList.add("node-erased");
        node.querySelector("em")?.replaceChildren(document.createTextNode(""));
      }
    }

    if (page === "environment" && NS.State.persistent.sceneMemory.cameras.camera18Moved) {
      const room = document.querySelector('[data-room="18"]');
      if (room) {
        room.classList.add("revisit-occupancy");
        const resp = room.querySelector("[data-room18-respiratory]");
        if (resp) {
          resp.textContent = "occupancy 1";
          setTimeout(() => { resp.textContent = "respiratory sources 0"; }, 5200);
        }
      }
    }

    if (page === "communications" && NS.State.persistent.sceneMemory.archive.opened?.length) {
      const feed = document.querySelector("[data-delivery-feed]");
      if (feed) {
        const row = document.createElement("p");
        row.className = "return-message";
        row.innerHTML = `<time>now</time><b>ARCHIVE</b><span>record access acknowledged</span>`;
        feed.prepend(row);
      }
    }

    if (page === "archive" && NS.State.persistent.sceneMemory.cameras.camera18Moved) {
      const list = document.querySelector("[data-archive-list]");
      if (list && !list.querySelector('[data-return-record]')) {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "archive-item impossible-return";
        b.dataset.returnRecord = "1";
        b.innerHTML = `<span>LIVE-CAM18 / ACCESS_TRACE</span><small>created after archive closure</small>`;
        list.appendChild(b);
      }
    }
  }

  function impossibleLinks() {
    if (page === "cameras" && NS.State.persistent.sceneMemory.cameras.camera18Moved) {
      const target = document.querySelector("[data-camera-board]");
      if (target && !target.querySelector("a")) {
        const a = document.createElement("a");
        a.href = "maintenance.html?source=removed&device=cam18";
        a.className = "impossible-inline-link";
        a.textContent = target.textContent || "removed";
        a.addEventListener("click", () => NS.State.markImpossibleLink("camera-board-removed"));
        target.textContent = "";
        target.appendChild(a);
      }
    }
  }

  function progressionLoop() {
    syncUnlocks();
    revealExit();
    impossibleLinks();
  }

  function init() {
    decorateExits();
    routeDeniedNotice();
    revisitMutations();
    impossibleLinks();
    window.addEventListener("iag:anomaly", progressionLoop);
    window.addEventListener("iag:memory", progressionLoop);
    window.addEventListener("iag:flow-unlock", revealExit);
    window.addEventListener("iag:task-complete", progressionLoop);
    window.setInterval(progressionLoop, 900);

    document.querySelectorAll("a[data-flow-exit]").forEach((a) => {
      a.addEventListener("click", () => {
        NS.Events?.add("ROUTE", `${page.toUpperCase()} -> ${a.dataset.flowExit.toUpperCase()}`);
        NS.Audio?.transition?.("close");
      });
    });
  }

  window.addEventListener("DOMContentLoaded", init, { once: true });
  NS.Flow = { order, stageOf, syncUnlocks, revealExit };
})();

