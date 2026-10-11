(() => {
  const NS = window.IAG = window.IAG || {};
  const STORAGE_KEY = "iag.systemState.v1";
  const SESSION_KEY = "iag.sessionState.v1";
  const pageNames = ["index","network","environment","communications","archive","cameras","maintenance","population","logs","session"];
  const now = () => Date.now();

  function freshPersistentState() {
    return {
      version: 10,
      firstVisit: now(), lastVisit: now(), visits: 0, pagesVisited: {}, interactions: 0,
      anomaliesSeen: [],
      assistant: { state: "calm", trust: 0, fear: 0, anger: 0, linesSpoken: 0 },
      observer: { totalClicks: 0, totalTabAbsences: 0, totalRevisits: 0, totalRapidClicks: 0, camera18Visits: 0 },
      flow: { unlockedStage: 0, completed: false, routeHistory: [], revisits: {}, impossibleLinksSeen: [] },
      tasks: { network:false, environment:false, communications:false, archive:false, cameras:false, maintenance:false, population:false, logs:false },
      lore: { fragments: [] },
      sceneMemory: {
        archive:{ opened:[], recommended:null, impossibleFileSeen:false, cameraReferenceSeen:false, changedPhotoSeen:false },
        cameras:{ inspected:[], camera18Moved:false, viewerAnomalySeen:false, trackedPointer:false },
        maintenance:{ inspected:[], impossibleCycleSeen:false, preserveOccupancySeen:false, movementPathSeen:false },
        population:{ secondPresenceSeen:false, recordInspected:false },
        logs:{ futureEntrySeen:false, oldSessionSeen:false, behaviorMatchSeen:false },
        session:{ disconnectStarted:false, ended:false, preserved:false }
      },
      weather: { lastUpdated:0, summary:null },
      world: { networkHealth:92.4, powerReserve:71.2, activeNodes:618, degradedNodes:14, offlineNodes:91, maintenanceJobs:34 }
    };
  }

  function freshSessionState() {
    return {
      id:`S-${Math.random().toString(36).slice(2,8).toUpperCase()}`,
      startedAt:now(), lastPage:null, pageTrail:[], visible:!document.hidden, audioUnlocked:false, established:false, flags:{},
      observer:{
        clicks:0, clickCounts:{}, pageClicks:{}, rapidClicks:0, tabAbsences:0, tabReturns:0,
        pointerMoves:0, pointerDistance:0, lastPointer:null, lastClickAt:0, hesitationSamples:[], pageEnteredAt:now(),
        hoverMs:{}, hoverStarted:{}, camera18HoverMs:0, hiddenAt:null
      }
    };
  }

  function readJSON(storage,key,fallback){
    try { const raw=storage.getItem(key); return raw ? {...fallback,...JSON.parse(raw)} : fallback; }
    catch(_) { return fallback; }
  }

  const defaults=freshPersistentState();
  const persistent=readJSON(localStorage,STORAGE_KEY,defaults);
  const session=readJSON(sessionStorage,SESSION_KEY,freshSessionState());
  const loadedVersion=Number(persistent.version||0);
  if(loadedVersion<10){
    persistent.anomaliesSeen=[];
    persistent.tasks={...defaults.tasks};
    persistent.lore={fragments:[]};
    persistent.flow={...defaults.flow};
    persistent.sceneMemory=JSON.parse(JSON.stringify(defaults.sceneMemory));
    persistent.assistant={...defaults.assistant};
    persistent.observer={...defaults.observer};
    session.pageTrail=[]; session.flags={}; session.observer=freshSessionState().observer;
  }
  persistent.version=10;
  persistent.pagesVisited||={}; persistent.anomaliesSeen||=[];
  persistent.assistant={...defaults.assistant,...(persistent.assistant||{})};
  persistent.observer={...defaults.observer,...(persistent.observer||{})};
  persistent.weather={...defaults.weather,...(persistent.weather||{})};
  persistent.world={...defaults.world,...(persistent.world||{})};
  persistent.flow={...defaults.flow,...(persistent.flow||{})};
  persistent.flow.routeHistory||=[]; persistent.flow.revisits||={}; persistent.flow.impossibleLinksSeen||=[];
  persistent.tasks={...defaults.tasks,...(persistent.tasks||{})};
  persistent.lore={...defaults.lore,...(persistent.lore||{})}; persistent.lore.fragments||=[];
  persistent.sceneMemory||={};
  Object.entries(defaults.sceneMemory).forEach(([scene,value])=>persistent.sceneMemory[scene]={...value,...(persistent.sceneMemory[scene]||{})});

  session.pageTrail||=[]; session.flags||={}; session.visible=!document.hidden;
  session.observer={...freshSessionState().observer,...(session.observer||{})};
  session.observer.clickCounts||={}; session.observer.pageClicks||={}; session.observer.hesitationSamples||=[]; session.observer.hoverMs||={}; session.observer.hoverStarted||={};

  function savePersistent(){persistent.lastVisit=now();localStorage.setItem(STORAGE_KEY,JSON.stringify(persistent));}
  function saveSession(){sessionStorage.setItem(SESSION_KEY,JSON.stringify(session));}
  function getPage(){return document.body?.dataset?.page||"index";}

  function recordPageVisit(page=getPage()){
    if(!pageNames.includes(page))return;
    persistent.visits+=1;
    const before=persistent.pagesVisited[page]||0;
    persistent.pagesVisited[page]=before+1;
    if(before>0){ persistent.flow.revisits[page]=(persistent.flow.revisits[page]||0)+1; persistent.observer.totalRevisits+=1; }
    persistent.flow.routeHistory.push({page,at:now(),search:location.search||""}); persistent.flow.routeHistory=persistent.flow.routeHistory.slice(-120);
    session.lastPage=page; session.pageTrail.push({page,at:now()}); session.pageTrail=session.pageTrail.slice(-80);
    session.observer.pageEnteredAt=now(); session.observer.pageClicks[page]||=0;
    savePersistent(); saveSession();
  }

  function touchInteraction(type="interaction"){
    persistent.interactions+=1; savePersistent();
    if(NS.Events)NS.Events.add("USER",type.toUpperCase());
  }

  function recordClick(key="unknown"){
    const o=session.observer, p=getPage(), t=now();
    o.clicks+=1; persistent.observer.totalClicks+=1;
    o.clickCounts[key]=(o.clickCounts[key]||0)+1; o.pageClicks[p]=(o.pageClicks[p]||0)+1;
    if(o.lastClickAt && t-o.lastClickAt<420){ o.rapidClicks+=1; persistent.observer.totalRapidClicks+=1; }
    if(o.lastClickAt) o.hesitationSamples.push(Math.min(15000,t-o.lastClickAt));
    o.hesitationSamples=o.hesitationSamples.slice(-80); o.lastClickAt=t;
    saveSession(); savePersistent();
    return o.clickCounts[key];
  }

  function recordTab(hidden){
    const o=session.observer;
    if(hidden){o.tabAbsences+=1;o.hiddenAt=now();persistent.observer.totalTabAbsences+=1;}
    else{o.tabReturns+=1;o.hiddenAt=null;}
    saveSession();savePersistent();
  }

  function markAnomaly(id){if(!persistent.anomaliesSeen.includes(id)){persistent.anomaliesSeen.push(id);savePersistent();window.dispatchEvent(new CustomEvent("iag:anomaly",{detail:{id}}));}}
  function remember(scene,key,value){persistent.sceneMemory[scene]||={};persistent.sceneMemory[scene][key]=value;savePersistent();window.dispatchEvent(new CustomEvent("iag:memory",{detail:{scene,key,value}}));}
  function rememberUnique(scene,key,value){persistent.sceneMemory[scene]||={};const arr=Array.isArray(persistent.sceneMemory[scene][key])?persistent.sceneMemory[scene][key]:[];if(!arr.includes(value))arr.push(value);persistent.sceneMemory[scene][key]=arr;savePersistent();return arr;}
  function unlockStage(stage){const n=Number(stage)||0;if(n>persistent.flow.unlockedStage){persistent.flow.unlockedStage=n;savePersistent();window.dispatchEvent(new CustomEvent("iag:flow-unlock",{detail:{stage:n}}));}}
  function markImpossibleLink(id){if(!persistent.flow.impossibleLinksSeen.includes(id)){persistent.flow.impossibleLinksSeen.push(id);savePersistent();}}
  function completeTask(scene){if(!scene||!(scene in persistent.tasks)||persistent.tasks[scene])return false;persistent.tasks[scene]=true;savePersistent();window.dispatchEvent(new CustomEvent("iag:task-complete",{detail:{scene}}));return true;}
  function addLore(id){if(!id||persistent.lore.fragments.includes(id))return false;persistent.lore.fragments.push(id);savePersistent();window.dispatchEvent(new CustomEvent("iag:lore",{detail:{id}}));return true;}
  function setAssistantEmotion(state,{fear,anger}={}){persistent.assistant.state=state;if(Number.isFinite(fear))persistent.assistant.fear=Math.max(0,Math.min(100,fear));if(Number.isFinite(anger))persistent.assistant.anger=Math.max(0,Math.min(100,anger));savePersistent();window.dispatchEvent(new CustomEvent("iag:assistant-emotion",{detail:{...persistent.assistant}}));}
  function cacheWeather(summary){persistent.weather={lastUpdated:now(),summary};savePersistent();}
  function resetAll(){localStorage.removeItem(STORAGE_KEY);sessionStorage.removeItem(SESSION_KEY);}

  NS.State={persistent,session,getPage,recordPageVisit,touchInteraction,recordClick,recordTab,markAnomaly,remember,rememberUnique,unlockStage,markImpossibleLink,completeTask,addLore,setAssistantEmotion,cacheWeather,savePersistent,saveSession,resetAll};
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  const KEY = "iag.events.v1";
  const maxEvents = 180;

  function read() {
    try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); }
    catch (_) { return []; }
  }

  function write(events) {
    sessionStorage.setItem(KEY, JSON.stringify(events.slice(-maxEvents)));
  }

  function add(source, message, meta = {}) {
    const events = read();
    const entry = {
      at: Date.now(),
      source,
      message,
      page: document.body.dataset.page || "index",
      ...meta
    };
    events.push(entry);
    write(events);
    window.dispatchEvent(new CustomEvent("iag:event", { detail: entry }));
    return entry;
  }

  function all() { return read(); }

  NS.Events = { add, all };
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  let hideTimer = null;

  function presenceText() {
    const state = NS.State?.persistent?.assistant?.state || "standby";
    return state === "standby" ? "assistance service / online" : `assistance service / ${state}`;
  }

  function renderPresence() {
    const el = document.querySelector("[data-assistant-presence]");
    if (el) el.textContent = presenceText();
  }

  function say(message, duration = 4200) {
    const el = document.querySelector("[data-assistant-message]");
    if (!el) return;
    window.clearTimeout(hideTimer);
    el.textContent = message;
    el.classList.add("visible");
    NS.Events?.add("ASSIST", message);
    window.dispatchEvent(new CustomEvent("iag:assistant-say", { detail: { message, duration } }));
    hideTimer = window.setTimeout(() => el.classList.remove("visible"), duration);
  }

  function setState(state) {
    if (!NS.State) return;
    NS.State.persistent.assistant.state = state;
    NS.State.savePersistent();
    renderPresence();
  }

  function init() {
    renderPresence();
  }

  NS.Assistant = { init, say, setState };
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  let timer = null;

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const drift = (v, amount, a, b) => clamp(v + (Math.random() - 0.5) * amount, a, b);

  function tickWorld() {
    if (!NS.State) return;
    const w = NS.State.persistent.world;
    w.networkHealth = drift(Number(w.networkHealth), 0.16, 86, 99.6);
    w.powerReserve = drift(Number(w.powerReserve), 0.22, 48, 94);
    if (Math.random() < 0.08) w.degradedNodes = clamp(w.degradedNodes + (Math.random() < 0.5 ? -1 : 1), 3, 31);
    if (Math.random() < 0.05) w.maintenanceJobs = clamp(w.maintenanceJobs + (Math.random() < 0.5 ? -1 : 1), 12, 66);
    NS.State.savePersistent();
  }

  function formatDuration(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const h = String(Math.floor(sec / 3600)).padStart(2, "0");
    const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }

  function render() {
    if (!NS.State) return;
    const w = NS.State.persistent.world;
    const age = Date.now() - NS.State.session.startedAt;
    const values = {
      network: `${Number(w.networkHealth).toFixed(2)}%`,
      power: `${Number(w.powerReserve).toFixed(1)}%`,
      nodes: String(w.activeNodes),
      jobs: String(w.maintenanceJobs),
      session: formatDuration(age)
    };
    document.querySelectorAll("[data-telemetry]").forEach((el) => {
      const key = el.dataset.telemetry;
      if (values[key] !== undefined) el.textContent = values[key];
    });
  }

  function start() {
    if (timer) return;
    render();
    timer = window.setInterval(() => {
      tickWorld();
      render();
    }, 1800);
  }

  NS.Telemetry = { start, render, formatDuration };
})();

