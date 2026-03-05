/* ============================================
   Return Rover — Falling Envelopes Effect
   Little blue letters drifting down the page
   ============================================ */

(function () {
    "use strict";

    const COUNT = 18;

    // Mini envelope SVG — matches the one Rover holds
    const envelopeSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28" fill="none">
        <rect x="1" y="1" width="38" height="26" rx="3" fill="#3B82F6" opacity="0.85"/>
        <path d="M1 4 L20 18 L39 4" fill="#60A5FA" opacity="0.8"/>
        <path d="M1 4 L20 18 L39 4" stroke="#4338CA" stroke-width="0.5" fill="none" opacity="0.3"/>
        <path d="M18 8 C18 5.5 19.5 4 20.5 6 C21.5 4 23 5.5 23 8 C23 11 20.5 13 20.5 13 C20.5 13 18 11 18 8Z" fill="#F472B6" opacity="0.9"/>
    </svg>`;

    for (let i = 0; i < COUNT; i++) {
        const el = document.createElement("div");
        el.className = "snowflake";
        el.innerHTML = envelopeSVG;
        el.style.left = Math.random() * 100 + "%";
        el.style.animationDuration = 10 + Math.random() * 12 + "s";
        el.style.animationDelay = Math.random() * 14 + "s";

        const size = 14 + Math.random() * 16;
        el.style.width = size + "px";
        el.style.height = (size * 0.7) + "px";
        el.style.opacity = 0.15 + Math.random() * 0.3;

        document.body.appendChild(el);
    }
})();
