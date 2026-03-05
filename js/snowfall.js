/* ============================================
   Return Rover — Lightweight Snowfall Effect
   CSS-driven particles, no images needed
   ============================================ */

(function () {
    "use strict";

    const COUNT = 30;

    for (let i = 0; i < COUNT; i++) {
        const flake = document.createElement("div");
        flake.className = "snowflake";
        flake.style.left = Math.random() * 100 + "%";
        flake.style.animationDuration = 6 + Math.random() * 8 + "s";
        flake.style.animationDelay = Math.random() * 10 + "s";
        flake.style.width = flake.style.height = 3 + Math.random() * 5 + "px";
        flake.style.opacity = 0.3 + Math.random() * 0.5;
        document.body.appendChild(flake);
    }
})();
