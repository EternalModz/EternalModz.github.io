(() => {
  const NS = window.IAG = window.IAG || {};
  const records = {
    summer: { title:"A-0142 / SUMMER_2048", owner:"dormant", created:"2048-07-18", modified:"2048-08-01", path:"ARRAY-03 / HOME / MEDIA", integrity:"99.2%", frame:"12 recovered images / coastal location / three recurring faces", copy:"The record contains ordinary vacation images and location traces. No active accounts are associated with the media." },
    birthday: { title:"A-2218 / BIRTHDAY_REMINDER", owner:"recipient unavailable", created:"2051-02-11", modified:"2096-02-11", path:"CALENDAR / RECURRING / 02218", integrity:"100%", frame:"annual reminder / still scheduled / no recipient", copy:"The reminder has executed every year since the recipient stopped responding. No service remains authorized to dismiss it." },
    school: { title:"A-4107 / COURSEWORK", owner:"dormant", created:"2055-09-03", modified:"2056-05-19", path:"EDU-CACHE / PERSONAL / 4107", integrity:"96.8%", frame:"38 revisions / unfinished final export / comments preserved", copy:"A mostly ordinary school document. The final revision was saved seventeen minutes before the associated account went inactive." },
    camera: { title:"A-1804 / INCIDENT_18", owner:"CONTINUITY FACILITY OPS", created:"2063-11-02", modified:"2063-11-11", path:"INCIDENTS / OPTICAL / CAM-18", integrity:"88.4%", frame:"CAM-18 / STORAGE CORRIDOR / PHYSICAL REMOVAL VERIFIED", copy:"Endpoint 18 was dismantled after repeated false occupancy events. Power, controller, and camera body were removed. Eleven days later the observation service continued accepting frames under the same identifier. Final operator instruction: DO NOT REPLACE CAMERA 18." },
    impossible: { title:"A-7719 / UNSORTED_MEDIA", owner:"unknown", created:"2062-04-19", modified:"2026-10-10", path:"REDUNDANCY-3 / ORPHAN / 7719", integrity:"100% x3", frame:"three identical copies / no originating account", copy:"All redundant copies contain the same impossible modification timestamp. No corruption is present in the checksum tree." }
  };
  let current = null;
  let anomalyTimer = null;

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const mem = () => NS.State?.persistent?.sceneMemory?.archive;

  function clock() { const el=$("[data-scene-clock]"); if(el) el.textContent=new Date().toLocaleTimeString([], {hour12:false}); }

  function renderViewed() {
    const opened = mem()?.opened || [];
    $$("[data-record]").forEach(b => b.classList.toggle("viewed", opened.includes(b.dataset.record)));
    if (mem()?.cameraReferenceSeen) $("[data-camera-route-copy]").textContent = "CAM-18 reference recovered / endpoint listed decommissioned";
  }

  function openRecord(id, {recommended=false}={}) {
    const r=records[id]; if(!r) return;
    current=id;
    $$("[data-record]").forEach(b=>b.classList.toggle("active", b.dataset.record===id));
    $("[data-record-title]").textContent=r.title;
    $("[data-record-state]").textContent="mounted";
    $("[data-record-owner]").textContent=r.owner;
    $("[data-record-created]").textContent=r.created;
    $("[data-record-modified]").textContent=r.modified;
    $("[data-record-path]").textContent=r.path;
    $("[data-record-integrity]").textContent=r.integrity;
    $("[data-memory-frame]").innerHTML=r.frame.replace(/ \/ /g,"<br>");
    $("[data-record-copy]").textContent=r.copy;
    NS.State?.rememberUnique("archive","opened",id);
    NS.State?.touchInteraction(`archive record ${id}`);
    NS.Events?.add("ARCHIVE", `${r.title} MOUNTED`);
    NS.Audio?.storageWake(id==="impossible" ? 0.35 : -0.28);
    if(id==="camera") {
      NS.State?.remember("archive","cameraReferenceSeen",true);
      NS.State?.completeTask?.("archive");
      NS.State?.addLore?.("incident-18-removal");
      window.IAG?.V12?.attend?.('[data-record="camera"]', "INCIDENT 18", 3200);
      $("[data-archive-observation]").textContent="That identifier still resolves to the observation network.";
      NS.Assistant?.say("Camera 18 still exists.", 3600);
      setTimeout(()=>NS.Assistant?.say("Correction: Camera 18 no longer exists.", 4300), 4300);
    }
    if(id==="impossible") {
      NS.State?.remember("archive","impossibleFileSeen",true);
      NS.State?.markAnomaly("archive-impossible-metadata");
      $("[data-record-modified]").classList.add("impossible");
      const pathField = $("[data-record-path]");
      if(pathField) pathField.innerHTML = `<a class="impossible-inline-link" href="missing.html?ref=A-7719&origin=redundancy-3">${r.path}</a>`;
      $("[data-archive-observation]").textContent="Metadata damaged.";
      NS.Assistant?.setState("reviewing");
      setTimeout(()=>NS.Assistant?.say("Metadata damaged.", 3600), 1200);
      setTimeout(()=>{
        $("[data-archive-observation]").textContent="All three copies agree. Metadata damaged.";
        NS.Events?.add("ARCHIVE","REDUNDANCY CHECK / 3 COPIES AGREE");
      }, 6200);
    } else if(!recommended) {
      $("[data-archive-observation]").textContent = id==="summer" ? "They visited this place frequently." : id==="birthday" ? "This reminder continued after there was nobody left to receive it." : "Record reconstructed successfully.";
    }
    renderViewed();
  }

  function recommend() {
    if(mem()?.recommended) return;
    const opened=mem()?.opened || [];
    const choice = !opened.includes("camera") ? "camera" : !opened.includes("impossible") ? "impossible" : "summer";
    NS.State?.remember("archive","recommended",choice);
    $("[data-recommend-copy]").textContent = records[choice].title + " / selected from current session context";
    NS.Assistant?.setState("curious");
    NS.Assistant?.say("I found something you may want to see.", 4300);
  }

  function init() {
    clock(); setInterval(clock,1000); renderViewed();
    $$("[data-record]").forEach(b=>b.addEventListener("click",()=>openRecord(b.dataset.record)));
    $("[data-archive-recommend]")?.addEventListener("click",()=>{ const id=mem()?.recommended || "camera"; openRecord(id,{recommended:true}); });
    const existing=mem()?.recommended; if(existing) $("[data-recommend-copy]").textContent = records[existing]?.title || existing;
    setTimeout(recommend, 5200);
    anomalyTimer=setTimeout(()=>{ if(!mem()?.impossibleFileSeen && current && Math.random()<0.8) { $("[data-recommend-copy]").textContent="A-7719 / UNSORTED_MEDIA / metadata inconsistency"; } }, 13500);
    if((mem()?.opened||[]).length>0) $("[data-archive-observation]").textContent="Your previous archive selections are still mounted in session history.";
  }

  window.addEventListener("iag:system-started", init, {once:true});
})();
