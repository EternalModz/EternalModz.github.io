(() => {
  const NS = window.IAG = window.IAG || {};
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const timers = [];
  const rand = (a, b) => a + Math.random() * (b - a);

  const nodes = {
    "SF-044": { region: "NA-WEST", latency: 37, power: "12.8 kW", load: 22, packet: "now", hardware: "verified", state: "ACTIVE" },
    "SEA-008": { region: "NA-NORTH", latency: 42, power: "10.1 kW", load: 31, packet: "now", hardware: "verified", state: "ACTIVE" },
    "DEN-002": { region: "NA-CENTRAL", latency: 58, power: "8.4 kW", load: 67, packet: "4 s", hardware: "degraded", state: "DEGRADED" },
    "NYC-011": { region: "NA-EAST", latency: 49, power: "14.2 kW", load: 44, packet: "now", hardware: "verified", state: "ACTIVE" },
    "LON-006": { region: "EU-WEST", latency: 81, power: "11.6 kW", load: 36, packet: "1 s", hardware: "verified", state: "ACTIVE" },
    "AMS-012": { region: "EU-WEST", latency: 86, power: "13.4 kW", load: 29, packet: "now", hardware: "verified", state: "ACTIVE" },
    "BER-003": { region: "EU-CENTRAL", latency: 96, power: "7.9 kW", load: 71, packet: "8 s", hardware: "degraded", state: "DEGRADED" },
    "SIN-004": { region: "AP-SOUTH", latency: 133, power: "15.1 kW", load: 53, packet: "2 s", hardware: "verified", state: "ACTIVE" },
    "TYO-009": { region: "AP-NORTH", latency: 118, power: "16.7 kW", load: 41, packet: "now", hardware: "verified", state: "ACTIVE" },
    "SYD-008": { region: "AP-SOUTH", latency: 149, power: "9.8 kW", load: 26, packet: "3 s", hardware: "verified", state: "ACTIVE" },
    "NODE-071": { region: "ORBITAL-LEGACY", latency: null, power: "0.00 W", load: 0, packet: "22,491 d", hardware: "no active hardware", state: "OFFLINE" }
  };

  const nodePositions = {
    "SF-044": [19,47], "SEA-008": [16,24], "DEN-002": [30,42], "NYC-011": [43,39], "LON-006": [50,26],
    "AMS-012": [58,37], "BER-003": [66,27], "SIN-004": [76,63], "TYO-009": [87,42], "SYD-008": [88,78], "NODE-071": [69,18]
  };

  function clock() {
    const el = $("[data-scene-clock]");
    const draw = () => { if (el) el.textContent = new Date().toLocaleTimeString([], { hour12: false }); };
    draw();
    window.setInterval(draw, 1000);
  }

  function selectNode(name, user = false) {
    const data = nodes[name];
    if (!data) return;
    $$(".net-node").forEach((el) => el.classList.toggle("selected", el.dataset.node === name));
    $("[data-node-name]").textContent = name;
    $("[data-node-region]").textContent = data.region;
    $("[data-node-latency]").textContent = data.latency == null ? "unavailable" : `${Math.round(data.latency + rand(-3, 3))} ms`;
    $("[data-node-power]").textContent = data.power;
    $("[data-node-load]").textContent = `${Math.max(0, Math.round(data.load + rand(-2, 2)))}%`;
    $("[data-node-packet]").textContent = data.packet;
    $("[data-node-hardware]").textContent = data.hardware;
    const badge = $("[data-node-state]");
    badge.textContent = data.state;
    badge.className = `node-badge ${data.state.toLowerCase()}`;
    if (user) {
      NS.State?.touchInteraction(`node ${name} inspected`);
      NS.Audio?.networkPacket?.(name === "NODE-071" ? -0.55 : rand(-0.7, 0.7));
      if (name === "NODE-071") {
        NS.Assistant?.say("No active hardware detected.", 2800);
        if (NS.State?.persistent?.anomaliesSeen?.includes("network-node071-sync")) {
          NS.State?.completeTask?.("network");
          NS.State?.addLore?.("continuity-route-071");
          window.IAG?.V12?.attend?.('[data-node="NODE-071"]', "OFFLINE NODE TRANSMITTED", 2400);
        }
      }
    }
  }

  function addRoute(source, message, tail = "") {
    const root = $("[data-route-feed]");
    if (!root) return;
    const time = new Date().toLocaleTimeString([], { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const p = document.createElement("p");
    p.innerHTML = `<time>${time}</time><b>${source}</b><span>${message}${tail ? ` / ${tail}` : ""}</span>`;
    root.prepend(p);
    while (root.children.length > 7) root.lastElementChild.remove();
  }

  function routeLoop() {
    const pairs = [
      ["SF-044 -> SEA-008", "route verified", "39 ms"],
      ["AMS-012 -> LON-006", "packet exchange", "84 ms"],
      ["TYO-009 -> SIN-004", "handoff complete", "126 ms"],
      ["NYC-011 -> DEN-002", "load rebalance", "51 ms"],
      ["ORBITAL-03 -> TYO-009", "clock sync", "+0.004 ms"],
      ["BER-003 -> AMS-012", "degraded route", "retry 1"]
    ];
    const event = pairs[Math.floor(Math.random() * pairs.length)];
    addRoute(event[0], event[1], event[2]);
    if (Math.random() < .45) NS.Audio?.networkPacket?.(rand(-.8, .8));
    timers.push(window.setTimeout(routeLoop, rand(3200, 6500)));
  }

  function moveAssistant() {
    const cursor = $("[data-assistant-cursor]");
    const names = Object.keys(nodePositions).filter((n) => n !== "NODE-071");
    if (!cursor) return;
    const name = names[Math.floor(Math.random() * names.length)];
    const [x,y] = nodePositions[name];
    cursor.style.setProperty("--x", `${x}%`);
    cursor.style.setProperty("--y", `${y}%`);
    timers.push(window.setTimeout(moveAssistant, rand(6500, 10500)));
  }

  function impossibleSync() {
    const id = "network-node071-sync";
    if (NS.State?.persistent?.anomaliesSeen?.includes(id)) return;
    const node = document.querySelector('[data-node="NODE-071"]');
    if (!node) return;
    node.classList.add("impossible-activity");
    addRoute("NODE-071", "synchronization complete", "0 ms");
    NS.Events?.add("NODE-071", "SYNCHRONIZATION COMPLETE", { anomaly: true });
    NS.Audio?.impossiblePulse?.(-0.35);
    NS.State?.markAnomaly(id);
    NS.State?.addLore?.("continuity-route-071");
    window.IAG?.V12?.attend?.('[data-node="NODE-071"]', "INSPECT SOURCE", 5200);
    window.setTimeout(() => node.classList.remove("impossible-activity"), 2800);
  }

  function bind() {
    clock();
    $$(".net-node").forEach((el) => el.addEventListener("click", () => selectNode(el.dataset.node, true)));
    selectNode("SF-044");

    window.addEventListener("iag:system-started", () => {
      routeLoop();
      moveAssistant();
      if ((NS.State?.persistent?.pagesVisited?.network || 0) <= 1) {
        timers.push(window.setTimeout(() => NS.Assistant?.say("Routing fabric is stable."), 2300));
      }
      timers.push(window.setTimeout(impossibleSync, 7200));
    }, { once: true });

    window.setInterval(() => {
      const health = $("[data-network-health]");
      const degraded = $("[data-degraded]");
      if (health && NS.State) health.textContent = `${Number(NS.State.persistent.world.networkHealth).toFixed(2)}%`;
      if (degraded && NS.State) degraded.textContent = String(NS.State.persistent.world.degradedNodes);
    }, 1800);
  }

  window.addEventListener("DOMContentLoaded", bind, { once: true });
})();
