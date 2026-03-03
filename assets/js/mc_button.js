(() => {
  // Configuration
  const config = {
    enableHoverSound: true,
    clickDebounceMs: 300,
    clickSoundSrc: "https://archive.org/download/minecraft-console-sounds/Click.wav",
    hoverSoundSrc: "https://archive.org/download/minecraft-console-sounds/MoveCursor.wav",
    clickSoundPoolSize: 5, // Number of audio clones to handle overlap
  };

  // Create audio pools for click sounds
  const clickAudioPool = [];
  for (let i = 0; i < config.clickSoundPoolSize; i++) {
    const audio = new Audio(config.clickSoundSrc);
    audio.volume = 0.3;
    clickAudioPool.push(audio);
  }
  let clickAudioIndex = 0;

  // Single hover audio instance (no overlap needed)
  const hoverAudio = new Audio(config.hoverSoundSrc);
  hoverAudio.volume = 0.3;

  // Debounce state per button
  const debounceMap = new WeakMap();

  // Play click sound using audio pool to reduce delay on spam clicks
  function playClickSound() {
    const audio = clickAudioPool[clickAudioIndex];
    audio.currentTime = 0;
    audio.play().catch(() => {});
    clickAudioIndex = (clickAudioIndex + 1) % config.clickSoundPoolSize;
  }

  // Play hover sound (single instance)
  function playHoverSound() {
    if (!config.enableHoverSound) return;
    hoverAudio.currentTime = 0;
    hoverAudio.play().catch(() => {});
  }

  // Click handler with debounce
  function handleClick(event) {
    const btn = event.currentTarget;

    if (debounceMap.get(btn)) return;

    playClickSound();

    debounceMap.set(btn, true);
    setTimeout(() => debounceMap.delete(btn), config.clickDebounceMs);
  }

  // Hover handler
  function handleHover(event) {
    playHoverSound();
  }

  // Keyboard handler for Enter/Space and focus (tab)
  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      playClickSound();
    }
  }

  // Focus handler for keyboard navigation to play hover sound
  function handleFocus(event) {
    playHoverSound();
  }

  // Initialize buttons
  function init() {
    const buttons = document.querySelectorAll(".mc_button");
    buttons.forEach((btn) => {
      btn.addEventListener("click", handleClick);
      btn.addEventListener("mouseover", handleHover);
      btn.addEventListener("keydown", handleKeyDown);
      btn.addEventListener("focus", handleFocus);  // Play hover sound on tab focus
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
