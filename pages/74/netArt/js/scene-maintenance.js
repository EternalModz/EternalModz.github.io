(() => {
  const NS=window.IAG=window.IAG||{}; const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  let current="cooling07", anomalyRunning=false;
  const mem=()=>NS.State?.persistent?.sceneMemory?.maintenance;
  const jobs={
    cooling07:{title:"COOLING LOOP 07",state:"running",power:"online",controller:"online",motor:"active",flow:"11.7 L/min",core:"PUMP<br>ACTIVE",seq:["relay energized","controller handshake","motor start","flow stable"]},
    relay12:{title:"GRID RELAY 12",state:"queued",power:"online",controller:"standby",motor:"n/a",flow:"n/a",core:"RELAY<br>STANDBY",seq:["diagnostic request","contact isolation","coil test","report"]},
    archive03:{title:"STORAGE ARRAY 03",state:"queued",power:"online",controller:"online",motor:"idle",flow:"n/a",core:"ARRAY<br>IDLE",seq:["storage quiesce","head park","integrity check","resume"]},
    camera18:{title:"CAM 18 ACTUATOR",state:"unavailable",power:"offline",controller:"removed",motor:"removed",flow:"n/a",core:"NO<br>HARDWARE",seq:["grid power unavailable","controller absent","motor absent","service impossible"]},
    vent22:{title:"VENT ZONE 22",state:"queued",power:"online",controller:"online",motor:"standby",flow:"0.0 L/min",core:"VENT<br>STANDBY",seq:["relay standby","damper check","fan start","pressure balance"]}
  };
  function clock(){const e=$("[data-scene-clock]");if(e)e.textContent=new Date().toLocaleTimeString([], {hour12:false});}
  function sequence(items, impossible=false){const root=$("[data-sequence-list]");root.innerHTML=items.map((x,i)=>`<div class="sequence-step ${impossible&&i<3?'impossible-step':'done'}"><i></i><span>${x}</span><b>0${i+1}</b></div>`).join(""); $("[data-sequence-state]").textContent=impossible?"causal fault":"nominal";}
  function select(id){ if(id==="occupancy"){
    NS.Events?.add("MAINT","JOB 889104 OPEN REQUEST");
    NS.State?.remember("maintenance","preserveOccupancySeen",true);
    NS.State?.completeTask?.("maintenance");
    NS.State?.addLore?.("continuity-preserve-occupancy");
    NS.Assistant?.say("Please don't open that.",5000);
    $("[data-maint-observation]").textContent="Directive C-05 / PRESERVE OCCUPANCY / author: SYSTEM";
    window.IAG?.V12?.release?.();
    return;
  } const j=jobs[id]; if(!j)return; current=id; $$("[data-job]").forEach(b=>b.classList.toggle("active",b.dataset.job===id)); $("[data-machine-title]").textContent=j.title; $("[data-machine-state]").textContent=j.state; $("[data-machine-power]").textContent=j.power; $("[data-machine-controller]").textContent=j.controller; $("[data-machine-motor]").textContent=j.motor; $("[data-machine-flow]").textContent=j.flow; $("[data-machine-core]").innerHTML=j.core; sequence(j.seq,id==="camera18"&&mem()?.impossibleCycleSeen); NS.State?.rememberUnique("maintenance","inspected",id); NS.State?.touchInteraction(`maintenance job ${id}`); if(id==="cooling07")NS.Audio?.pumpCycle(.15,false); if(id==="archive03")NS.Audio?.storageWake(-.3); if(id==="vent22")NS.Audio?.pressureRelease(-.5); if(id==="camera18"&&!anomalyRunning)setTimeout(runImpossibleCycle,1800); }
  function runImpossibleCycle(){ anomalyRunning=true; if(mem()?.impossibleCycleSeen){renderImpossible();return;} NS.Events?.add("MAINT","CAM-18 SERVICE CHECK / HARDWARE ABSENT"); NS.Audio?.deadHardwareClick(.65); setTimeout(()=>NS.Audio?.servoSweep(.68,true),800); setTimeout(()=>{NS.Audio?.pumpCycle(.2,true);renderImpossible(); NS.State?.remember("maintenance","impossibleCycleSeen",true); NS.State?.markAnomaly("maintenance-causality"); NS.Events?.add("MAINT","CAM-18 ACTUATOR CYCLE COMPLETE / POWER 0 W"); NS.Assistant?.setState("concerned"); NS.Assistant?.say("I don't know.",3800);},2300); setTimeout(()=>{NS.Assistant?.say("That process should not be running.",4800); $("[data-maint-observation]").textContent="No valid cause exists for the completed actuator cycle.";},7200); setTimeout(showOccupancyJob,8200); }
  function renderImpossible(){ $("[data-machine-state]").textContent="cycle complete"; $("[data-machine-power]").textContent="offline / 0 W"; $("[data-machine-controller]").textContent="removed"; $("[data-machine-motor]").textContent="removed"; $("[data-machine-flow]").textContent="n/a"; $("[data-machine-core]").innerHTML="CYCLE<br>COMPLETE"; sequence(["relay not energized","controller absent","motor absent","movement recorded"],true); $("[data-camera-job-state]").textContent="completed"; }
  function showOccupancyJob(){ if(NS.State?.persistent?.tasks?.maintenance)return; const row=$("[data-job='occupancy']"); if(!row)return; row.hidden=false; NS.Events?.add("MAINT","JOB 889104 INDEXED"); setTimeout(()=>{NS.Assistant?.say("Please don't open that.",5000); $("[data-maint-observation]").textContent="That job is not present in the maintenance scheduler.";},1800); window.IAG?.V12?.attend?.('[data-job="occupancy"]', "NEW JOB / NO AUTHOR", 12000); }
  function init(){
    clock(); setInterval(clock,1000);
    $$('[data-job]').forEach(b=>b.addEventListener("click",()=>select(b.dataset.job)));
    if(NS.State?.persistent?.sceneMemory?.cameras?.camera18Moved){
      $("[data-camera-job-state]").textContent="fault / activity recorded";
      $("[data-maint-observation]").textContent="Camera 18 reported actuator activity despite its hardware record.";
      setTimeout(()=>NS.Assistant?.say("I checked the service history.",3800),3000);
    }
    const source = new URLSearchParams(location.search).get("source");
    if(source === "cam18" || source === "removed") setTimeout(()=>select("camera18"),1800);
    setTimeout(()=>{ if(current==="cooling07")NS.Audio?.pumpCycle(.15,false); },7000);
    if(mem()?.impossibleCycleSeen)renderImpossible();
    if(mem()?.preserveOccupancySeen){const row=$("[data-job='occupancy']");row.hidden=false; setTimeout(()=>row.hidden=true,5000);}
  }

  window.addEventListener("iag:system-started",init,{once:true});
})();
