/* ============================================
   Return Rover — Three.js Particle Background
   Dual-layer particles with depth + mouse parallax
   ============================================ */

(function () {
    "use strict";

    const canvas = document.getElementById("three-bg");
    if (!canvas) return;

    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    script.onload = init;
    document.head.appendChild(script);

    function init() {
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 2000);
        camera.position.z = 700;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Two particle layers for depth
        const layers = [
            { count: 2000, speed: 0.15, size: 2, opacity: 0.25, spread: 1800, color: 0x3b82f6 },
            { count: 800, speed: 0.4, size: 3.5, opacity: 0.5, spread: 1200, color: 0x818cf8 },
        ];

        const groups = [];

        layers.forEach((cfg) => {
            const positions = new Float32Array(cfg.count * 3);
            const velocities = new Float32Array(cfg.count);

            for (let i = 0; i < cfg.count; i++) {
                positions[i * 3] = (Math.random() - 0.5) * cfg.spread;
                positions[i * 3 + 1] = (Math.random() - 0.5) * cfg.spread;
                positions[i * 3 + 2] = (Math.random() - 0.5) * cfg.spread;
                velocities[i] = cfg.speed * (0.6 + Math.random() * 0.8);
            }

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

            const material = new THREE.PointsMaterial({
                color: cfg.color,
                size: cfg.size,
                transparent: true,
                opacity: cfg.opacity,
                sizeAttenuation: true,
                depthWrite: false,
            });

            const points = new THREE.Points(geometry, material);
            scene.add(points);
            groups.push({ points, geometry, velocities, cfg, material });
        });

        let mouseX = 0, mouseY = 0;
        document.addEventListener("mousemove", (e) => {
            mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
            mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
        });

        window.addEventListener("resize", () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // React to theme changes
        function updateColors() {
            const dark = document.documentElement.getAttribute("data-theme") === "dark";
            groups[0].material.color.setHex(dark ? 0x60a5fa : 0x3b82f6);
            groups[0].material.opacity = dark ? 0.2 : 0.2;
            groups[1].material.color.setHex(dark ? 0xa78bfa : 0x818cf8);
            groups[1].material.opacity = dark ? 0.35 : 0.4;
            groups.forEach((g) => { g.material.needsUpdate = true; });
        }
        const observer = new MutationObserver(updateColors);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        updateColors();

        function animate() {
            requestAnimationFrame(animate);

            groups.forEach((g, idx) => {
                const pos = g.geometry.attributes.position.array;
                const half = g.cfg.spread / 2;
                for (let i = 0; i < g.cfg.count; i++) {
                    pos[i * 3 + 1] -= g.velocities[i];
                    if (pos[i * 3 + 1] < -half) {
                        pos[i * 3 + 1] = half;
                        pos[i * 3] = (Math.random() - 0.5) * g.cfg.spread;
                    }
                }
                g.geometry.attributes.position.needsUpdate = true;

                g.points.rotation.y += 0.0002 * (idx + 1);
            });

            camera.position.x += (mouseX * 60 - camera.position.x) * 0.015;
            camera.position.y += (-mouseY * 30 - camera.position.y) * 0.015;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }

        animate();
    }
})();
