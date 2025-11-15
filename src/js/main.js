import { PowerGlitch } from "powerglitch";
import { createIcons, icons } from 'lucide';

document.addEventListener('DOMContentLoaded', () => {
  createIcons({ icons });
});


document.addEventListener("DOMContentLoaded", () => {
  const words = ["FUN", "INNOVATIVE", "COMPELLING"];
  const glitchEl = document.getElementById("glitchWord");
  if (!glitchEl) return;

  let current = 0;

// Keep navbar always visible — CEO request
const navbar = document.getElementById("navbar");

window.addEventListener("scroll", () => {
  // Subtle darkening for readability when scrolling
  if (window.scrollY > 20) {
    navbar.classList.add("bg-black/80");
  } else {
    navbar.classList.remove("bg-black/80");
  }
});



  // Basic PowerGlitch configuration
  const glitchSettings = {
    playMode: "manual",   // only glitch when triggered
    createContainers: true,
    hideOverflow: false,
    timing: { duration: 300, iterations: 1 },
    glitchTimeSpan: { start: 0, end: 1 },
    shake: { velocity: 12, amplitudeX: 0.15, amplitudeY: 0.2 },
    slice: {
      count: 4,
      velocity: 10,
      minHeight: 0.05,
      maxHeight: 0.15,
      hueRotate: true,
    },
  };

  // Prepare glitch element
  const glitchInstance = PowerGlitch.glitch(glitchEl, glitchSettings);

  function cycleWord() {
    // fade out
    glitchEl.style.transition = "opacity 0.2s ease";
    glitchEl.style.opacity = 0;

    setTimeout(() => {
      // update word
      current = (current + 1) % words.length;
      glitchEl.textContent = words[current];
      glitchEl.setAttribute("data-text", words[current]);

      // fade in
      glitchEl.style.opacity = 1;

      // trigger PowerGlitch once per word change
      glitchInstance.startGlitch();
      setTimeout(() => glitchInstance.stopGlitch(), 400);
    }, 200);
  }

  // Start cycle
  setInterval(cycleWord, 3000);
});
