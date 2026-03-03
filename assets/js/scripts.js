let bgOffset = 0;
let lastTimestamp = null;
const scrollSpeed = 90; // pretty much just how fast it goes, in pixels per second

function scrollBackground(timestamp) {
  if (!lastTimestamp) lastTimestamp = timestamp;
  const deltaTime = (timestamp - lastTimestamp) / 1000;
  lastTimestamp = timestamp;

  bgOffset += scrollSpeed * deltaTime;

  // No modulo = smooth infinite scroll!
  document.body.style.backgroundPosition = `${-bgOffset}px 0`;

  requestAnimationFrame(scrollBackground);
}

window.addEventListener("load", () => {
  // Infinite horizontal scroll of the panoramic background
  document.body.style.backgroundRepeat = "repeat-x";
  document.body.style.backgroundSize = "auto 100%";

  // This fixes a weird bug where scrolling gets disabled when zoomed in
  document.documentElement.style.overflowY = "auto"; // Make sure that the scrollbars show
  document.body.style.overflowY = "auto"; // Scroll content if needed

  requestAnimationFrame(scrollBackground);
});
