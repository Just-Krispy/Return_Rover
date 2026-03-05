/* ============================================
   Return Rover — Three.js Particle Background
   Uses modern BufferGeometry + responsive canvas
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
        camera.position.z = 600;

        const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const COUNT = 3000;
        const positions = new Float32Array(COUNT * 3);
        const velocities = new Float32Array(COUNT);

        for (let i = 0; i < COUNT; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1600;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1600;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1600;
            velocities[i] = 0.2 + Math.random() * 0.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x4a9eff,
            size: 2.5,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true,
        });

        const points = new THREE.Points(geometry, material);
        scene.add(points);

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
        function updateColor() {
            const dark = document.documentElement.getAttribute("data-theme") === "dark";
            material.color.setHex(dark ? 0x5ba8ff : 0x4a9eff);
            material.opacity = dark ? 0.5 : 0.35;
            material.needsUpdate = true;
        }
        const observer = new MutationObserver(updateColor);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        updateColor();

        function animate() {
            requestAnimationFrame(animate);

            const pos = geometry.attributes.position.array;
            for (let i = 0; i < COUNT; i++) {
                pos[i * 3 + 1] -= velocities[i];
                if (pos[i * 3 + 1] < -800) {
                    pos[i * 3 + 1] = 800;
                    pos[i * 3] = (Math.random() - 0.5) * 1600;
                }
            }
            geometry.attributes.position.needsUpdate = true;

            points.rotation.y += 0.0003;
            points.rotation.x += (mouseY * 0.1 - points.rotation.x) * 0.02;
            camera.position.x += (mouseX * 50 - camera.position.x) * 0.01;

            renderer.render(scene, camera);
        }

        animate();
    }
})();
