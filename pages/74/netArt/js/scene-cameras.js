(() => {
  const NS=window.IAG=window.IAG||{};
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let selected="04", pan=0, anomalyStarted=false;
  const normal={
    "04":{power:"23.8 V",board:"online",network:"connected",note:"Endpoint responding within expected parameters."},
    "07":{power:"24.0 V",board:"online",network:"connected",note:"Lift camera calibrated 18 minutes ago."},
    "22":{power:"21.4 V",board:"degraded",network:"connected",note:"Packet loss 2.8%. Optics remain responsive."},
    "31":{power:"0.00 V",board:"offline",network:"offline",note:"Endpoint unavailable. Archive frames only."},
    "42":{power:"23.7 V",board:"online",network:"connected",note:"Cooling-bay endpoint nominal."}
  };
  const mem=()=>NS.State?.persistent?.sceneMemory?.cameras;
  function clock(){const e=$("[data-scene-clock]");if(e)e.textContent=new Date().toLocaleTimeString([], {hour12:false});}
  function render(cam){
    selected=cam; $$("[data-camera]").forEach(b=>b.classList.toggle("active",b.dataset.camera===cam));
    $("[data-camera-title]").textContent=`CAM ${cam}`;
    if(cam==="18"){
      $("[data-camera-state]").textContent="decommissioned"; $("[data-camera-power]").textContent="0.00 V"; $("[data-camera-board]").textContent="removed"; $("[data-camera-network]").textContent="offline"; $("[data-camera-pan]").textContent=mem()?.camera18Moved?"+22°":"+00°"; $("[data-camera-tracking]").textContent=mem()?.camera18Moved?"tracking":"unavailable"; $("[data-camera-note]").textContent="Last physical service: 22,491 days ago. No control hardware detected.";
      NS.Events?.add("CAM-18","DIAGNOSTICS REQUESTED");
      if(NS.State?.persistent?.sceneMemory?.archive?.cameraReferenceSeen) $("[data-camera-observation]").textContent="This is the endpoint referenced by the archive file.";
      if(!anomalyStarted) { anomalyStarted=true; setTimeout(runCamera18, 3800); }
    } else {
      const d=normal[cam]||normal["04"]; $("[data-camera-state]").textContent=d.network==="offline"?"offline":"online"; $("[data-camera-power]").textContent=d.power; $("[data-camera-board]").textContent=d.board; $("[data-camera-network]").textContent=d.network; $("[data-camera-pan]").textContent=`${pan>=0?"+":""}${String(pan).padStart(2,"0")}°`; $("[data-camera-tracking]").textContent="disabled"; $("[data-camera-note]").textContent=d.note;
    }
    NS.State?.rememberUnique("cameras","inspected",cam); NS.State?.touchInteraction(`camera ${cam}`);
  }
  function runCamera18(){
    if(mem()?.camera18Moved){ renderMoved(); return; }
    NS.Audio?.deadHardwareClick(0.72);
    setTimeout(()=>{
      document.body.classList.add("v14-cam-shift");
      NS.State?.remember("cameras","camera18Moved",true); NS.State?.markAnomaly("camera18-self-motion"); NS.State?.addLore?.("incident-18-feed-after-removal"); window.IAG?.V12?.attend?.('[data-camera="18"]', "IT MOVED", 6500); NS.Events?.add("CAM-18","FRAME DISPLACEMENT / +17 DEG / NO ACTUATOR COMMAND");
      renderMoved();
      NS.Assistant?.setState("uncertain");
      NS.Assistant?.say("Camera unavailable.",3500);
    }, 1200);
    setTimeout(()=>{
      NS.Audio?.reverseServo?.(0.72); NS.Events?.add("CAM-18","ACTUATOR SOUND RECEIVED AFTER FRAME MOVEMENT");
    }, 3400);
    setTimeout(()=>{
      document.body.classList.add("v14-cam-follow"); NS.Events?.add("CAM-18","TRACKING TARGET"); $("[data-cam18-status]").textContent="TRACKING"; $("[data-camera-tracking]").textContent="tracking"; $("[data-camera-pan]").textContent="+22°";
      $("[data-camera-observation]").textContent="There is no control board connected to Camera 18.";
      NS.Assistant?.say("There is no Camera 18.", 4300);
    }, 5600);
    setTimeout(viewerAnomaly, 9200);
  }
  function renderMoved(){
    const feed=$("[data-camera='18']"); feed?.classList.add("tracking"); $("[data-cam18-status]").textContent="TRACKING"; $("[data-camera-pan]").textContent="+22°"; $("[data-camera-tracking]").textContent="tracking";
  }
  function viewerAnomaly(){
    if(mem()?.viewerAnomalySeen) return;
    const e=$("[data-cam18-viewers]");
    NS.V14?.guide?.("Wait. The viewer count is recalculating.",{emotion:"afraid",behavior:"CAM 18 / observer attachment audit"});
    NS.V14?.enqueueSpeech?.("Wait. The viewer count is recalculating.",{emotion:"afraid"});
    NS.Audio?.faintCarrier?.(.55);
    setTimeout(()=>{
      e.textContent="VIEWERS 2";e.classList.add("viewer-anomaly");NS.Audio?.impossiblePulse(0.66);NS.Audio?.speakerTear?.(.5);NS.V14?.glitch?.(2);NS.Events?.add("CAM-18","OBSERVER COUNT +1");
      NS.State?.remember("cameras","viewerAnomalySeen",true);NS.State?.markAnomaly("camera18-viewers");
      setTimeout(()=>{NS.V14?.guide?.("That second viewer is not me.",{emotion:"panicked",behavior:"CAM 18 / second observer / source unavailable"});NS.V14?.enqueueSpeech?.("That second viewer is not me.",{emotion:"panicked",urgent:true});$("[data-camera-observation]").textContent="Second visual-session attachment has no process owner.";},900);
    },1500);
    setTimeout(()=>{e.textContent="VIEWERS 1";e.classList.remove("viewer-anomaly");},10500);
  }
  function panCamera(dir){
    if(selected==="18"){
      NS.Audio?.deadHardwareClick(0.72);
      NS.Events?.add("CONTROL","CAM-18 COMMAND REJECTED / CONTROL BOARD ABSENT");
      $("[data-camera-note]").textContent="Command rejected: no control board.";
      if (mem()?.camera18Moved) {
        NS.State?.completeTask?.("cameras");
        NS.State?.addLore?.("incident-18-control-absent");
        window.IAG?.V12?.release?.();
      }
      return;
    }
    pan=Math.max(-30,Math.min(30,pan+dir*8)); $("[data-camera-pan]").textContent=`${pan>=0?"+":""}${pan}°`; NS.Audio?.servoSweep(dir>0?.55:-.55,false); NS.Events?.add(`CAM-${selected}`,`PAN ${pan} DEG`);
  }
  function init(){
    clock(); setInterval(clock,1000);
    $$('[data-camera]').forEach(b=>b.addEventListener("click",()=>render(b.dataset.camera)));
    $$('[data-pan]').forEach(b=>b.addEventListener("click",()=>panCamera(Number(b.dataset.pan))));
    $('[data-center]')?.addEventListener("click",()=>{pan=0;panCamera(0);});
    const requested = new URLSearchParams(location.search).get("id");
    if(mem()?.camera18Moved) renderMoved();
    if(requested === "18") setTimeout(()=>render("18"), 1200);
    setTimeout(()=>{
      if(NS.State?.persistent?.sceneMemory?.archive?.cameraReferenceSeen && !(mem()?.inspected||[]).includes("18"))
        NS.Assistant?.say("The archive reference resolves to Camera 18.",4200);
    },4200);
  }

  window.addEventListener("iag:system-started",init,{once:true});
})();
