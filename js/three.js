<script type="module">
    import * as THREE from 'https://threejs.org/build/three.module.js';

    // Create a scene, camera, and renderer
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    var renderer = new THREE.WebGLRenderer();

    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Create a geometry for the snowflakes
    var geometry = new THREE.Geometry();

    for (let i = 0; i < 10000; i++) {
        var vertex = new THREE.Vector3();
        vertex.x = THREE.Math.randFloatSpread(2000); // x position
        vertex.y = THREE.Math.randFloatSpread(2000); // y position
        vertex.z = THREE.Math.randFloatSpread(2000); // z position

        geometry.vertices.push(vertex);
    }

    // Create a material for the snowflakes
    var material = new THREE.PointsMaterial({ color: 0xffffff, size: 5 });

    // Create a points system for the snowflakes and add it to the scene
    var points = new THREE.Points(geometry, material);
    scene.add(points);

    // Position the camera
    camera.position.z = 500;

    // Create the animation
    function animate() {
        requestAnimationFrame(animate);

        points.rotation.y += 0.001;

        renderer.render(scene, camera);
    }

    animate();
</script>