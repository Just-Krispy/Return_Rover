/**
 * Data Layers System - Toggleable Intelligence Overlays
 * 7 information layers with smooth animations and visual design
 */

class DataLayersManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Layer registry
        this.layers = {
            historicalCrises: { enabled: true, opacity: 1.0, sprites: [], connections: [] },
            activeConflicts: { enabled: true, opacity: 1.0, sprites: [], connections: [] },
            nuclearFacilities: { enabled: true, opacity: 1.0, sprites: [], connections: [] },
            militaryAssets: { enabled: true, opacity: 1.0, sprites: [], connections: [] },
            allianceNetworks: { enabled: true, opacity: 1.0, sprites: [], connections: [] },
            tradeRoutes: { enabled: true, opacity: 1.0, sprites: [], connections: [] },
            earlyWarning: { enabled: true, opacity: 1.0, sprites: [], connections: [] }
        };

        // Visual configuration
        this.colors = {
            historicalCrises: { positive: 0xfbbd23, negative: 0xf87171 },
            activeConflicts: 0xdc2626,
            nuclearFacilities: 0xf97316,
            militaryAssets: 0x3b82f6,
            allianceNetworks: { usa: 0x3b82f6, russia: 0xdc2626, china: 0xfbbf24, neutral: 0x8b5cf6 },
            tradeRoutes: 0x22c55e,
            earlyWarning: 0xeab308
        };

        // Animation state
        this.animationTime = 0;
        this.flowParticles = new Map();

        // Initialize layers
        this.initializeLayers();
    }

    initializeLayers() {
        // Load layer data
        this.loadHistoricalCrises();
        this.loadActiveConflicts();
        this.loadNuclearFacilities();
        this.loadMilitaryAssets();
        this.loadAllianceNetworks();
        this.loadTradeRoutes();
        this.loadEarlyWarning();
    }

    // Layer 1: Historical Crises (1913-2026)
    loadHistoricalCrises() {
        const crises = [
            // WWI-era
            { name: "WWI Outbreak", lat: 48.8566, lon: 2.3522, year: 1914, outcome: "negative", severity: 10 },
            { name: "Treaty of Versailles", lat: 48.8566, lon: 2.3522, year: 1919, outcome: "negative", severity: 8 },
            
            // WWII-era
            { name: "WWII Outbreak", lat: 52.2297, lon: 21.0122, year: 1939, outcome: "negative", severity: 10 },
            { name: "D-Day Landing", lat: 49.3708, lon: -0.8981, year: 1944, outcome: "positive", severity: 9 },
            { name: "Atomic Bombings", lat: 34.3853, lon: 132.4553, year: 1945, outcome: "negative", severity: 10 },
            { name: "UN Foundation", lat: 40.7489, lon: -73.9680, year: 1945, outcome: "positive", severity: 7 },
            
            // Cold War crises
            { name: "Berlin Airlift", lat: 52.5200, lon: 13.4050, year: 1948, outcome: "positive", severity: 6 },
            { name: "Korean War", lat: 38.0000, lon: 127.0000, year: 1950, outcome: "negative", severity: 8 },
            { name: "Suez Crisis", lat: 30.0444, lon: 31.2357, year: 1956, outcome: "negative", severity: 7 },
            { name: "Cuban Missile Crisis", lat: 23.1136, lon: -82.3666, year: 1962, outcome: "positive", severity: 9 },
            { name: "Vietnam War Peak", lat: 21.0285, lon: 105.8542, year: 1968, outcome: "negative", severity: 8 },
            { name: "Fall of Saigon", lat: 10.8231, lon: 106.6297, year: 1975, outcome: "negative", severity: 7 },
            { name: "Camp David Accords", lat: 39.6467, lon: -77.4650, year: 1978, outcome: "positive", severity: 6 },
            { name: "Soviet-Afghan War", lat: 34.5553, lon: 69.2075, year: 1979, outcome: "negative", severity: 7 },
            { name: "Fall of Berlin Wall", lat: 52.5200, lon: 13.4050, year: 1989, outcome: "positive", severity: 8 },
            { name: "USSR Collapse", lat: 55.7558, lon: 37.6173, year: 1991, outcome: "positive", severity: 9 },
            
            // Post-Cold War
            { name: "Gulf War", lat: 29.3759, lon: 47.9774, year: 1991, outcome: "positive", severity: 7 },
            { name: "Rwandan Genocide", lat: -1.9403, lon: 29.8739, year: 1994, outcome: "negative", severity: 9 },
            { name: "Oslo Accords", lat: 59.9139, lon: 10.7522, year: 1993, outcome: "positive", severity: 5 },
            { name: "9/11 Attacks", lat: 40.7128, lon: -74.0060, year: 2001, outcome: "negative", severity: 10 },
            { name: "Iraq Invasion", lat: 33.3152, lon: 44.3661, year: 2003, outcome: "negative", severity: 8 },
            { name: "Arab Spring", lat: 30.0444, lon: 31.2357, year: 2011, outcome: "negative", severity: 7 },
            { name: "Syrian Civil War", lat: 33.5138, lon: 36.2765, year: 2011, outcome: "negative", severity: 9 },
            { name: "Crimea Annexation", lat: 44.9519, lon: 34.1022, year: 2014, outcome: "negative", severity: 8 },
            { name: "ISIS Peak", lat: 33.3152, lon: 44.3661, year: 2015, outcome: "negative", severity: 9 },
            { name: "Abraham Accords", lat: 24.4539, lon: 54.3773, year: 2020, outcome: "positive", severity: 6 },
            { name: "Ukraine Invasion", lat: 50.4501, lon: 30.5234, year: 2022, outcome: "negative", severity: 10 }
        ];

        crises.forEach(crisis => {
            const sprite = this.createMarker(
                crisis.lat, crisis.lon,
                crisis.outcome === "positive" ? this.colors.historicalCrises.positive : this.colors.historicalCrises.negative,
                'circle',
                crisis.severity * 0.08
            );
            sprite.userData = { layer: 'historicalCrises', crisis };
            this.layers.historicalCrises.sprites.push(sprite);
            this.scene.add(sprite);
        });
    }

    // Layer 2: Active Conflicts (Ukraine, Gaza, Sudan) with pulsing
    loadActiveConflicts() {
        const conflicts = [
            { name: "Ukraine War", lat: 50.4501, lon: 30.5234, intensity: 10, hotspots: [
                { name: "Bakhmut", lat: 48.5936, lon: 38.0011 },
                { name: "Donetsk", lat: 48.0159, lon: 37.8028 },
                { name: "Mariupol", lat: 47.0970, lon: 37.5431 },
                { name: "Kherson", lat: 46.6354, lon: 32.6169 }
            ]},
            { name: "Gaza Conflict", lat: 31.5, lon: 34.45, intensity: 9, hotspots: [
                { name: "Gaza City", lat: 31.5, lon: 34.45 },
                { name: "Khan Younis", lat: 31.3469, lon: 34.3044 },
                { name: "Rafah", lat: 31.2905, lon: 34.2452 }
            ]},
            { name: "Sudan Civil War", lat: 15.5007, lon: 32.5599, intensity: 8, hotspots: [
                { name: "Khartoum", lat: 15.5007, lon: 32.5599 },
                { name: "Darfur", lat: 12.8628, lon: 24.9556 }
            ]}
        ];

        conflicts.forEach(conflict => {
            conflict.hotspots.forEach(spot => {
                const sprite = this.createPulsingMarker(
                    spot.lat, spot.lon,
                    this.colors.activeConflicts,
                    'hexagon',
                    conflict.intensity * 0.1
                );
                sprite.userData = { layer: 'activeConflicts', conflict: conflict.name, location: spot.name };
                this.layers.activeConflicts.sprites.push(sprite);
                this.scene.add(sprite);
            });
        });
    }

    // Layer 3: Nuclear Facilities
    loadNuclearFacilities() {
        const facilities = [
            // Enrichment sites
            { name: "Natanz", country: "Iran", lat: 33.7241, lon: 51.7303, type: "enrichment" },
            { name: "Fordow", country: "Iran", lat: 34.8831, lon: 50.9872, type: "enrichment" },
            { name: "Yongbyon", country: "North Korea", lat: 39.7977, lon: 125.7547, type: "enrichment" },
            
            // Reactors
            { name: "Bushehr", country: "Iran", lat: 28.9920, lon: 50.8818, type: "reactor" },
            { name: "Dimona", country: "Israel", lat: 31.0000, lon: 35.1436, type: "reactor" },
            
            // Missile bases
            { name: "Plesetsk", country: "Russia", lat: 62.9256, lon: 40.5772, type: "missile" },
            { name: "Baikonur", country: "Kazakhstan", lat: 45.9650, lon: 63.3050, type: "missile" },
            { name: "Vandenberg", country: "USA", lat: 34.7420, lon: -120.5724, type: "missile" },
            
            // Strategic arsenals
            { name: "Los Alamos", country: "USA", lat: 35.8800, lon: -106.3031, type: "research" },
            { name: "Savannah River", country: "USA", lat: 33.2500, lon: -81.7333, type: "production" },
            { name: "Pantex", country: "USA", lat: 35.2167, lon: -101.5500, type: "assembly" },
            { name: "Sarov", country: "Russia", lat: 54.9333, lon: 43.3333, type: "research" },
            { name: "Novaya Zemlya", country: "Russia", lat: 73.3700, lon: 54.9800, type: "test" }
        ];

        facilities.forEach(fac => {
            const sprite = this.createMarker(
                fac.lat, fac.lon,
                this.colors.nuclearFacilities,
                'triangle',
                0.6
            );
            sprite.userData = { layer: 'nuclearFacilities', facility: fac };
            this.layers.nuclearFacilities.sprites.push(sprite);
            this.scene.add(sprite);
        });
    }

    // Layer 4: Military Assets
    loadMilitaryAssets() {
        const assets = [
            // US Carrier Strike Groups
            { name: "USS Gerald R. Ford", type: "carrier", lat: 36.8468, lon: -76.2955, country: "USA" },
            { name: "USS Nimitz", type: "carrier", lat: 47.9554, lon: -122.6516, country: "USA" },
            { name: "USS Ronald Reagan", type: "carrier", lat: 35.3364, lon: 139.6620, country: "USA" },
            
            // Major US bases
            { name: "Ramstein AB", type: "airbase", lat: 49.4369, lon: 7.6003, country: "USA" },
            { name: "Al Udeid AB", type: "airbase", lat: 25.1172, lon: 51.3150, country: "USA" },
            { name: "Diego Garcia", type: "base", lat: -7.3167, lon: 72.4167, country: "USA" },
            { name: "Guam", type: "base", lat: 13.4443, lon: 144.7937, country: "USA" },
            
            // Russian military
            { name: "Tartus Naval Base", type: "naval", lat: 34.8831, lon: 35.8869, country: "Russia" },
            { name: "Hmeimim AB", type: "airbase", lat: 35.4011, lon: 35.9486, country: "Russia" },
            { name: "Kaliningrad", type: "base", lat: 54.7104, lon: 20.4522, country: "Russia" },
            
            // Chinese military
            { name: "Djibouti Base", type: "naval", lat: 11.5721, lon: 43.1456, country: "China" },
            { name: "South China Sea Bases", type: "naval", lat: 10.0, lon: 114.0, country: "China" },
            
            // Air defense systems
            { name: "S-400 Syria", type: "air-defense", lat: 34.8021, lon: 38.9968, country: "Russia" },
            { name: "Iron Dome", type: "air-defense", lat: 31.7683, lon: 35.2137, country: "Israel" },
            { name: "THAAD Korea", type: "air-defense", lat: 37.5665, lon: 126.9780, country: "USA" }
        ];

        assets.forEach(asset => {
            const sprite = this.createMarker(
                asset.lat, asset.lon,
                this.colors.militaryAssets,
                'square',
                0.5
            );
            sprite.userData = { layer: 'militaryAssets', asset };
            this.layers.militaryAssets.sprites.push(sprite);
            this.scene.add(sprite);
        });
    }

    // Layer 5: Alliance Networks with connection lines
    loadAllianceNetworks() {
        const alliances = [
            // NATO core
            { name: "NATO", members: [
                { name: "Washington DC", lat: 38.9072, lon: -77.0369 },
                { name: "London", lat: 51.5074, lon: -0.1278 },
                { name: "Paris", lat: 48.8566, lon: 2.3522 },
                { name: "Berlin", lat: 52.5200, lon: 13.4050 },
                { name: "Warsaw", lat: 52.2297, lon: 21.0122 }
            ], color: this.colors.allianceNetworks.usa },
            
            // Russia-Iran-Syria axis
            { name: "Russia-Iran Axis", members: [
                { name: "Moscow", lat: 55.7558, lon: 37.6173 },
                { name: "Tehran", lat: 35.6892, lon: 51.3890 },
                { name: "Damascus", lat: 33.5138, lon: 36.2765 }
            ], color: this.colors.allianceNetworks.russia },
            
            // China's sphere
            { name: "China Partnerships", members: [
                { name: "Beijing", lat: 39.9042, lon: 116.4074 },
                { name: "Islamabad", lat: 33.6844, lon: 73.0479 },
                { name: "Pyongyang", lat: 39.0392, lon: 125.7625 }
            ], color: this.colors.allianceNetworks.china },
            
            // Abraham Accords
            { name: "Abraham Accords", members: [
                { name: "Jerusalem", lat: 31.7683, lon: 35.2137 },
                { name: "Abu Dhabi", lat: 24.4539, lon: 54.3773 },
                { name: "Manama", lat: 26.2285, lon: 50.5860 }
            ], color: this.colors.allianceNetworks.neutral }
        ];

        alliances.forEach(alliance => {
            // Create connection lines between alliance members
            for (let i = 0; i < alliance.members.length; i++) {
                for (let j = i + 1; j < alliance.members.length; j++) {
                    const line = this.createConnectionLine(
                        alliance.members[i].lat, alliance.members[i].lon,
                        alliance.members[j].lat, alliance.members[j].lon,
                        alliance.color,
                        true // animated flow
                    );
                    line.userData = { layer: 'allianceNetworks', alliance: alliance.name };
                    this.layers.allianceNetworks.connections.push(line);
                    this.scene.add(line);
                }
            }
        });
    }

    // Layer 6: Trade Routes (oil, shipping lanes, pipelines)
    loadTradeRoutes() {
        const routes = [
            // Major shipping lanes
            { name: "Suez Canal", points: [
                { lat: 31.2653, lon: 32.3019 },
                { lat: 29.9211, lon: 32.5498 }
            ], type: "shipping" },
            { name: "Strait of Hormuz", points: [
                { lat: 26.5667, lon: 56.2500 },
                { lat: 25.3000, lon: 57.0000 }
            ], type: "shipping" },
            { name: "Strait of Malacca", points: [
                { lat: 1.4300, lon: 102.8900 },
                { lat: 5.5500, lon: 95.3200 }
            ], type: "shipping" },
            
            // Oil pipelines
            { name: "Nord Stream", points: [
                { lat: 60.1695, lon: 29.7066 }, // Russia
                { lat: 54.0887, lon: 12.1355 }  // Germany
            ], type: "pipeline" },
            { name: "Druzhba Pipeline", points: [
                { lat: 55.0415, lon: 82.9346 }, // Russia
                { lat: 52.2297, lon: 21.0122 }  // Poland
            ], type: "pipeline" }
        ];

        routes.forEach(route => {
            for (let i = 0; i < route.points.length - 1; i++) {
                const line = this.createConnectionLine(
                    route.points[i].lat, route.points[i].lon,
                    route.points[i + 1].lat, route.points[i + 1].lon,
                    this.colors.tradeRoutes,
                    true // animated flow for trade
                );
                line.userData = { layer: 'tradeRoutes', route: route.name, type: route.type };
                this.layers.tradeRoutes.connections.push(line);
                this.scene.add(line);
            }
        });
    }

    // Layer 7: Early Warning Indicators (real-time alerts)
    loadEarlyWarning() {
        const alerts = [
            { name: "Taiwan Strait Tension", lat: 25.0330, lon: 121.5654, level: "high" },
            { name: "Korea DMZ Activity", lat: 38.0000, lon: 127.0000, level: "medium" },
            { name: "Baltic Sea NATO Activity", lat: 59.4370, lon: 24.7536, level: "medium" },
            { name: "Persian Gulf Monitoring", lat: 26.0667, lon: 50.5577, level: "high" }
        ];

        alerts.forEach(alert => {
            const sprite = this.createFlashingMarker(
                alert.lat, alert.lon,
                this.colors.earlyWarning,
                'star',
                0.7
            );
            sprite.userData = { layer: 'earlyWarning', alert };
            this.layers.earlyWarning.sprites.push(sprite);
            this.scene.add(sprite);
        });
    }

    // ===== Marker Creation Helpers =====

    createMarker(lat, lon, color, shape, size) {
        const pos = this.latLonToVector3(lat, lon, 1.02);
        const canvas = this.createIconCanvas(shape, color, size);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 1.0 });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(pos);
        sprite.scale.set(size, size, 1);
        return sprite;
    }

    createPulsingMarker(lat, lon, color, shape, size) {
        const sprite = this.createMarker(lat, lon, color, shape, size);
        sprite.userData.pulsing = true;
        sprite.userData.baseScale = size;
        return sprite;
    }

    createFlashingMarker(lat, lon, color, shape, size) {
        const sprite = this.createMarker(lat, lon, color, shape, size);
        sprite.userData.flashing = true;
        return sprite;
    }

    createConnectionLine(lat1, lon1, lat2, lon2, color, animated = false) {
        const p1 = this.latLonToVector3(lat1, lon1, 1.01);
        const p2 = this.latLonToVector3(lat2, lon2, 1.01);
        
        // Create curved line via quadratic bezier
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const distance = p1.distanceTo(p2);
        midPoint.multiplyScalar(1 + distance * 0.15); // Lift curve above globe
        
        const curve = new THREE.QuadraticBezierCurve3(p1, midPoint, p2);
        const points = curve.getPoints(50);
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        const material = new THREE.LineBasicMaterial({ 
            color, 
            transparent: true, 
            opacity: 0.6,
            linewidth: 2
        });
        
        const line = new THREE.Line(geometry, material);
        
        if (animated) {
            line.userData.animated = true;
            line.userData.curve = curve;
            this.createFlowParticles(curve, color);
        }
        
        return line;
    }

    createFlowParticles(curve, color) {
        const particleCount = 8;
        const positions = new Float32Array(particleCount * 3);
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color,
            size: 0.04,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(geometry, material);
        particles.userData.curve = curve;
        particles.userData.offsets = Array.from({ length: particleCount }, (_, i) => i / particleCount);
        
        this.scene.add(particles);
        this.flowParticles.set(curve, particles);
    }

    createIconCanvas(shape, color, size) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const cx = 32, cy = 32, r = 24;
        
        ctx.beginPath();
        switch (shape) {
            case 'circle':
                ctx.arc(cx, cy, r, 0, Math.PI * 2);
                break;
            case 'square':
                ctx.rect(cx - r, cy - r, r * 2, r * 2);
                break;
            case 'triangle':
                ctx.moveTo(cx, cy - r);
                ctx.lineTo(cx + r, cy + r);
                ctx.lineTo(cx - r, cy + r);
                ctx.closePath();
                break;
            case 'hexagon':
                for (let i = 0; i < 6; i++) {
                    const angle = (Math.PI / 3) * i;
                    const x = cx + r * Math.cos(angle);
                    const y = cy + r * Math.sin(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
            case 'star':
                for (let i = 0; i < 10; i++) {
                    const angle = (Math.PI / 5) * i;
                    const radius = i % 2 === 0 ? r : r * 0.4;
                    const x = cx + radius * Math.sin(angle);
                    const y = cy - radius * Math.cos(angle);
                    if (i === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.closePath();
                break;
        }
        
        ctx.fill();
        ctx.stroke();
        
        return canvas;
    }

    latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    // ===== Layer Control =====

    toggleLayer(layerName, enabled) {
        if (!this.layers[layerName]) return;
        
        this.layers[layerName].enabled = enabled;
        const targetOpacity = enabled ? this.layers[layerName].opacity : 0;
        
        // Fade sprites
        this.layers[layerName].sprites.forEach(sprite => {
            this.animateOpacity(sprite.material, targetOpacity);
        });
        
        // Fade connections
        this.layers[layerName].connections.forEach(line => {
            this.animateOpacity(line.material, targetOpacity);
        });
    }

    setLayerOpacity(layerName, opacity) {
        if (!this.layers[layerName]) return;
        
        this.layers[layerName].opacity = opacity;
        
        if (this.layers[layerName].enabled) {
            this.layers[layerName].sprites.forEach(sprite => {
                sprite.material.opacity = opacity;
            });
            
            this.layers[layerName].connections.forEach(line => {
                line.material.opacity = opacity * 0.6; // Connections slightly more transparent
            });
        }
    }

    animateOpacity(material, targetOpacity, duration = 300) {
        const startOpacity = material.opacity;
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            material.opacity = startOpacity + (targetOpacity - startOpacity) * progress;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        animate();
    }

    // ===== Animation Loop =====

    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // Pulse active conflicts
        this.layers.activeConflicts.sprites.forEach(sprite => {
            if (sprite.userData.pulsing) {
                const scale = sprite.userData.baseScale * (1 + 0.2 * Math.sin(this.animationTime * 3));
                sprite.scale.set(scale, scale, 1);
            }
        });
        
        // Flash early warning indicators
        this.layers.earlyWarning.sprites.forEach(sprite => {
            if (sprite.userData.flashing) {
                sprite.material.opacity = this.layers.earlyWarning.opacity * (0.4 + 0.6 * Math.abs(Math.sin(this.animationTime * 2)));
            }
        });
        
        // Animate flow particles along trade routes and alliances
        this.flowParticles.forEach((particles, curve) => {
            const positions = particles.geometry.attributes.position.array;
            particles.userData.offsets.forEach((offset, i) => {
                const t = (this.animationTime * 0.1 + offset) % 1;
                const point = curve.getPoint(t);
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = point.z;
            });
            particles.geometry.attributes.position.needsUpdate = true;
        });
    }

    // ===== Search & Filter =====

    searchLayer(layerName, query) {
        if (!this.layers[layerName]) return [];
        
        const results = [];
        const lowerQuery = query.toLowerCase();
        
        this.layers[layerName].sprites.forEach(sprite => {
            const data = sprite.userData;
            let match = false;
            
            if (data.crisis && data.crisis.name.toLowerCase().includes(lowerQuery)) match = true;
            if (data.facility && data.facility.name.toLowerCase().includes(lowerQuery)) match = true;
            if (data.asset && data.asset.name.toLowerCase().includes(lowerQuery)) match = true;
            if (data.alert && data.alert.name.toLowerCase().includes(lowerQuery)) match = true;
            
            if (match) results.push(sprite);
        });
        
        return results;
    }

    highlightSprite(sprite) {
        // Temporarily boost size and add glow
        const originalScale = sprite.scale.x;
        sprite.scale.multiplyScalar(1.5);
        
        setTimeout(() => {
            sprite.scale.set(originalScale, originalScale, 1);
        }, 1000);
    }

    // ===== Cleanup =====

    dispose() {
        Object.values(this.layers).forEach(layer => {
            layer.sprites.forEach(sprite => {
                if (sprite.material.map) sprite.material.map.dispose();
                sprite.material.dispose();
                sprite.geometry.dispose();
                this.scene.remove(sprite);
            });
            
            layer.connections.forEach(line => {
                line.material.dispose();
                line.geometry.dispose();
                this.scene.remove(line);
            });
        });
        
        this.flowParticles.forEach(particles => {
            particles.material.dispose();
            particles.geometry.dispose();
            this.scene.remove(particles);
        });
        this.flowParticles.clear();
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLayersManager;
}
