/**
 * Connection Visualization System
 * Reveals hidden relationships between historical events and entities
 * 
 * Features:
 * - 5 connection types (causal, alliance, influence, pattern, echo)
 * - Animated flow particles along connection lines
 * - Interactive hover/click behaviors
 * - Performance-optimized rendering
 * - Mobile touch support
 */

class ConnectionsSystem {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        // Connection registry by type
        this.connectionTypes = {
            causal: { 
                color: 0xa78bfa,      // purple
                opacity: 0.6,
                thickness: 2.0,
                dashPattern: null,
                glow: false,
                connections: [],
                visible: true
            },
            alliance: { 
                color: 0x60a5fa,      // blue
                opacity: 0.7,
                thickness: 2.5,
                dashPattern: null,
                glow: false,
                connections: [],
                visible: true
            },
            influence: { 
                color: 0xf87171,      // red
                opacity: 0.65,
                thickness: 2.2,
                dashPattern: null,
                glow: false,
                connections: [],
                visible: true
            },
            pattern: { 
                color: 0xfbbf24,      // orange/amber
                opacity: 0.5,
                thickness: 1.8,
                dashPattern: [10, 5],  // dashed
                glow: false,
                connections: [],
                visible: true
            },
            echo: { 
                color: 0x22d3ee,      // cyan
                opacity: 0.8,
                thickness: 3.0,
                dashPattern: null,
                glow: true,           // glowing effect
                connections: [],
                visible: true
            }
        };

        // Particle system for flow animation
        this.particleSystems = new Map();
        this.animationTime = 0;
        
        // Interaction state
        this.hoveredConnection = null;
        this.selectedNode = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        // Performance optimization
        this.frustum = new THREE.Frustum();
        this.cameraViewProjectionMatrix = new THREE.Matrix4();
        
        // UI state
        this.allConnectionsVisible = true;
        
