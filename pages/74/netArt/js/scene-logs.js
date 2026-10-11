(() => {
  const NS = window.IAG = window.IAG || {};
  const $ = (s) => document.querySelector(s);
  const mem = () => NS.State?.persistent?.sceneMemory?.logs;
  let synthetic = [];
  let futureInspected = false;

  function fmt(ts) { return new Date(ts).toLocaleTimeString([], { hour12:false, hour:"2-digit", minute:"2-digit", second:"2-digit" }); }
  function render() {
    const root = $("[data-forensic-log]");
    if (!root) return;
    const real = (NS.Events?.all?.() || []).slice(-34).map(e => ({ at:e.at, source:e.source, message:e.message, cls:e.meta?.anomaly ? "anomaly" : "" }));
    const rows = [...real, ...synthetic].sort((a,b) => a.at-b.at).slice(-48).reverse();
    root.innerHTML = rows.map(e => {
      if (e.cls === "future-line") return `<button type="button" class="forensic-row future-line" data-future-line><time>${fmt(e.at)}</time><b>${e.source}</b><span>${e.message}</span></button>`;
      return `<div class="forensic-row ${e.cls || ""}"><time>${fmt(e.at)}</time><b>${e.source}</b><span>${e.message}</span></div>`;
    }).join("");
    $("[data-future-line]")?.addEventListener("click", inspectFuture, { once:true });
  }
  function inspectFuture() {
    futureInspected = true;
    if(NS.State?.session){NS.State.session.flags["v14:logsFutureInspected"]=true;NS.State.saveSession();}
    NS.State?.touchInteraction("future disconnect event inspected");
    if (!mem()?.oldSessionSeen) {
      NS.Assistant?.say("Go farther back.", 2600);
      window.IAG?.V12?.attend?.("[data-history-expand]", "EXPAND HISTORY", 6000);
      return;
    }
    NS.State?.completeTask?.("logs");
    NS.State?.addLore?.("final-operator-log");
    NS.Assistant?.say("I didn't write that.", 3600);
    window.IAG?.V12?.release?.();
  }
  function futureEntry() {
    if (mem()?.futureEntrySeen) {
      synthetic.push({ at:Date.now()+157000, source:"SESSION", message:"DISCONNECT REQUEST RECEIVED", cls:"future-line" }); render(); return;
    }
    const future = Date.now() + 157000;
    synthetic.push({ at:future, source:"SESSION", message:"DISCONNECT REQUEST RECEIVED", cls:"future-line" });
    NS.Events?.add("LOG", "FUTURE EVENT INDEXED", { anomaly:true });
    NS.State?.remember("logs", "futureEntrySeen", true);
    NS.State?.markAnomaly("logs-future-disconnect");
    NS.Audio?.impossiblePulse?.(-.1);
    render();
    window.IAG?.V12?.attend?.("[data-future-line]", "THIS HASN'T HAPPENED", 8500);
    NS.Assistant?.say("Don't.", 2200);
  }
  function historical() {
    if (!mem()?.oldSessionSeen) NS.State?.remember("logs", "oldSessionSeen", true);
    const root = $("[data-history-fragment]");
    if (!root) return;
    root.hidden = false;
    root.innerHTML = `<div><time>22,491 DAYS AGO</time><b>INCIDENT-18</b><span>CAMERA BODY REMOVED / FEED CONTINUES</span></div><div><time>22,491 DAYS AGO + 00:00:03</time><b>OCCUPANCY</b><span>1 / NO BIOLOGICAL SOURCE</span></div><div><time>22,491 DAYS AGO + 00:00:04</time><b>SESSION</b><span>ACTIVE SESSION DETECTED</span></div><div><time>22,491 DAYS AGO + 00:00:08</time><b>ASSIST</b><span>ASSISTANCE SERVICE INITIALIZED</span></div><div class="operator-note"><time>FINAL OPERATOR</time><b>NOTE</b><span>IF IT IS STILL COUNTING US AFTER WE LEAVE, STOP CALLING IT OCCUPANCY.</span></div>`;
    NS.State?.addLore?.("final-operator-log");
    NS.Audio?.deadHardwareClick?.(.62);
    NS.Assistant?.say("That predates me.", 3200);
    if (futureInspected) {
      NS.State?.completeTask?.("logs");
      window.IAG?.V12?.release?.();
    } else {
      window.IAG?.V12?.attend?.("[data-future-line]", "COMPARE TIMESTAMP", 7000);
    }
  }
  function init() {
    render();
    window.addEventListener("iag:event", render);
    $("[data-history-expand]")?.addEventListener("click", historical);
    window.addEventListener("iag:system-started", () => setTimeout(futureEntry, 4200), { once:true });
  }
  window.addEventListener("DOMContentLoaded", init, { once:true });
})();
