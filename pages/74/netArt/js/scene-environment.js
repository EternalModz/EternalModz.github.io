(() => {
  const NS = window.IAG = window.IAG || {};
  const $ = (s) => document.querySelector(s);
  const rand = (a,b) => a + Math.random() * (b-a);
  const timers = [];
  let temp = 17.2, pressure = 1016.4, humidity = 41, wind = 8.4, exchange = 62;

  function clock() {
    const el = $("[data-scene-clock]");
    const draw = () => { if (el) el.textContent = new Date().toLocaleTimeString([], { hour12:false }); };
    draw(); window.setInterval(draw, 1000);
  }

  function renderClimate() {
    const cached = NS.State?.persistent?.weather;
    if (cached?.summary && Date.now() - Number(cached.lastUpdated || 0) < 1800000) {
      const w = cached.summary;
      const tempEl=$("[data-env-temp]"), unit=$(".climate-temp span");
      if(tempEl) tempEl.textContent = Number(w.temperature || 0).toFixed(0);
      if(unit) unit.textContent = "F";
      $("[data-env-pressure]") && ($("[data-env-pressure]").textContent = `${Math.round(w.pressure || 0)} hPa`);
      $("[data-env-humidity]") && ($("[data-env-humidity]").textContent = `${Math.round(w.humidity || 0)}%`);
      $("[data-env-wind]") && ($("[data-env-wind]").textContent = `${Math.round(w.wind || 0)} mph`);
      exchange = Math.max(58, Math.min(66, exchange + rand(-.18,.18)));
      $("[data-air-exchange]") && ($("[data-air-exchange]").textContent = `${Math.round(exchange)}%`);
      return;
    }
    temp += rand(-.04,.04); pressure += rand(-.03,.03); humidity = Math.max(38, Math.min(46, humidity + rand(-.08,.08))); wind = Math.max(4, Math.min(14, wind + rand(-.15,.15))); exchange = Math.max(58, Math.min(66, exchange + rand(-.18,.18)));
    $("[data-env-temp]").textContent = temp.toFixed(1);
    $("[data-env-pressure]").textContent = `${pressure.toFixed(1)} hPa`;
    $("[data-env-humidity]").textContent = `${Math.round(humidity)}%`;
    $("[data-env-wind]").textContent = `${wind.toFixed(1)} km/h`;
    $("[data-air-exchange]").textContent = `${Math.round(exchange)}%`;
  }

  function addEvent(source, message, value="") {
    const root = $("[data-environment-feed]");
    if (!root) return;
    const time = new Date().toLocaleTimeString([], {hour12:false,hour:"2-digit",minute:"2-digit",second:"2-digit"});
    const p = document.createElement("p");
    p.innerHTML = `<time>${time}</time><b>${source}</b><span>${message}${value ? ` / ${value}` : ""}</span>`;
    root.prepend(p);
    while(root.children.length > 7) root.lastElementChild.remove();
  }

  function controlLoop() {
    const events = [
      ["AIR-04","exchange balanced","61%"],
      ["THERMAL-02","setpoint maintained","18.4 C"],
      ["PRESSURE","corridor differential","+0.01 kPa"],
      ["FILTER-09","particulate nominal","4 ug/m3"],
      ["INTAKE","external sample accepted","stable"]
    ];
    const e = events[Math.floor(Math.random()*events.length)];
    addEvent(e[0],e[1],e[2]);
    if(Math.random()<.28) NS.Audio?.airShift?.(rand(-.65,.65));
    timers.push(window.setTimeout(controlLoop, rand(4500,7800)));
  }

  function respiratoryAnomaly() {
    const id = "environment-room18-respiratory";
    if(NS.State?.persistent?.anomaliesSeen?.includes(id)) return;
    const room = document.querySelector('[data-room="18"]');
    const text = $("[data-room18-respiratory]");
    if(!room || !text) return;
    room.classList.add("anomaly-active");
    text.textContent = "respiratory sources 1";
    addEvent("ROOM-18","respiratory source","1");
    NS.Events?.add("ENV-18","RESPIRATORY SOURCE 1",{anomaly:true});
    NS.Audio?.humanResidue?.(0.12);
    NS.State?.markAnomaly(id);
    NS.State?.addLore?.("continuity-occupancy-18");
    window.IAG?.V12?.attend?.('[data-room="18"]', "ROOM 18", 5600);

    timers.push(window.setTimeout(() => NS.Assistant?.say("Sensor drift. Nothing unusual.", 4300), 1700));
    timers.push(window.setTimeout(() => {
      text.textContent = "respiratory sources 0";
      room.classList.remove("anomaly-active");
      addEvent("ROOM-18","respiratory source","0");
    }, 6200));
  }

  function pressureAnomaly() {
    const id = "environment-room22-pressure";
    if(NS.State?.persistent?.anomaliesSeen?.includes(id)) return;
    const room = document.querySelector('[data-room="22"]');
    if(!room) return;
    room.classList.add("pressure-event");
    addEvent("ROOM-22","pressure displacement","+0.04 kPa");
    NS.Events?.add("ENV-22","PRESSURE DISPLACEMENT +0.04 KPA",{anomaly:true});
    NS.Audio?.airShift?.(0.62);
    NS.State?.markAnomaly(id);
    timers.push(window.setTimeout(()=>room.classList.remove("pressure-event"),4000));
  }

  function bindRooms() {
    document.querySelectorAll(".room-cell").forEach((room) => {
      room.addEventListener("click", () => {
        NS.State?.touchInteraction(`environment room ${room.dataset.room} inspected`);
        NS.Audio?.uiChirp?.(.007);
        if (room.dataset.room === "18" && NS.State?.persistent?.anomaliesSeen?.includes("environment-room18-respiratory")) {
          NS.State?.completeTask?.("environment");
          window.IAG?.V12?.release?.();
        }
      });
    });
  }

  function bind() {
    clock(); renderClimate(); bindRooms();
    window.setInterval(renderClimate, 2300);
    window.addEventListener("iag:system-started", () => {
      controlLoop();
      if((NS.State?.persistent?.pagesVisited?.environment || 0) <= 1) timers.push(window.setTimeout(()=>NS.Assistant?.say("Conditions are stable. You can stay here if you'd like."),2400));
      timers.push(window.setTimeout(respiratoryAnomaly, 7200));
      timers.push(window.setTimeout(pressureAnomaly, 18500));
    }, {once:true});
  }
  window.addEventListener("DOMContentLoaded",bind,{once:true});
})();