        this.initializeConnections();
        this.setupInteractions();
    }

    /**
     * Initialize all connection data
     */
    initializeConnections() {
        // CAUSAL LINKS - Direct cause-and-effect chains
        this.addConnection('causal', {
            id: 'versailles-hitler',
            from: { lat: 48.8566, lon: 2.3522, name: 'Treaty of Versailles' },
            to: { lat: 52.5200, lon: 13.4050, name: 'Hitler Rise to Power' },
            description: 'Harsh reparations → economic collapse → political extremism',
            strength: 0.9
        });

        this.addConnection('causal', {
            id: 'hitler-wwii',
            from: { lat: 52.5200, lon: 13.4050, name: 'Hitler Rise to Power' },
            to: { lat: 52.2297, lon: 21.0122, name: 'WWII Outbreak' },
            description: 'Nazi ideology → territorial expansion → global war',
            strength: 1.0
        });

        this.addConnection('causal', {
            id: 'wwii-coldwar',
            from: { lat: 52.2297, lon: 21.0122, name: 'WWII Outbreak' },
            to: { lat: 52.5200, lon: 13.4050, name: 'Berlin Wall' },
            description: 'Allied victory → Soviet-US tension → divided Europe',
            strength: 0.85
        });

        this.addConnection('causal', {
            id: 'iraq-isis',
            from: { lat: 33.3152, lon: 44.3661, name: 'Iraq Invasion 2003' },
            to: { lat: 36.3489, lon: 43.1450, name: 'ISIS Rise 2014' },
            description: 'State collapse → power vacuum → extremist takeover',
            strength: 0.8
        });

        // ALLIANCE NETWORKS - Geopolitical partnerships
        this.addConnection('alliance', {
            id: 'usa-israel',
            from: { lat: 38.9072, lon: -77.0369, name: 'USA (Washington DC)' },
            to: { lat: 31.7683, lon: 35.2137, name: 'Israel (Jerusalem)' },
            description: 'Strategic partnership: military aid, intelligence sharing, UN support',
            strength: 1.0
        });

        this.addConnection('alliance', {
            id: 'russia-iran',
            from: { lat: 55.7558, lon: 37.6173, name: 'Russia (Moscow)' },
            to: { lat: 35.6892, lon: 51.3890, name: 'Iran (Tehran)' },
            description: 'Arms trade, nuclear cooperation, Syria support',
            strength: 0.85
        });

        this.addConnection('alliance', {
            id: 'russia-china',
            from: { lat: 55.7558, lon: 37.6173, name: 'Russia (Moscow)' },
            to: { lat: 39.9042, lon: 116.4074, name: 'China (Beijing)' },
            description: 'Economic partnership, anti-Western alignment, SCO cooperation',
            strength: 0.75
        });

        this.addConnection('alliance', {
            id: 'nato-europe',
            from: { lat: 38.9072, lon: -77.0369, name: 'USA' },
            to: { lat: 50.8503, lon: 4.3517, name: 'NATO HQ (Brussels)' },
            description: 'Collective defense, Article 5 commitment, integrated command',
            strength: 0.95
        });

        this.addConnection('alliance', {
            id: 'abraham-accords',
            from: { lat: 31.7683, lon: 35.2137, name: 'Israel' },
            to: { lat: 24.4539, lon: 54.3773, name: 'UAE (Abu Dhabi)' },
            description: 'Normalization: diplomatic relations, economic ties, tech cooperation',
            strength: 0.7
        });

        // INFLUENCE FLOWS - Proxy relationships and support networks
        this.addConnection('influence', {
            id: 'iran-hezbollah',
            from: { lat: 35.6892, lon: 51.3890, name: 'Iran (Tehran)' },
            to: { lat: 33.8886, lon: 35.4955, name: 'Hezbollah (Beirut)' },
            description: 'Funding, weapons, training → 100k+ rockets aimed at Israel',
            strength: 0.95
        });

        this.addConnection('influence', {
            id: 'iran-hamas',
            from: { lat: 35.6892, lon: 51.3890, name: 'Iran (Tehran)' },
            to: { lat: 31.5, lon: 34.45, name: 'Hamas (Gaza)' },
            description: 'Financial support, weapons tech, strategic guidance',
            strength: 0.85
        });

        this.addConnection('influence', {
            id: 'iran-houthis',
            from: { lat: 35.6892, lon: 51.3890, name: 'Iran (Tehran)' },
            to: { lat: 15.3694, lon: 44.1910, name: 'Houthis (Yemen)' },
            description: 'Missiles, drones, naval warfare tech → Red Sea shipping attacks',
            strength: 0.8
        });

        this.addConnection('influence', {
            id: 'russia-wagner',
            from: { lat: 55.7558, lon: 37.6173, name: 'Russia (Moscow)' },
            to: { lat: 12.8628, lon: 24.9556, name: 'Wagner Group (Africa)' },
            description: 'Private military company: Syria, Libya, CAR, Mali operations',
            strength: 0.75
        });

        this.addConnection('influence', {
            id: 'china-belt-road',
            from: { lat: 39.9042, lon: 116.4074, name: 'China (Beijing)' },
            to: { lat: 24.8607, lon: 67.0011, name: 'Pakistan (Karachi Port)' },
            description: 'Belt & Road Initiative: infrastructure loans, economic leverage',
            strength: 0.7
        });

        // PATTERN THREADS - Historical parallels and recurring dynamics
        this.addConnection('pattern', {
            id: 'appeasement-1938-2013',
            from: { lat: 48.1351, lon: 11.5820, name: 'Munich Agreement 1938' },
            to: { lat: 33.5138, lon: 36.2765, name: 'Syria Red Line 2013' },
            description: 'Appeasement pattern: avoiding confrontation → emboldening aggressor',
            strength: 0.75
        });

        this.addConnection('pattern', {
            id: 'appeasement-2014',
            from: { lat: 33.5138, lon: 36.2765, name: 'Syria Red Line 2013' },
            to: { lat: 44.9519, lon: 34.1022, name: 'Crimea Annexation 2014' },
            description: 'Weak response → further territorial aggression',
            strength: 0.8
        });

        this.addConnection('pattern', {
            id: 'appeasement-2022',
            from: { lat: 44.9519, lon: 34.1022, name: 'Crimea Annexation 2014' },
            to: { lat: 50.4501, lon: 30.5234, name: 'Ukraine Invasion 2022' },
            description: 'No major consequences → full-scale invasion 8 years later',
            strength: 0.85
        });

        this.addConnection('pattern', {
            id: 'power-vacuum-iraq-syria',
            from: { lat: 33.3152, lon: 44.3661, name: 'Iraq Collapse 2003' },
            to: { lat: 33.5138, lon: 36.2765, name: 'Syria Collapse 2011' },
            description: 'State failure pattern: intervention → chaos → extremism',
            strength: 0.7
        });

        // HISTORICAL ECHOES - Multi-generational parallels (1914 → 1939 → 2026)
        this.addConnection('echo', {
            id: 'echo-1914-1939-a',
            from: { lat: 48.8566, lon: 2.3522, name: '1914: WWI Begins' },
            to: { lat: 52.2297, lon: 21.0122, name: '1939: WWII Begins' },
            description: 'Alliance chains → localized crisis → world war (25 year gap)',
            strength: 0.9
        });

        this.addConnection('echo', {
            id: 'echo-1939-2026',
            from: { lat: 52.2297, lon: 21.0122, name: '1939: WWII Begins' },
            to: { lat: 50.4501, lon: 30.5234, name: '2026: Ukraine/Taiwan?' },
            description: 'Appeasement → territorial expansion → major power war? (87 year echo)',
            strength: 0.85
        });

        this.addConnection('echo', {
            id: 'echo-1914-2026',
            from: { lat: 48.8566, lon: 2.3522, name: '1914: Alliance Cascade' },
            to: { lat: 38.9072, lon: -77.0369, name: '2026: NATO Article 5?' },
            description: 'Alliance obligations → unintended escalation → global conflict',
            strength: 0.8
        });

        this.addConnection('echo', {
            id: 'echo-pre-war-indicators',
            from: { lat: 52.5200, lon: 13.4050, name: '1936: Militarization' },
            to: { lat: 39.9042, lon: 116.4074, name: '2024: China Military Buildup' },
            description: 'Pre-war pattern: arms race, territorial claims, nationalism surge',
            strength: 0.75
        });
    }

    /**
     * Add a connection to the system
     */
    addConnection(type, data) {
        if (!this.connectionTypes[type]) {
            console.warn(`Unknown connection type: ${type}`);
            return;
        }

        const config = this.connectionTypes[type];
        
        // Convert lat/lon to 3D positions
        const startPos = this.latLonToVector3(data.from.lat, data.from.lon, 102);
        const endPos = this.latLonToVector3(data.to.lat, data.to.lon, 102);
        
        // Create curved path (lifted above globe surface)
        const curve = this.createCurvedPath(startPos, endPos, data.strength);
        
        // Create tube geometry for the connection line
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            64,                          // segments
            config.thickness * 0.15,     // radius (adjusted for thickness)
            8,                            // radial segments
            false                         // closed
        );

        // Create material
        const material = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: config.opacity,
            side: THREE.DoubleSide
        });

        // Add glow for echo connections
        if (config.glow) {
            material.emissive = new THREE.Color(config.color);
            material.emissiveIntensity = 0.4;
        }

        // Create mesh
        const tube = new THREE.Mesh(tubeGeometry, material);
        tube.userData = {
            connectionType: type,
            connectionId: data.id,
            from: data.from,
            to: data.to,
            description: data.description,
            strength: data.strength,
            curve: curve
        };

        // Handle dashed lines for patterns
        if (config.dashPattern) {
            // For dashed effect, use Line instead of Tube
            const points = curve.getPoints(100);
            const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const lineMaterial = new THREE.LineDashedMaterial({
                color: config.color,
                transparent: true,
                opacity: config.opacity,
                dashSize: config.dashPattern[0],
                gapSize: config.dashPattern[1],
                linewidth: config.thickness
            });
            const line = new THREE.Line(lineGeometry, lineMaterial);
            line.computeLineDistances();
            line.userData = tube.userData;
            config.connections.push(line);
            this.scene.add(line);
        } else {
            config.connections.push(tube);
            this.scene.add(tube);
        }

        // Create particle system for this connection
        this.createParticleSystem(type, data.id, curve, config.color);
    }

    /**
     * Create curved Bezier path between two points (lifted above globe)
     */
    createCurvedPath(start, end, strength = 0.8) {
        const midpoint = new THREE.Vector3()
            .addVectors(start, end)
            .multiplyScalar(0.5);
        
        // Lift curve above globe surface (higher for stronger connections)
        const liftHeight = 15 + (strength * 25);
        const controlPoint = midpoint.clone().normalize().multiplyScalar(100 + liftHeight);
        
        // Quadratic Bezier curve
        const curve = new THREE.QuadraticBezierCurve3(start, controlPoint, end);
        return curve;
    }

    /**
     * Create animated particle system for connection
     */
    createParticleSystem(type, connectionId, curve, color) {
        const particleCount = 8;
        const particles = [];
        
        const spriteMap = this.createCircleTexture(color);
        
        for (let i = 0; i < particleCount; i++) {
            const spriteMaterial = new THREE.SpriteMaterial({
                map: spriteMap,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.scale.set(1.5, 1.5, 1);
            
            // Stagger particles along the curve
            const t = i / particleCount;
            const position = curve.getPoint(t);
            sprite.position.copy(position);
            
            sprite.userData = {
                curve: curve,
                progress: t,
                speed: 0.002 + (Math.random() * 0.001), // varied speeds
                connectionType: type,
                connectionId: connectionId
            };
            
            particles.push(sprite);
            this.scene.add(sprite);
        }
        
        this.particleSystems.set(`${type}-${connectionId}`, particles);
    }

    /**
     * Create circular texture for particles (GPU-friendly)
     */
    createCircleTexture(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
        const colorObj = new THREE.Color(color);
        gradient.addColorStop(0, `rgba(${colorObj.r*255}, ${colorObj.g*255}, ${colorObj.b*255}, 1)`);
        gradient.addColorStop(0.5, `rgba(${colorObj.r*255}, ${colorObj.g*255}, ${colorObj.b*255}, 0.5)`);
        gradient.addColorStop(1, `rgba(${colorObj.r*255}, ${colorObj.g*255}, ${colorObj.b*255}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        return texture;
    }

    /**
     * Convert lat/lon to 3D position on sphere
     */
    latLonToVector3(lat, lon, radius = 100) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        
        const x = -radius * Math.sin(phi) * Math.cos(theta);
        const y = radius * Math.cos(phi);
        const z = radius * Math.sin(phi) * Math.sin(theta);
        
        return new THREE.Vector3(x, y, z);
    }

    /**
     * Animation loop - update particle positions
     */
    animate(deltaTime) {
        this.animationTime += deltaTime * 0.001;
        
        // Update all particle systems
        this.particleSystems.forEach((particles, key) => {
            const [type, id] = key.split('-');
            const config = this.connectionTypes[type];
            
            if (!config || !config.visible) {
                particles.forEach(p => p.visible = false);
                return;
            }
            
            particles.forEach(particle => {
                particle.visible = true;
                
                // Update progress along curve
                particle.userData.progress += particle.userData.speed;
                if (particle.userData.progress > 1) {
                    particle.userData.progress = 0;
                }
                
                // Get position on curve
                const position = particle.userData.curve.getPoint(particle.userData.progress);
                particle.position.copy(position);
                
                // Pulse opacity
                const pulseSpeed = 2.0;
                const pulse = Math.sin(this.animationTime * pulseSpeed + particle.userData.progress * Math.PI * 2);
                particle.material.opacity = 0.5 + (pulse * 0.3);
            });
        });

        // Performance: cull connections outside frustum
        this.updateFrustumCulling();
    }

    /**
     * Frustum culling for performance
     */
    updateFrustumCulling() {
        this.camera.updateMatrixWorld();
        this.cameraViewProjectionMatrix.multiplyMatrices(
            this.camera.projectionMatrix,
            this.camera.matrixWorldInverse
        );
        this.frustum.setFromProjectionMatrix(this.cameraViewProjectionMatrix);
        
        Object.values(this.connectionTypes).forEach(config => {
            config.connections.forEach(conn => {
                conn.visible = config.visible && this.frustum.intersectsObject(conn);
            });
        });
    }

    /**
     * Toggle connection type visibility
     */
    toggleConnectionType(type, visible = null) {
        if (!this.connectionTypes[type]) return;
        
        const config = this.connectionTypes[type];
        config.visible = visible !== null ? visible : !config.visible;
        
        // Update connection visibility
        config.connections.forEach(conn => {
            conn.visible = config.visible;
        });
        
        // Update particle visibility
        this.particleSystems.forEach((particles, key) => {
            if (key.startsWith(type)) {
                particles.forEach(p => p.visible = config.visible);
            }
        });
    }

    /**
     * Toggle all connections
     */
    toggleAllConnections() {
        this.allConnectionsVisible = !this.allConnectionsVisible;
        
        Object.keys(this.connectionTypes).forEach(type => {
            this.toggleConnectionType(type, this.allConnectionsVisible);
        });
    }

    /**
     * Highlight connections for a specific node
     */
    highlightNodeConnections(nodeName) {
        this.selectedNode = nodeName;
        
        Object.values(this.connectionTypes).forEach(config => {
            config.connections.forEach(conn => {
                const isConnected = 
                    conn.userData.from.name === nodeName || 
                    conn.userData.to.name === nodeName;
                
                if (isConnected) {
                    conn.material.opacity = config.opacity * 1.5;
                    if (conn.material.emissiveIntensity !== undefined) {
                        conn.material.emissiveIntensity = 0.8;
                    }
                } else {
                    conn.material.opacity = config.opacity * 0.3;
                }
            });
        });
    }

    /**
     * Clear node connection highlights
     */
    clearHighlights() {
        this.selectedNode = null;
        
        Object.values(this.connectionTypes).forEach(config => {
            config.connections.forEach(conn => {
                conn.material.opacity = config.opacity;
                if (conn.material.emissiveIntensity !== undefined) {
                    conn.material.emissiveIntensity = 0.4;
                }
            });
        });
    }

    /**
     * Setup mouse/touch interactions
     */
    setupInteractions() {
        // Mouse move for hover
        this.renderer.domElement.addEventListener('pointermove', (event) => {
            this.onPointerMove(event);
        });
        
        // Click for selection
        this.renderer.domElement.addEventListener('pointerdown', (event) => {
            this.onPointerDown(event);
        });
    }

    /**
     * Handle pointer move (hover)
     */
    onPointerMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Check for connection intersections
        let intersected = null;
        Object.values(this.connectionTypes).forEach(config => {
            if (!config.visible) return;
            
            const intersects = this.raycaster.intersectObjects(config.connections);
            if (intersects.length > 0) {
                intersected = intersects[0].object;
            }
        });
        
        // Update hover state
        if (intersected && intersected !== this.hoveredConnection) {
            this.hoveredConnection = intersected;
            this.showConnectionTooltip(intersected);
            document.body.style.cursor = 'pointer';
        } else if (!intersected && this.hoveredConnection) {
            this.hideConnectionTooltip();
            this.hoveredConnection = null;
            document.body.style.cursor = 'default';
        }
    }

    /**
     * Handle pointer down (click)
     */
    onPointerDown(event) {
        if (this.hoveredConnection) {
            const conn = this.hoveredConnection.userData;
            this.highlightConnectionNodes(conn.from.name, conn.to.name);
        }
    }

    /**
     * Highlight both nodes of a connection
     */
    highlightConnectionNodes(fromName, toName) {
        // Clear previous highlights
        this.clearHighlights();
        
        // Highlight the connection
        Object.values(this.connectionTypes).forEach(config => {
            config.connections.forEach(conn => {
                const isTarget = 
                    (conn.userData.from.name === fromName && conn.userData.to.name === toName) ||
                    (conn.userData.from.name === toName && conn.userData.to.name === fromName);
                
                if (isTarget) {
                    conn.material.opacity = config.opacity * 1.8;
                    if (conn.material.emissiveIntensity !== undefined) {
                        conn.material.emissiveIntensity = 1.0;
                    }
                } else {
                    conn.material.opacity = config.opacity * 0.2;
                }
            });
        });
        
        // TODO: Highlight actual node markers (integrate with data-layers.js markers)
        console.log(`Highlighted connection: ${fromName} → ${toName}`);
    }

    /**
     * Show tooltip for connection
     */
    showConnectionTooltip(connection) {
        const data = connection.userData;
        
        // Create or update tooltip
        let tooltip = document.getElementById('connection-tooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'connection-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: rgba(24, 24, 27, 0.95);
                border: 1px solid rgba(63, 63, 70, 0.8);
                border-radius: 8px;
                padding: 12px 16px;
                color: #fafafa;
                font-family: Inter, sans-serif;
                font-size: 13px;
                max-width: 300px;
                pointer-events: none;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                backdrop-filter: blur(10px);
            `;
            document.body.appendChild(tooltip);
        }
        
        const typeColors = {
            causal: '#a78bfa',
            alliance: '#60a5fa',
            influence: '#f87171',
            pattern: '#fbbf24',
            echo: '#22d3ee'
        };
        
        tooltip.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
                <div style="width: 12px; height: 12px; border-radius: 50%; background: ${typeColors[data.connectionType]};"></div>
                <strong style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #a1a1aa;">
                    ${data.connectionType}
                </strong>
            </div>
            <div style="margin-bottom: 4px; color: #fafafa;">
                ${data.from.name} → ${data.to.name}
            </div>
            <div style="color: #a1a1aa; font-size: 12px;">
                ${data.description}
            </div>
        `;
        
        // Position tooltip near cursor
        tooltip.style.left = `${this.mouse.x * 100 + 20}px`;
        tooltip.style.top = `${this.mouse.y * 100 + 20}px`;
        tooltip.style.display = 'block';
    }

    /**
     * Hide tooltip
     */
    hideConnectionTooltip() {
        const tooltip = document.getElementById('connection-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }

    /**
     * Cleanup
     */
    dispose() {
        // Remove all connections
        Object.values(this.connectionTypes).forEach(config => {
            config.connections.forEach(conn => {
                this.scene.remove(conn);
                conn.geometry.dispose();
                conn.material.dispose();
            });
        });
        
        // Remove all particles
        this.particleSystems.forEach(particles => {
            particles.forEach(p => {
                this.scene.remove(p);
                p.material.map.dispose();
                p.material.dispose();
            });
        });
        
        // Remove tooltip
        const tooltip = document.getElementById('connection-tooltip');
        if (tooltip) tooltip.remove();
    }
}
