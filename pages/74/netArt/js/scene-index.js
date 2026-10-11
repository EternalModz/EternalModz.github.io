(() => {
  const NS = window.IAG = window.IAG || {};
  const timers = [];
  let booted = false;

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const later = (fn, ms) => timers.push(window.setTimeout(fn, ms));

  function renderClock() {
    const el = $("[data-terminal-clock]");
    if (!el) return;
    const tick = () => {
      const d = new Date();
      el.textContent = d.toLocaleTimeString([], { hour12: false });
    };
    tick();
    window.setInterval(tick, 1000);
  }

  function renderSessionMeta() {
    const id = $("[data-session-id]");
    if (id && NS.State?.session?.id) id.textContent = NS.State.session.id;

    const uplink = $("[data-uplink-status]");
    if (uplink) uplink.textContent = navigator.onLine ? "nominal" : "unavailable";

    window.addEventListener("online", () => { if (uplink) uplink.textContent = "nominal"; });
    window.addEventListener("offline", () => { if (uplink) uplink.textContent = "unavailable"; });
  }

  function renderActivity() {
    const root = $("[data-index-activity]");
    if (!root || !NS.Events) return;
    const draw = () => {
      const rows = NS.Events.all().slice(-9).reverse();
      root.innerHTML = rows.map((entry) => {
        const time = new Date(entry.at).toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
        return `<div class="activity-row"><time>${time}</time><b>${entry.source}</b><span>${entry.message}</span></div>`;
      }).join("");
    };
    draw();
    window.addEventListener("iag:event", draw);
  }

  function updateMeters() {
    if (!NS.State) return;
    const w = NS.State.persistent.world;
    const values = {
      network: Math.max(0, Math.min(100, Number(w.networkHealth))),
      power: Math.max(0, Math.min(100, Number(w.powerReserve))),
      nodes: Math.max(0, Math.min(100, Number(w.activeNodes) / 7.2)),
      jobs: Math.max(0, Math.min(100, Number(w.maintenanceJobs) / 0.8))
    };
    Object.entries(values).forEach(([key, value]) => {
      const meter = $(`[data-meter="${key}"]`);
      if (meter) meter.style.width = `${value}%`;
    });
    const core = $("[data-core-health]");
    if (core) core.textContent = Number(w.networkHealth).toFixed(2);
  }

  function driftPeripheralData() {
    const thermal = $("[data-drift=\"thermal\"]");
    const packet = $("[data-drift=\"packet\"]");
    const clock = $("[data-drift=\"clock\"]");
    const archive = $("[data-drift=\"archive\"]");
    if (thermal) thermal.textContent = `${(18.4 + (Math.random() - 0.5) * 0.22).toFixed(1)} C`;
    if (packet) packet.textContent = `${(1.82 + (Math.random() - 0.5) * 0.14).toFixed(2)} Tb/s`;
    if (clock) clock.textContent = `${Math.random() < 0.5 ? "+" : "-"}${(Math.random() * 0.008).toFixed(3)} ms`;
    if (archive) archive.textContent = `${(11.7 + (Math.random() - 0.5) * 1.4).toFixed(1)}%`;
  }

  function bootSequence() {
    if (booted) return;
    booted = true;
    const root = $("[data-boot-sequence]");
    if (!root) return;

    NS.State.session.flags = NS.State.session.flags || {};
    if (NS.State.session.flags.indexBootComplete) {
      root.remove();
      return;
    }

    root.classList.add("visible");
    const sequence = [
      [0, "established", "TRANSPORT", "SECURE CHANNEL ESTABLISHED"],
      [1, "synchronized", "CLOCK", "REFERENCE CLOCK SYNCHRONIZED"],
      [2, "receiving", "TELEMETRY", "LIVE TELEMETRY RECEIVING"],
      [3, "verified", "ARCHIVE", "INDEX HASH VERIFIED"],
      [4, "online", "AUDIO", "ENVIRONMENT ONLINE"]
    ];

    sequence.forEach(([idx, status, source, message], order) => {
      later(() => {
        const row = $(`[data-boot-line="${idx}"]`);
        if (!row) return;
        row.classList.add("done");
        const b = row.querySelector("b");
        if (b) b.textContent = status;
        NS.Audio?.bootTick?.(order);
        NS.Events?.add(source, message);
      }, 380 + order * 620);
    });

    later(() => {
      root.classList.add("complete");
      NS.State.session.flags.indexBootComplete = true;
      NS.State.saveSession();
    }, 3800);
    later(() => root.remove(), 4700);
  }

  function tinyConnectionAnomaly() {
    if (!NS.State?.session) return;
    NS.State.session.flags = NS.State.session.flags || {};
    if (NS.State.session.flags.indexConnectionAnomaly) return;
    NS.State.session.flags.indexConnectionAnomaly = true;
    NS.State.saveSession();

    const count = $("[data-connection-count]");
    if (!count) return;
    later(() => {
      count.textContent = "2";
      count.classList.add("anomaly-flash");
      later(() => {
        count.textContent = "1";
        count.classList.remove("anomaly-flash");
      }, 180);
    }, 6100);
  }

  function assistantOpening() {
    if (!NS.State?.session) return;
    NS.State.session.flags = NS.State.session.flags || {};
    if (NS.State.session.flags.indexAssistantOpening) return;
    NS.State.session.flags.indexAssistantOpening = true;
    NS.State.saveSession();

    later(() => NS.Assistant?.say("Global routing fabric available."), 7600);
    later(() => NS.Assistant?.say("I'll keep your session open."), 14800);
  }

  function wireSubsystemAudio() {
    $$(".subsystem-grid a").forEach((a) => {
      a.addEventListener("mouseenter", () => NS.Audio?.subsystemHover?.(a.dataset.page));
    });
  }

  function onSystemStarted() {
    bootSequence();
    tinyConnectionAnomaly();
    assistantOpening();
    updateMeters();
    driftPeripheralData();
    window.setInterval(updateMeters, 1800);
    window.setInterval(driftPeripheralData, 3100);
  }

  function init() {
    if ((document.body.dataset.page || "") !== "index") return;
    renderClock();
    renderSessionMeta();
    renderActivity();
    wireSubsystemAudio();
    window.addEventListener("iag:system-started", onSystemStarted, { once: true });

    if (document.body.classList.contains("started")) onSystemStarted();
  }

  window.addEventListener("DOMContentLoaded", init, { once: true });
})();