(() => {
  const NS = window.IAG = window.IAG || {};
  let ctx = null;
  let master = null;
  let verb = null;
  let started = false;
  const layers = {};
  const timers = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  const busTargets = {
    building: 0.72,
    electrical: 0.14,
    server: 0.09,
    machinery: 0.0001,
    ui: 0.0001,
    human: 0.0001,
    anomaly: 0.0001,
    assistant: 0.0001
  };

  function noiseBuffer(sec = 8, type = "white") {
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    const d = b.getChannelData(0);
    let p = 0, br = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      if (type === "brown") { br = (br + 0.018 * w) / 1.018; d[i] = br * 3.5; }
      else if (type === "pink") { p = p * 0.985 + w * 0.015; d[i] = w * 0.28 + p * 0.72; }
      else d[i] = w;
    }
    return b;
  }

  function impulse(sec = 6.5, decay = 4.4) {
    const b = ctx.createBuffer(2, Math.floor(ctx.sampleRate * sec), ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, decay);
    }
    return b;
  }

  function spatial(node, wet = 0.35, dry = 1) {
    const a = ctx.createGain();
    const s = ctx.createGain();
    a.gain.value = dry;
    s.gain.value = wet;
    node.connect(a); node.connect(s);
    a.connect(master); s.connect(verb);
  }

  function gainLayer(name, initial = 0.0001) {
    const g = ctx.createGain();
    g.gain.value = initial;
    layers[name] = g;
    return g;
  }

  function fadeBus(name, target, time = 2.4) {
    const g = layers[name];
    if (!g || !ctx) return;
    const now = ctx.currentTime;
    g.gain.cancelScheduledValues(now);
    g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, target), now + time);
  }

  function setupBuilding() {
    const bus = gainLayer("building", 0.0001);
    const rum = ctx.createBufferSource();
    const rf = ctx.createBiquadFilter();
    const rg = ctx.createGain();
    rum.buffer = noiseBuffer(12, "brown"); rum.loop = true;
    rf.type = "lowpass"; rf.frequency.value = 170; rg.gain.value = 0.07;
    rum.connect(rf); rf.connect(rg); rg.connect(bus); rum.start();

    const air = ctx.createBufferSource();
    const af = ctx.createBiquadFilter();
    const ag = ctx.createGain();
    air.buffer = noiseBuffer(10, "pink"); air.loop = true;
    af.type = "bandpass"; af.frequency.value = 650; af.Q.value = 0.4; ag.gain.value = 0.025;
    air.connect(af); af.connect(ag); ag.connect(bus); air.start();
    spatial(bus, 0.28, 0.92);
  }

  function setupElectrical() {
    const bus = gainLayer("electrical", 0.0001);
    [[30, 0.8], [60, 0.45], [120, 0.12], [180, 0.05]].forEach(([f, level], i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = i < 2 ? "sine" : "triangle"; o.frequency.value = f; g.gain.value = level;
      o.connect(g); g.connect(bus); o.start();
    });
    spatial(bus, 0.1, 0.95);
  }

  function setupServer() {
    const bus = gainLayer("server", 0.0001);
    const n = ctx.createBufferSource(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    n.buffer = noiseBuffer(9, "pink"); n.loop = true;
    f.type = "bandpass"; f.frequency.value = 980; f.Q.value = 0.7; g.gain.value = 0.055;
    n.connect(f); f.connect(g); g.connect(bus); n.start();
    spatial(bus, 0.18, 0.92);
  }

  function setupMachinery() {
    const bus = gainLayer("machinery", 0.0001);

    const fan = ctx.createOscillator();
    const fanGain = ctx.createGain();
    const fanLfo = ctx.createOscillator();
    const fanLfoGain = ctx.createGain();
    fan.type = "triangle";
    fan.frequency.value = 82;
    fanGain.gain.value = 0.02;
    fanLfo.type = "sine";
    fanLfo.frequency.value = 0.08;
    fanLfoGain.gain.value = 5;
    fanLfo.connect(fanLfoGain);
    fanLfoGain.connect(fan.detune);
    fan.connect(fanGain);
    fanGain.connect(bus);
    fan.start();
    fanLfo.start();

    const air = ctx.createBufferSource();
    const airFilter = ctx.createBiquadFilter();
    const airGain = ctx.createGain();
    air.buffer = noiseBuffer(10, "pink");
    air.loop = true;
    airFilter.type = "bandpass";
    airFilter.frequency.value = 410;
    airFilter.Q.value = 1.1;
    airGain.gain.value = 0.022;
    air.connect(airFilter);
    airFilter.connect(airGain);
    airGain.connect(bus);
    air.start();

    spatial(bus, 0.42, 0.7);
  }

  function setupEmptyBuses() {
    ["ui", "human", "anomaly", "assistant"].forEach((name) => {
      if (!layers[name]) gainLayer(name, 0.0001);
    });
  }

  function uiChirp(level = 0.018) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine"; o.frequency.setValueAtTime(840, now); o.frequency.exponentialRampToValueAtTime(1260, now + 0.08);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(level, now + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    o.connect(g); spatial(g, 0.12, 0.85); o.start(now); o.stop(now + 0.18);
  }

  function relayClick(level = 0.024) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.06), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 6);
    const s = ctx.createBufferSource(); const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    s.buffer = b; f.type = "bandpass"; f.frequency.value = 1700; f.Q.value = 2.3; g.gain.value = level;
    s.connect(f); f.connect(g); spatial(g, 0.1, 0.9); s.start(now);
  }

  function motorWake(level = 0.018) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const f = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(54, now);
    o.frequency.exponentialRampToValueAtTime(118, now + 0.9);
    f.type = "lowpass";
    f.frequency.value = 620;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(level, now + 0.18);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.35);
    o.connect(f); f.connect(g); spatial(g, 0.34, 0.65);
    o.start(now); o.stop(now + 1.4);
  }

  function bootTick(step = 0) {
    if (!ctx) return;
    if (step === 0) relayClick(0.022);
    if (step === 1) uiChirp(0.011);
    if (step === 2) { relayClick(0.014); motorWake(0.015); fadeBus("server", 0.09, 1.8); }
    if (step === 3) uiChirp(0.009);
    if (step === 4) { relayClick(0.018); motorWake(0.012); fadeBus("machinery", 0.035, 2.1); }
  }

  function subsystemHover(page = "network") {
    if (!ctx) return;
    const frequencies = {
      network: 620, environment: 540, communications: 710, archive: 470, cameras: 820,
      maintenance: 390, population: 590, logs: 660, session: 760
    };
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = frequencies[page] || 600;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.0035, now + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.095);
    o.connect(g); spatial(g, 0.08, 0.9);
    o.start(now); o.stop(now + 0.11);
  }

  function transition(kind = "open") {
    relayClick();
    const delay = kind === "close" ? 80 : 120;
    timers.push(window.setTimeout(() => uiChirp(kind === "close" ? 0.012 : 0.018), delay));
  }


  function networkPacket(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const p = ctx.createStereoPanner();
    o.type = "sine";
    o.frequency.setValueAtTime(1180, now);
    o.frequency.exponentialRampToValueAtTime(780, now + 0.12);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.0065, now + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    p.pan.value = Math.max(-1, Math.min(1, panValue));
    o.connect(g); g.connect(p); spatial(p, 0.18, 0.82);
    o.start(now); o.stop(now + 0.2);
  }

  function airShift(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource();
    const bp = ctx.createBiquadFilter();
    const g = ctx.createGain();
    const p = ctx.createStereoPanner();
    src.buffer = noiseBuffer(1.8, "pink");
    bp.type = "bandpass";
    bp.frequency.setValueAtTime(260, now);
    bp.frequency.exponentialRampToValueAtTime(720, now + 1.4);
    bp.Q.value = 0.7;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.012, now + 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    p.pan.value = Math.max(-1, Math.min(1, panValue));
    src.connect(bp); bp.connect(g); g.connect(p); spatial(p, 0.72, 0.28);
    src.start(now); src.stop(now + 1.8);
  }

  function humanResidue(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 1.8;
    const bus = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    const p = ctx.createStereoPanner();
    [112, 146, 181].forEach((base, i) => {
      const o = ctx.createOscillator();
      const f = ctx.createBiquadFilter();
      const g = ctx.createGain();
      o.type = i === 0 ? "sawtooth" : "sine";
      o.frequency.setValueAtTime(base, now);
      o.frequency.linearRampToValueAtTime(base * (0.96 + Math.random() * 0.08), now + dur);
      f.type = "bandpass";
      f.frequency.value = 540 + i * 430;
      f.Q.value = 2.2;
      g.gain.value = 0.018 / (i + 1);
      o.connect(f); f.connect(g); g.connect(bus);
      o.start(now); o.stop(now + dur);
    });
    lp.type = "lowpass";
    lp.frequency.value = 1350;
    bus.gain.setValueAtTime(0.0001, now);
    bus.gain.exponentialRampToValueAtTime(0.13, now + 0.45);
    bus.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    p.pan.value = Math.max(-1, Math.min(1, panValue));
    bus.connect(lp); lp.connect(p); spatial(p, 1.0, 0.05);
  }

  function impossiblePulse(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const g = ctx.createGain();
    const sg = ctx.createGain();
    const p = ctx.createStereoPanner();
    o.type = "sine";
    sub.type = "sine";
    o.frequency.setValueAtTime(164, now);
    o.frequency.exponentialRampToValueAtTime(103, now + 1.1);
    sub.frequency.setValueAtTime(41, now);
    sub.frequency.exponentialRampToValueAtTime(29, now + 1.1);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.012, now + 0.09);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.25);
    sg.gain.setValueAtTime(0.0001, now);
    sg.gain.exponentialRampToValueAtTime(0.025, now + 0.05);
    sg.gain.exponentialRampToValueAtTime(0.0001, now + 1.45);
    p.pan.value = Math.max(-1, Math.min(1, panValue));
    o.connect(g); sub.connect(sg); g.connect(p); sg.connect(p); spatial(p, 0.68, 0.5);
    o.start(now); sub.start(now); o.stop(now + 1.3); sub.stop(now + 1.5);
  }

  function activateForPage(page) {
    if (!ctx) return;
    const map = {
      index: { building: 0.72, electrical: 0.14, server: 0.09, machinery: 0.035 },
      network: { building: 0.48, electrical: 0.19, server: 0.14, machinery: 0.028 },
      environment: { building: 0.58, electrical: 0.07, server: 0.035 },
      communications: { building: 0.38, electrical: 0.11, server: 0.08 },
      archive: { building: 0.34, electrical: 0.08, server: 0.055 },
      cameras: { building: 0.46, electrical: 0.18, server: 0.055, machinery: 0.024 },
      maintenance: { building: 0.68, electrical: 0.25, server: 0.085, machinery: 0.105 },
      population: { building: 0.31, electrical: 0.095, server: 0.042 },
      logs: { building: 0.34, electrical: 0.12, server: 0.075 },
      session: { building: 0.30, electrical: 0.075, server: 0.035, machinery: 0.018 }
    };
    const targets = map[page] || map.index;
    Object.entries(busTargets).forEach(([name]) => fadeBus(name, targets[name] ?? 0.0001, 4.2));
  }

  async function start() {
    if (started) {
      if (ctx && ctx.state === "suspended") {
        try { await ctx.resume(); } catch (_) {}
      }
      return;
    }
    started = true;
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.7, ctx.currentTime + 4.5);

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 18; comp.ratio.value = 3.2; comp.attack.value = 0.015; comp.release.value = 0.5;

    verb = ctx.createConvolver(); verb.buffer = impulse();
    const vf = ctx.createBiquadFilter(); const vg = ctx.createGain();
    vf.type = "lowpass"; vf.frequency.value = 4800; vg.gain.value = 0.42;
    verb.connect(vf); vf.connect(vg); vg.connect(master);
    master.connect(comp); comp.connect(ctx.destination);

    setupBuilding();
    setupElectrical();
    setupServer();
    setupMachinery();
    setupEmptyBuses();
    activateForPage(NS.State?.getPage?.() || "index");
    transition("open");
    try { await ctx.resume(); } catch (_) {}
    NS.Events?.add("AUDIO", "ENVIRONMENT ONLINE");
  }

  async function resume() {
    if (!started) return start();
    if (ctx && ctx.state === "suspended") {
      try { await ctx.resume(); } catch (_) {}
    }
  }

  function stop() {
    timers.forEach(window.clearTimeout);
    timers.length = 0;
    if (ctx) ctx.close();
    ctx = null; master = null; verb = null; started = false;
  }


  function panned(node, panValue = 0, wet = 0.3, dry = 0.8) {
    if (!ctx) return;
    const p = ctx.createStereoPanner();
    p.pan.value = Math.max(-1, Math.min(1, panValue));
    node.connect(p);
    spatial(p, wet, dry);
  }

  function storageWake(panValue = -0.22) {
    if (!ctx) return;
    const now = ctx.currentTime;
    relayClick(0.016);
    const o = ctx.createOscillator(); const g = ctx.createGain(); const f = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(34, now + 0.08);
    o.frequency.exponentialRampToValueAtTime(118, now + 0.95);
    f.type = "lowpass"; f.frequency.value = 520;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.012, now + 0.28);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 1.7);
    o.connect(f); f.connect(g); panned(g, panValue, 0.38, 0.7);
    o.start(now + 0.08); o.stop(now + 1.75);
    timers.push(window.setTimeout(() => storageSeek(panValue), 780));
  }

  function storageSeek(panValue = -0.22) {
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 4; i++) {
      const when = now + i * 0.095;
      const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.035), ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let j = 0; j < d.length; j++) d[j] = (Math.random()*2-1)*Math.pow(1-j/d.length,7);
      const src = ctx.createBufferSource(); const bp = ctx.createBiquadFilter(); const g = ctx.createGain();
      src.buffer = b; bp.type = "bandpass"; bp.frequency.value = 920 + i*140; bp.Q.value = 3.2; g.gain.value = 0.014;
      src.connect(bp); bp.connect(g); panned(g, panValue + i*0.03, 0.2, 0.82); src.start(when);
    }
  }

  function servoSweep(panValue = 0.55, impossible = false) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain(); const bp = ctx.createBiquadFilter();
    o.type = "sawtooth";
    o.frequency.setValueAtTime(impossible ? 88 : 104, now);
    o.frequency.linearRampToValueAtTime(impossible ? 146 : 188, now + 0.72);
    o.frequency.linearRampToValueAtTime(impossible ? 96 : 118, now + 1.28);
    bp.type = "bandpass"; bp.frequency.value = impossible ? 760 : 980; bp.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(impossible ? 0.019 : 0.012, now + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, now + 1.32);
    o.connect(bp); bp.connect(g); panned(g, panValue, impossible ? 0.62 : 0.35, 0.7); o.start(now); o.stop(now + 1.35);
  }

  function pressureRelease(panValue = -0.45) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource(); const bp = ctx.createBiquadFilter(); const g = ctx.createGain();
    src.buffer = noiseBuffer(1.3, "pink"); bp.type = "bandpass"; bp.frequency.value = 580; bp.Q.value = 0.75;
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.018, now + 0.06); g.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
    src.connect(bp); bp.connect(g); panned(g, panValue, 0.55, 0.4); src.start(now); src.stop(now + 1.25);
  }

  function pumpCycle(panValue = 0.18, impossible = false) {
    if (!ctx) return;
    if (!impossible) relayClick(0.018);
    const now = ctx.currentTime + (impossible ? 0 : 0.14);
    const o = ctx.createOscillator(); const g = ctx.createGain(); const lp = ctx.createBiquadFilter();
    o.type = "triangle"; o.frequency.setValueAtTime(41, now); o.frequency.exponentialRampToValueAtTime(73, now + 0.75);
    lp.type = "lowpass"; lp.frequency.value = 330;
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(impossible ? 0.032 : 0.022, now + 0.24); g.gain.exponentialRampToValueAtTime(0.012, now + 1.5); g.gain.exponentialRampToValueAtTime(0.0001, now + 2.35);
    o.connect(lp); lp.connect(g); panned(g, panValue, 0.46, 0.75); o.start(now); o.stop(now + 2.4);
    if (!impossible) timers.push(window.setTimeout(() => pressureRelease(panValue - 0.12), 1650));
  }

  function deadHardwareClick(panValue = 0.7) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random()*2-1)*Math.pow(1-i/d.length,8);
    const s = ctx.createBufferSource(); const bp = ctx.createBiquadFilter(); const g = ctx.createGain();
    s.buffer = b; bp.type = "bandpass"; bp.frequency.value = 1180; bp.Q.value = 3.4; g.gain.value = 0.022;
    s.connect(bp); bp.connect(g); panned(g, panValue, 0.72, 0.35); s.start(now);
  }


  function assistantTone(panValue = 0.3) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const o = ctx.createOscillator(); const o2 = ctx.createOscillator();
    const g = ctx.createGain(); const g2 = ctx.createGain();
    o.type = "sine"; o2.type = "sine";
    o.frequency.setValueAtTime(742, now); o.frequency.exponentialRampToValueAtTime(812, now + 0.18);
    o2.frequency.setValueAtTime(1114, now); o2.frequency.exponentialRampToValueAtTime(1042, now + 0.18);
    g.gain.setValueAtTime(0.0001, now); g.gain.exponentialRampToValueAtTime(0.0055, now + 0.018); g.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    g2.gain.setValueAtTime(0.0001, now); g2.gain.exponentialRampToValueAtTime(0.0024, now + 0.025); g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.31);
    const bus = ctx.createGain(); o.connect(g); o2.connect(g2); g.connect(bus); g2.connect(bus); panned(bus, panValue, 0.32, 0.72);
    o.start(now); o2.start(now); o.stop(now + 0.36); o2.stop(now + 0.34);
  }

  function fluorescentFlicker(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const when = now + i * (0.055 + Math.random() * 0.035);
      const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.025), ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let j=0;j<d.length;j++) d[j]=(Math.random()*2-1)*Math.pow(1-j/d.length,9);
      const src=ctx.createBufferSource(), bp=ctx.createBiquadFilter(), g=ctx.createGain();
      src.buffer=b; bp.type="bandpass"; bp.frequency.value=1700+i*330; bp.Q.value=2.7; g.gain.value=0.010;
      src.connect(bp); bp.connect(g); panned(g,panValue,0.16,0.75); src.start(when);
    }
    const hum=ctx.createOscillator(), hg=ctx.createGain();
    hum.type="sine"; hum.frequency.value=119.8;
    hg.gain.setValueAtTime(0.0001,now+.11); hg.gain.exponentialRampToValueAtTime(0.0042,now+.19); hg.gain.exponentialRampToValueAtTime(0.0001,now+1.4);
    hum.connect(hg); panned(hg,panValue,0.25,0.55); hum.start(now+.11); hum.stop(now+1.45);
  }

  function transformerShift(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime, bus=ctx.createGain(), g=ctx.createGain();
    [29.8,59.6,119.2].forEach((f,i)=>{ const o=ctx.createOscillator(), og=ctx.createGain(); o.type=i===0?"sine":"triangle"; o.frequency.setValueAtTime(f,now); o.frequency.linearRampToValueAtTime(f*(1.008+Math.random()*.008),now+2.6); og.gain.value=[1,.34,.08][i]; o.connect(og); og.connect(bus); o.start(now); o.stop(now+2.7); });
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.010,now+.65); g.gain.exponentialRampToValueAtTime(0.0001,now+2.65); bus.connect(g); panned(g,panValue,0.38,0.72);
  }

  function airDuct(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime, src=ctx.createBufferSource(), bp=ctx.createBiquadFilter(), g=ctx.createGain();
    src.buffer=noiseBuffer(3.2,"pink"); bp.type="bandpass"; bp.frequency.setValueAtTime(260,now); bp.frequency.linearRampToValueAtTime(430+Math.random()*180,now+1.7); bp.Q.value=.55;
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.015,now+.8); g.gain.exponentialRampToValueAtTime(0.0001,now+3.1);
    src.connect(bp); bp.connect(g); panned(g,panValue,0.82,0.25); src.start(now); src.stop(now+3.2);
  }

  function distantStep(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const count=2+Math.floor(Math.random()*3);
    for(let i=0;i<count;i++){
      const when=now+i*(.54+Math.random()*.22), o=ctx.createOscillator(), g=ctx.createGain();
      o.type="sine"; o.frequency.setValueAtTime(76+Math.random()*22,when); o.frequency.exponentialRampToValueAtTime(31+Math.random()*8,when+.22);
      g.gain.setValueAtTime(0.0001,when); g.gain.exponentialRampToValueAtTime(0.013,when+.015); g.gain.exponentialRampToValueAtTime(0.0001,when+.38);
      o.connect(g); panned(g,Math.max(-1,Math.min(1,panValue+i*.04)),.92,.10); o.start(when); o.stop(when+.4);
    }
  }

  function dataSweep(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain(), bp=ctx.createBiquadFilter();
    o.type="sine"; o.frequency.setValueAtTime(1450,now); o.frequency.exponentialRampToValueAtTime(470,now+.72); bp.type="bandpass"; bp.frequency.value=1050; bp.Q.value=1.8;
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.0075,now+.025); g.gain.exponentialRampToValueAtTime(0.0001,now+.82);
    o.connect(bp); bp.connect(g); panned(g,panValue,.35,.68); o.start(now); o.stop(now+.84);
  }

  function incomingSignal(panValue = -0.2) {
    if (!ctx) return;
    const now=ctx.currentTime;
    [0,.16,.34].forEach((offset,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain(); o.type=i===2?"triangle":"sine"; o.frequency.value=[880,1174,740][i];
      g.gain.setValueAtTime(0.0001,now+offset); g.gain.exponentialRampToValueAtTime(0.007,now+offset+.015); g.gain.exponentialRampToValueAtTime(0.0001,now+offset+.12);
      o.connect(g); panned(g,panValue+i*.08,.24,.76); o.start(now+offset); o.stop(now+offset+.14);
    });
    window.setTimeout(()=>humanResidue(panValue+.1),520);
  }

  function storageTick(panValue = -0.2) {
    if (!ctx) return;
    storageSeek(panValue);
  }

  function doorActuator(panValue = 0.5) {
    if (!ctx) return;
    const now=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain(), bp=ctx.createBiquadFilter();
    o.type="sawtooth"; o.frequency.setValueAtTime(66,now); o.frequency.linearRampToValueAtTime(93,now+.72); o.frequency.linearRampToValueAtTime(58,now+1.25);
    bp.type="bandpass"; bp.frequency.value=420; bp.Q.value=1.4; g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.014,now+.14); g.gain.exponentialRampToValueAtTime(0.0001,now+1.35);
    o.connect(bp); bp.connect(g); panned(g,panValue,.55,.5); o.start(now); o.stop(now+1.38);
    window.setTimeout(()=>deadHardwareClick(panValue),1180);
  }

  function machineryShift(panValue = 0.25) {
    if (!ctx) return;
    const now=ctx.currentTime, bus=ctx.createGain(), g=ctx.createGain();
    [37,52,81].forEach((f,i)=>{ const o=ctx.createOscillator(),og=ctx.createGain(); o.type=i===0?"sine":"triangle"; o.frequency.setValueAtTime(f,now); o.frequency.linearRampToValueAtTime(f*(1.12+i*.03),now+2.2); og.gain.value=[1,.38,.16][i]; o.connect(og); og.connect(bus); o.start(now); o.stop(now+2.45); });
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.014,now+.55); g.gain.exponentialRampToValueAtTime(0.0001,now+2.4); bus.connect(g); panned(g,panValue,.48,.7);
  }

  function pressureValve(panValue = -0.45) {
    pressureRelease(panValue);
    window.setTimeout(()=>deadHardwareClick(panValue+.08),420);
  }

  function lowRoomKnock(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime, o=ctx.createOscillator(), g=ctx.createGain();
    o.type="sine"; o.frequency.setValueAtTime(58,now); o.frequency.exponentialRampToValueAtTime(24,now+.82);
    g.gain.setValueAtTime(0.0001,now); g.gain.exponentialRampToValueAtTime(0.020,now+.012); g.gain.exponentialRampToValueAtTime(0.0001,now+1.25);
    o.connect(g); panned(g,panValue,.92,.16); o.start(now); o.stop(now+1.3);
  }

  function routeReveal(panValue = 0) {
    if (!ctx) return;
    relayClick(0.012);
    const now=ctx.currentTime+.08;
    [523.25,659.25].forEach((f,i)=>{ const o=ctx.createOscillator(),g=ctx.createGain(); o.type="sine"; o.frequency.value=f; g.gain.setValueAtTime(0.0001,now+i*.07); g.gain.exponentialRampToValueAtTime(0.0048,now+i*.07+.018); g.gain.exponentialRampToValueAtTime(0.0001,now+i*.07+.28); o.connect(g); panned(g,panValue+i*.08,.34,.7); o.start(now+i*.07); o.stop(now+i*.07+.3); });
  }


  function attentionCue(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    [740, 493.88].forEach((f, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      const t = now + i * .11;
      g.gain.setValueAtTime(.0001, t);
      g.gain.exponentialRampToValueAtTime(.0055, t + .018);
      g.gain.exponentialRampToValueAtTime(.0001, t + .38);
      o.connect(g); panned(g, panValue, .42, .62); o.start(t); o.stop(t + .4);
    });
  }

  function presencePass(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createStereoPanner();
    src.buffer = noiseBuffer(3.6, "brown");
    bp.type = "bandpass"; bp.frequency.setValueAtTime(145, now); bp.frequency.exponentialRampToValueAtTime(520, now + 1.8); bp.frequency.exponentialRampToValueAtTime(115, now + 3.4); bp.Q.value = .65;
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.018, now + .85); g.gain.exponentialRampToValueAtTime(.0001, now + 3.5);
    p.pan.setValueAtTime(Math.max(-1, panValue - .35), now); p.pan.linearRampToValueAtTime(Math.min(1, panValue + .35), now + 3.3);
    src.connect(bp); bp.connect(g); g.connect(p); spatial(p, .86, .18); src.start(now); src.stop(now + 3.6);
    const sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.type = "sine"; sub.frequency.setValueAtTime(43, now); sub.frequency.linearRampToValueAtTime(36, now + 3.2);
    sg.gain.setValueAtTime(.0001, now); sg.gain.exponentialRampToValueAtTime(.009, now + .7); sg.gain.exponentialRampToValueAtTime(.0001, now + 3.3);
    sub.connect(sg); panned(sg, panValue, .72, .24); sub.start(now); sub.stop(now + 3.4);
  }

  function screenRupture(level = .35) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource(), hp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuffer(.48, "white"); hp.type = "highpass"; hp.frequency.value = 1250;
    const peak = Math.max(.006, Math.min(.03, .012 + level * .018));
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(peak, now + .008); g.gain.exponentialRampToValueAtTime(.0001, now + .22);
    src.connect(hp); hp.connect(g); spatial(g, .16, .84); src.start(now); src.stop(now + .25);
    const sub = ctx.createOscillator(), sg = ctx.createGain();
    sub.type = "sine"; sub.frequency.setValueAtTime(52, now); sub.frequency.exponentialRampToValueAtTime(24, now + .5);
    sg.gain.setValueAtTime(.0001, now); sg.gain.exponentialRampToValueAtTime(.014 + level * .012, now + .018); sg.gain.exponentialRampToValueAtTime(.0001, now + .62);
    sub.connect(sg); spatial(sg, .72, .18); sub.start(now); sub.stop(now + .65);
  }


  function hrtfPass(x1 = -2, z1 = -5, x2 = 2, z2 = -3) {
    if (!ctx) return;
    const now = ctx.currentTime;
    const src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(), p = ctx.createPanner();
    src.buffer = noiseBuffer(4.2, "brown");
    bp.type = "bandpass"; bp.frequency.setValueAtTime(120, now); bp.frequency.exponentialRampToValueAtTime(440, now + 2.1); bp.Q.value = .7;
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.018, now + .7); g.gain.exponentialRampToValueAtTime(.0001, now + 4.0);
    p.panningModel = "HRTF"; p.distanceModel = "inverse"; p.refDistance = 1; p.maxDistance = 20; p.rolloffFactor = 1.4;
    p.positionX.setValueAtTime(x1, now); p.positionY.setValueAtTime(0, now); p.positionZ.setValueAtTime(z1, now);
    p.positionX.linearRampToValueAtTime(x2, now + 3.7); p.positionZ.linearRampToValueAtTime(z2, now + 3.7);
    src.connect(bp); bp.connect(g); g.connect(p); spatial(p, .72, .24); src.start(now); src.stop(now + 4.1);
  }

  function ductBreath(panValue = 0.35) {
    if (!ctx) return;
    const now = ctx.currentTime, src = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = noiseBuffer(3.3, "pink");
    bp.type = "bandpass"; bp.frequency.setValueAtTime(620, now); bp.frequency.linearRampToValueAtTime(980, now + 1.15); bp.frequency.linearRampToValueAtTime(420, now + 2.9); bp.Q.value = 1.35;
    g.gain.setValueAtTime(.0001, now); g.gain.exponentialRampToValueAtTime(.014, now + .65); g.gain.setValueAtTime(.014, now + 1.5); g.gain.exponentialRampToValueAtTime(.0001, now + 3.05);
    src.connect(bp); bp.connect(g); panned(g, panValue, .96, .08); src.start(now); src.stop(now + 3.1);
  }

  function radioBreak(panValue = 0) {
    if (!ctx) return;
    const now = ctx.currentTime;
    [0,.12,.33,.58].forEach((off,i)=>{
      const src=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), g=ctx.createGain();
      src.buffer=noiseBuffer(.18,"white"); hp.type="highpass"; hp.frequency.value=1800+i*240;
      g.gain.setValueAtTime(.0001,now+off); g.gain.exponentialRampToValueAtTime(.010,now+off+.008); g.gain.exponentialRampToValueAtTime(.0001,now+off+.13);
      src.connect(hp); hp.connect(g); panned(g,panValue+(i%2?.12:-.12),.18,.82); src.start(now+off); src.stop(now+off+.15);
    });
  }

  function reverseServo(panValue = .7) {
    if (!ctx) return;
    const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),bp=ctx.createBiquadFilter();
    o.type="sawtooth"; o.frequency.setValueAtTime(132,now); o.frequency.exponentialRampToValueAtTime(54,now+1.6);
    bp.type="bandpass";bp.frequency.setValueAtTime(980,now);bp.frequency.exponentialRampToValueAtTime(240,now+1.6);bp.Q.value=2.1;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.012,now+.18);g.gain.exponentialRampToValueAtTime(.0001,now+1.72);
    o.connect(bp);bp.connect(g);panned(g,panValue,.42,.64);o.start(now);o.stop(now+1.75);
    window.setTimeout(()=>deadHardwareClick(panValue),1550);
  }

  function duckWorld(duration = 2800, depth = .11) {
    if (!ctx || !master) return;
    const now=ctx.currentTime, down=Math.max(.035,Math.min(.28,depth));
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(Math.max(.0001,master.gain.value),now);
    master.gain.exponentialRampToValueAtTime(down,now+.36);
    master.gain.setValueAtTime(down,now+Math.max(.5,duration/1000-.55));
    master.gain.exponentialRampToValueAtTime(.7,now+duration/1000);
  }


  function carrierScream(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const o=ctx.createOscillator(), o2=ctx.createOscillator(), g=ctx.createGain(), bp=ctx.createBiquadFilter();
    o.type="sawtooth"; o2.type="square";
    o.frequency.setValueAtTime(1180,now); o.frequency.exponentialRampToValueAtTime(3920,now+.46); o.frequency.exponentialRampToValueAtTime(760,now+1.55);
    o2.frequency.setValueAtTime(61,now); o2.frequency.linearRampToValueAtTime(83,now+1.5);
    bp.type="bandpass"; bp.frequency.setValueAtTime(2400,now); bp.Q.value=5.2;
    g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.009,now+.08); g.gain.exponentialRampToValueAtTime(.0035,now+.65); g.gain.exponentialRampToValueAtTime(.0001,now+1.7);
    const g2=ctx.createGain(); g2.gain.value=.0024;
    o.connect(bp);bp.connect(g);o2.connect(g2);g2.connect(g);panned(g,panValue,.32,.72);o.start(now);o2.start(now);o.stop(now+1.75);o2.stop(now+1.75);
  }

  function electricalThreat(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const src=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), g=ctx.createGain();
    src.buffer=noiseBuffer(2.4,"white"); hp.type="highpass"; hp.frequency.setValueAtTime(3200,now); hp.frequency.linearRampToValueAtTime(900,now+2.1);
    g.gain.setValueAtTime(.0001,now); g.gain.exponentialRampToValueAtTime(.0048,now+.3); g.gain.exponentialRampToValueAtTime(.0001,now+2.25);
    src.connect(hp);hp.connect(g);panned(g,panValue,.5,.48);src.start(now);src.stop(now+2.3);
    [31,46,92].forEach((f,i)=>{const o=ctx.createOscillator(),og=ctx.createGain();o.type=i===2?"triangle":"sine";o.frequency.value=f;og.gain.setValueAtTime(.0001,now);og.gain.exponentialRampToValueAtTime(.005/(i+1),now+.45);og.gain.exponentialRampToValueAtTime(.0001,now+2.1);o.connect(og);panned(og,panValue,.22,.7);o.start(now);o.stop(now+2.2)});
  }

  function weatherRain() {
    if (!ctx) return;
    const bus = layers?.building;
    if (!bus || layers?.v14Rain) return;
    const src=ctx.createBufferSource(), hp=ctx.createBiquadFilter(), lp=ctx.createBiquadFilter(), g=ctx.createGain();
    src.buffer=noiseBuffer(10,"pink");src.loop=true;hp.type="highpass";hp.frequency.value=1200;lp.type="lowpass";lp.frequency.value=6400;g.gain.value=.012;
    src.connect(hp);hp.connect(lp);lp.connect(g);g.connect(bus);src.start();layers.v14Rain={source:src,gain:g};
  }

  function watchdogAlarm(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    [0,.28,.56].forEach((off,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type="square";o.frequency.value=i===1?710:630;g.gain.setValueAtTime(.0001,now+off);g.gain.exponentialRampToValueAtTime(.0048,now+off+.01);g.gain.exponentialRampToValueAtTime(.0001,now+off+.16);o.connect(g);panned(g,panValue,.18,.85);o.start(now+off);o.stop(now+off+.18)});
  }


  function dataScream(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
    o.type="sawtooth";o2.type="triangle";o.frequency.setValueAtTime(420,now);o.frequency.exponentialRampToValueAtTime(5300,now+.78);o.frequency.exponentialRampToValueAtTime(880,now+1.8);o2.frequency.setValueAtTime(37,now);o2.frequency.linearRampToValueAtTime(71,now+1.8);
    f.type="bandpass";f.frequency.setValueAtTime(1100,now);f.frequency.exponentialRampToValueAtTime(3600,now+.8);f.Q.value=6.5;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.012,now+.06);g.gain.exponentialRampToValueAtTime(.004,now+.72);g.gain.exponentialRampToValueAtTime(.0001,now+1.9);
    const g2=ctx.createGain();g2.gain.value=.0027;o.connect(f);f.connect(g);o2.connect(g2);g2.connect(g);panned(g,panValue,.3,.78);o.start(now);o2.start(now);o.stop(now+1.95);o2.stop(now+1.95);
  }

  function relayStorm(panValue = 0) {
    if (!ctx) return;
    const count=7;for(let i=0;i<count;i++){const delay=i*.11+Math.random()*.06;window.setTimeout(()=>{relayClick(.014+Math.random()*.006);if(i===3)deadHardwareClick(panValue)},delay*1000)}
  }

  function subImpact(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();
    o.type="sine";o.frequency.setValueAtTime(58,now);o.frequency.exponentialRampToValueAtTime(19,now+2.4);lp.type="lowpass";lp.frequency.value=120;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.035,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+2.45);o.connect(lp);lp.connect(g);panned(g,panValue,.65,.62);o.start(now);o.stop(now+2.5);
  }

  function ventCrawl(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime,src=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),g=ctx.createGain(),lfo=ctx.createOscillator(),lg=ctx.createGain();
    src.buffer=noiseBuffer(5.4,"pink");bp.type="bandpass";bp.frequency.value=310;bp.Q.value=1.8;lfo.frequency.value=.43;lg.gain.value=130;lfo.connect(lg);lg.connect(bp.frequency);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.016,now+.7);g.gain.exponentialRampToValueAtTime(.006,now+3.7);g.gain.exponentialRampToValueAtTime(.0001,now+5.2);src.connect(bp);bp.connect(g);panned(g,panValue,1.0,.18);src.start(now);lfo.start(now);src.stop(now+5.25);lfo.stop(now+5.25);
  }

  function metalGroan(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    [71,109,163].forEach((freq,i)=>{const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type=i===2?"sawtooth":"triangle";o.frequency.setValueAtTime(freq,now);o.frequency.linearRampToValueAtTime(freq*(i===0?.78:1.18),now+3.3);f.type="lowpass";f.frequency.value=520+i*220;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.005/(i+1),now+.35+i*.15);g.gain.exponentialRampToValueAtTime(.0001,now+3.45);o.connect(f);f.connect(g);panned(g,panValue,.85,.28);o.start(now);o.stop(now+3.5)})
  }

  function proximityHowl(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type="sine";o.frequency.setValueAtTime(212,now);o.frequency.linearRampToValueAtTime(227,now+2.5);o.frequency.linearRampToValueAtTime(203,now+5.1);f.type="bandpass";f.frequency.value=650;f.Q.value=1.2;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.008,now+.9);g.gain.setValueAtTime(.008,now+3.8);g.gain.exponentialRampToValueAtTime(.0001,now+5.2);o.connect(f);f.connect(g);panned(g,panValue,1.1,.17);o.start(now);o.stop(now+5.25);
  }


  
  function neuralCarrier(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const o=ctx.createOscillator(),o2=ctx.createOscillator(),g=ctx.createGain(),bp=ctx.createBiquadFilter();
    o.type="sawtooth";o.frequency.setValueAtTime(1850,now);o.frequency.exponentialRampToValueAtTime(410,now+2.4);
    o2.type="sine";o2.frequency.value=37;bp.type="bandpass";bp.frequency.setValueAtTime(2800,now);bp.frequency.exponentialRampToValueAtTime(760,now+2.3);bp.Q.value=9;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.009,now+.08);g.gain.linearRampToValueAtTime(.0045,now+1.7);g.gain.exponentialRampToValueAtTime(.0001,now+2.5);
    const g2=ctx.createGain();g2.gain.value=.0018;o.connect(bp);bp.connect(g);o2.connect(g2);g2.connect(g);panned(g,panValue,.38,.72);o.start(now);o2.start(now);o.stop(now+2.6);o2.stop(now+2.6);
  }

  function powerCollapse(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const o=ctx.createOscillator(),g=ctx.createGain(),n=ctx.createBufferSource(),f=ctx.createBiquadFilter(),ng=ctx.createGain();
    o.type="sine";o.frequency.setValueAtTime(61,now);o.frequency.exponentialRampToValueAtTime(21,now+2.7);
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.028,now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+2.8);
    n.buffer=noiseBuffer(2.8,"brown");f.type="lowpass";f.frequency.setValueAtTime(820,now);f.frequency.exponentialRampToValueAtTime(85,now+2.4);ng.gain.setValueAtTime(.012,now);ng.gain.exponentialRampToValueAtTime(.0001,now+2.7);
    o.connect(g);n.connect(f);f.connect(ng);panned(g,panValue,.8,.55);panned(ng,panValue,.9,.25);o.start(now);n.start(now);o.stop(now+2.9);n.stop(now+2.9);
  }

  function speakerTear(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime,b=ctx.createBuffer(1,Math.floor(ctx.sampleRate*1.45),ctx.sampleRate),d=b.getChannelData(0);
    let hold=0,v=0;for(let i=0;i<d.length;i++){if(hold<=0){v=(Math.random()*2-1)*(Math.random()>.72?1:.22);hold=Math.floor(rand(2,40));}d[i]=v*Math.pow(1-i/d.length,.35);hold--;}
    const s=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),g=ctx.createGain();s.buffer=b;bp.type="bandpass";bp.frequency.setValueAtTime(4800,now);bp.frequency.exponentialRampToValueAtTime(740,now+1.25);bp.Q.value=5.5;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.0105,now+.018);g.gain.exponentialRampToValueAtTime(.0001,now+1.4);s.connect(bp);bp.connect(g);panned(g,panValue,.22,.86);s.start(now);
  }

  function heartbeatCarrier(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    [0,.43,1.18,1.61].forEach((off,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain(),lp=ctx.createBiquadFilter();o.type="sine";o.frequency.setValueAtTime(i%2?46:53,now+off);o.frequency.exponentialRampToValueAtTime(24,now+off+.42);lp.type="lowpass";lp.frequency.value=115;
      g.gain.setValueAtTime(.0001,now+off);g.gain.exponentialRampToValueAtTime(.026,now+off+.016);g.gain.exponentialRampToValueAtTime(.0001,now+off+.48);o.connect(lp);lp.connect(g);panned(g,panValue,.68,.58);o.start(now+off);o.stop(now+off+.5);
    });
  }

  function hardDriveChoke(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    for(let i=0;i<9;i++){
      const off=i*.095+Math.random()*.035,o=ctx.createOscillator(),g=ctx.createGain();o.type=i%3===0?"square":"triangle";o.frequency.value=420+Math.random()*1600;g.gain.setValueAtTime(.0001,now+off);g.gain.exponentialRampToValueAtTime(.0038,now+off+.008);g.gain.exponentialRampToValueAtTime(.0001,now+off+.06);o.connect(g);panned(g,panValue,.3,.82);o.start(now+off);o.stop(now+off+.07);
    }
    window.setTimeout(()=>storageWake?.(panValue),980);
  }

  function industrialPanic(panValue = 0) {
    if (!ctx) return;
    relayStorm(panValue);watchdogAlarm(-panValue);
    const now=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();o.type="sawtooth";o.frequency.setValueAtTime(96,now);o.frequency.exponentialRampToValueAtTime(29,now+4.1);f.type="lowpass";f.frequency.value=460;g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.014,now+.15);g.gain.linearRampToValueAtTime(.008,now+2.8);g.gain.exponentialRampToValueAtTime(.0001,now+4.2);o.connect(f);f.connect(g);panned(g,panValue,1.0,.24);o.start(now);o.stop(now+4.3);
  }

  function silenceDrop(ms = 3000) {
    if (!ctx) return;
    const names=["building","electrical","server","machinery"];
    names.forEach(n=>fadeBus(n,.0001,.18));
    window.setTimeout(()=>activateForPage?.(document.body?.dataset?.page||"index"),Math.max(300,ms));
  }


  function faintCarrier(panValue = 0) {
    if (!ctx) return;
    const now=ctx.currentTime;
    const o=ctx.createOscillator(),g=ctx.createGain(),f=ctx.createBiquadFilter();
    o.type="sine";o.frequency.setValueAtTime(1320+Math.random()*420,now);o.frequency.linearRampToValueAtTime(1180+Math.random()*180,now+2.6);
    f.type="bandpass";f.frequency.value=1700;f.Q.value=8;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.0024,now+.3);g.gain.linearRampToValueAtTime(.0012,now+1.8);g.gain.exponentialRampToValueAtTime(.0001,now+2.8);
    o.connect(f);f.connect(g);panned(g,panValue,.65,.28);o.start(now);o.stop(now+2.9);
  }

  function tabWhisper(panValue = 0, intensity = 1) {
    if (!ctx) return;
    const now=ctx.currentTime,dur=2.8+Math.random()*1.6;
    const src=ctx.createBufferSource(),bp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),g=ctx.createGain();
    src.buffer=noiseBuffer(dur+.2,"pink");bp.type="bandpass";bp.frequency.setValueAtTime(2100,now);bp.frequency.linearRampToValueAtTime(1250,now+dur);bp.Q.value=4.8;lp.type="lowpass";lp.frequency.value=3600;
    g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.006*Math.max(.6,intensity),now+.55);g.gain.linearRampToValueAtTime(.0032*Math.max(.6,intensity),now+dur-.5);g.gain.exponentialRampToValueAtTime(.0001,now+dur);
    src.connect(bp);bp.connect(lp);lp.connect(g);panned(g,panValue,1.15,.06);src.start(now);src.stop(now+dur+.1);
    faintCarrier(-panValue*.7);
  }

  function corruptVoice(panValue = 0) {
    if (!ctx) return;
    speakerTear(panValue);
    const now=ctx.currentTime;
    [73,109,227].forEach((freq,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type=i===2?"square":"sine";o.frequency.setValueAtTime(freq,now);o.frequency.exponentialRampToValueAtTime(freq*(i===2?.82:.94),now+.9);g.gain.setValueAtTime(.0001,now);g.gain.exponentialRampToValueAtTime(.004/(i+1),now+.025);g.gain.exponentialRampToValueAtTime(.0001,now+1);o.connect(g);panned(g,panValue,.5,.45);o.start(now);o.stop(now+1.05);});
  }

  NS.Audio = {
    start,
    resume,
    stop,
    transition,
    uiChirp,
    relayClick,
    motorWake,
    bootTick,
    subsystemHover,
    networkPacket,
    airShift,
    humanResidue,
    impossiblePulse,
    storageWake,
    storageSeek,
    servoSweep,
    pressureRelease,
    pumpCycle,
    deadHardwareClick,
    assistantTone,
    fluorescentFlicker,
    transformerShift,
    airDuct,
    distantStep,
    dataSweep,
    incomingSignal,
    storageTick,
    doorActuator,
    machineryShift,
    pressureValve,
    lowRoomKnock,
    routeReveal,
    attentionCue,
    presencePass,
    screenRupture,
    hrtfPass,
    ductBreath,
    radioBreak,
    reverseServo,
    duckWorld,
    carrierScream,
    electricalThreat,
    weatherRain,
    watchdogAlarm,
    dataScream,
    relayStorm,
    subImpact,
    ventCrawl,
    metalGroan,
    proximityHowl,
    neuralCarrier,
    powerCollapse,
    speakerTear,
    heartbeatCarrier,
    hardDriveChoke,
    industrialPanic,
    silenceDrop,
    faintCarrier,
    tabWhisper,
    corruptVoice,
    fadeBus,
    activateForPage,
    get started() { return started; }
  };
})();

