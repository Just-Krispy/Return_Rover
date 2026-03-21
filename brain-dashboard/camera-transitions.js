/**
 * camera-transitions.js
 * Cinematic camera transitions for Second Brain globe
 * Google Earth-style flight with arc paths, easing, banking, and momentum
 */

class CinematicCamera {
    constructor(camera, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Current orbital state
        this.theta = 0;
        this.phi = Math.PI * 0.35;
        this.distance = 280;
        this.lookAt = new THREE.Vector3(0, 0, 0);
        
        // Target state
        this.targetTheta = this.theta;
        this.targetPhi = this.phi;
        this.targetDistance = this.distance;
        this.targetLookAt = new THREE.Vector3(0, 0, 0);
        
        // Transition state
        this.isTransitioning = false;
        this.transitionProgress = 0;
        this.transitionDuration = 0;
        this.transitionStartTime = 0;
        
        // Start positions for current transition
        this.startTheta = 0;
        this.startPhi = 0;
        this.startDistance = 0;
        this.startLookAt = new THREE.Vector3();
        
        // Camera banking/tilt
        this.bankAngle = 0;
        this.targetBankAngle = 0;
        
        // Auto-rotate
        this.autoRotate = true;
        this.autoRotateSpeed = 0.0015;
    }
    
    /**
     * Calculate optimal flight duration based on distance
     * Closer targets = faster transitions, distant = slower
     */
    calculateDuration(startPos, endPos, startLookAt, endLookAt) {
        // Calculate 3D distance between camera start and end positions
        const dx = endPos.x - startPos.x;
        const dy = endPos.y - startPos.y;
        const dz = endPos.z - startPos.z;
        const positionDistance = Math.sqrt(dx*dx + dy*dy + dz*dz);
        
        // Calculate lookAt distance
        const lookAtDist = startLookAt.distanceTo(endLookAt);
        
        // Use whichever is larger as the primary distance metric
        const distance = Math.max(positionDistance, lookAtDist);
        
        // Duration formula: 1-3 seconds based on distance
        // Short hops (< 50 units) = 1s
        // Medium jumps (50-200 units) = 1.5-2s
        // Long flights (> 200 units) = 2-3s
        const minDuration = 1000;   // 1 second
        const maxDuration = 3000;   // 3 seconds
        const normalizedDist = Math.min(distance / 300, 1); // Normalize to 0-1
        
        return minDuration + (maxDuration - minDuration) * normalizedDist;
    }
    
    /**
     * Ease-in-out cubic function
     * Slow at start, fast in middle, slow at end
     */
    easeInOutCubic(t) {
        return t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }
    
    /**
     * Bezier curve interpolation for arc path (not straight line)
     */
    bezierArc(start, end, t) {
        // Calculate control point above the midpoint for arc effect
        const mid = new THREE.Vector3().lerpVectors(start, end, 0.5);
        const distance = start.distanceTo(end);
        
        // Pull back for long distances (Google Earth style)
        const arcHeight = Math.min(distance * 0.3, 150);
        mid.y += arcHeight;
        
        // Quadratic Bezier: B(t) = (1-t)^2*P0 + 2(1-t)t*P1 + t^2*P2
        const oneMinusT = 1 - t;
        const result = new THREE.Vector3();
        
        result.x = oneMinusT * oneMinusT * start.x + 
                   2 * oneMinusT * t * mid.x + 
                   t * t * end.x;
        
        result.y = oneMinusT * oneMinusT * start.y + 
                   2 * oneMinusT * t * mid.y + 
                   t * t * end.y;
        
        result.z = oneMinusT * oneMinusT * start.z + 
                   2 * oneMinusT * t * mid.z + 
                   t * t * end.z;
        
        return result;
    }
    
    /**
     * Spherical linear interpolation for smooth rotation
     */
    slerpAngles(startTheta, startPhi, endTheta, endPhi, t) {
        // Simple slerp for angles — handle wrap-around
        let deltaTheta = endTheta - startTheta;
        
        // Choose shortest path around the circle
        if (deltaTheta > Math.PI) deltaTheta -= Math.PI * 2;
        if (deltaTheta < -Math.PI) deltaTheta += Math.PI * 2;
        
        return {
            theta: startTheta + deltaTheta * t,
            phi: startPhi + (endPhi - startPhi) * t
        };
    }
    
    /**
     * Calculate camera banking based on turn rate
     * Simulates airplane-style tilt during turns
     */
    calculateBanking(deltaThetaDelta) {
        // More angular change = more bank
        const maxBank = Math.PI / 12; // 15 degrees max
        return THREE.MathUtils.clamp(deltaThetaDelta * 100, -maxBank, maxBank);
    }
    
    /**
     * Start a cinematic transition to target
     */
    flyTo(theta, phi, distance, lookAt, immediate = false) {
        if (immediate) {
            // Instant jump (no animation)
            this.theta = theta;
            this.phi = phi;
            this.distance = distance;
            this.lookAt.copy(lookAt);
            this.targetTheta = theta;
            this.targetPhi = phi;
            this.targetDistance = distance;
            this.targetLookAt.copy(lookAt);
            this.isTransitioning = false;
            return;
        }
        
        // Calculate current camera position in world space
        const currentPos = this.calculateCameraPosition(
            this.theta, 
            this.phi, 
            this.distance, 
            this.lookAt
        );
        
        // Calculate target camera position
        const targetPos = this.calculateCameraPosition(
            theta,
            phi,
            distance,
            lookAt
        );
        
        // Store start state
        this.startTheta = this.theta;
        this.startPhi = this.phi;
        this.startDistance = this.distance;
        this.startLookAt.copy(this.lookAt);
        
        // Store target state
        this.targetTheta = theta;
        this.targetPhi = phi;
        this.targetDistance = distance;
        this.targetLookAt.copy(lookAt);
        
        // Calculate optimal duration
        this.transitionDuration = this.calculateDuration(
            currentPos, 
            targetPos, 
            this.startLookAt, 
            this.targetLookAt
        );
        
        // Start transition
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionStartTime = performance.now();
        
        // Disable auto-rotate during transition
        this.autoRotate = false;
    }
    
    /**
     * Calculate camera world position from orbital parameters
     */
    calculateCameraPosition(theta, phi, dist, lookAt) {
        return new THREE.Vector3(
            lookAt.x + dist * Math.sin(phi) * Math.sin(theta),
            lookAt.y + dist * Math.cos(phi),
            lookAt.z + dist * Math.sin(phi) * Math.cos(theta)
        );
    }
    
    /**
     * Update camera state each frame
     */
    update() {
        if (this.isTransitioning) {
            // Calculate elapsed time and progress
            const now = performance.now();
            const elapsed = now - this.transitionStartTime;
            let rawProgress = Math.min(elapsed / this.transitionDuration, 1);
            
            // Apply easing
            const easedProgress = this.easeInOutCubic(rawProgress);
            this.transitionProgress = easedProgress;
            
            // Interpolate angles using slerp
            const angles = this.slerpAngles(
                this.startTheta,
                this.startPhi,
                this.targetTheta,
                this.targetPhi,
                easedProgress
            );
            
            this.theta = angles.theta;
            this.phi = angles.phi;
            
            // Smooth distance interpolation with zoom-out-zoom-in for long distances
            const distDiff = Math.abs(this.targetDistance - this.startDistance);
            const targetDistChange = this.targetDistance - this.startDistance;
            
            if (distDiff > 100) {
                // Long distance: zoom out in middle
                const zoomOutFactor = Math.sin(easedProgress * Math.PI) * Math.min(distDiff * 0.5, 200);
                this.distance = this.startDistance + targetDistChange * easedProgress + zoomOutFactor;
            } else {
                // Short distance: direct interpolation
                this.distance = this.startDistance + targetDistChange * easedProgress;
            }
            
            // Arc path for lookAt (Bezier curve)
            const startPos = this.startLookAt;
            const endPos = this.targetLookAt;
            
            // Use Bezier only if distance is significant
            if (startPos.distanceTo(endPos) > 10) {
                const arcPoint = this.bezierArc(startPos, endPos, easedProgress);
                this.lookAt.copy(arcPoint);
            } else {
                this.lookAt.lerpVectors(startPos, endPos, easedProgress);
            }
            
            // Calculate banking based on turn rate
            const deltaTheta = this.theta - this.startTheta;
            const turnRate = deltaTheta / (this.transitionDuration / 1000); // radians per second
            this.targetBankAngle = this.calculateBanking(turnRate);
            
            // End transition
            if (rawProgress >= 1) {
                this.isTransitioning = false;
                this.theta = this.targetTheta;
                this.phi = this.targetPhi;
                this.distance = this.targetDistance;
                this.lookAt.copy(this.targetLookAt);
                this.bankAngle = 0;
                this.targetBankAngle = 0;
                // Re-enable auto-rotate after landing
                // this.autoRotate = true; // Optional: auto-enable
            }
        } else if (this.autoRotate) {
            // Auto-rotate when not transitioning
            this.theta += this.autoRotateSpeed;
            this.targetTheta = this.theta;
        }
        
        // Smooth banking interpolation
        this.bankAngle += (this.targetBankAngle - this.bankAngle) * 0.1;
        
        // Constrain phi to prevent camera flip
        this.phi = THREE.MathUtils.clamp(this.phi, 0.1, Math.PI - 0.1);
        this.distance = THREE.MathUtils.clamp(this.distance, 40, 800);
        
        // Update Three.js camera position
        this.camera.position.set(
            this.lookAt.x + this.distance * Math.sin(this.phi) * Math.sin(this.theta),
            this.lookAt.y + this.distance * Math.cos(this.phi),
            this.lookAt.z + this.distance * Math.sin(this.phi) * Math.cos(this.theta)
        );
        
        // Point camera at lookAt target
        this.camera.lookAt(this.lookAt);
        
        // Apply banking (tilt during turns)
        if (Math.abs(this.bankAngle) > 0.001) {
            this.camera.rotateZ(this.bankAngle);
        }
        
        this.camera.updateMatrixWorld();
    }
    
    /**
     * Handle mouse/touch drag
     */
    handleDrag(deltaX, deltaY) {
        this.targetTheta -= deltaX * 0.005;
        this.targetPhi += deltaY * 0.005;
        
        // Smooth interpolation for manual control
        this.theta += (this.targetTheta - this.theta) * 0.15;
        this.phi += (this.targetPhi - this.phi) * 0.15;
        
        this.autoRotate = false;
        this.isTransitioning = false; // Cancel active transition on manual control
    }
    
    /**
     * Handle zoom (scroll wheel)
     */
    handleZoom(delta) {
        this.targetDistance *= delta > 0 ? 1.12 : 0.88;
        this.distance += (this.targetDistance - this.distance) * 0.15;
        this.isTransitioning = false; // Cancel active transition on manual zoom
    }
    
    /**
     * Reset camera to default position
     */
    reset(immediate = false) {
        this.flyTo(0, Math.PI * 0.35, 280, new THREE.Vector3(0, 0, 0), immediate);
        this.autoRotate = true;
    }
    
    /**
     * Toggle auto-rotate
     */
    toggleAutoRotate() {
        this.autoRotate = !this.autoRotate;
        return this.autoRotate;
    }
}

// Export for browser
if (typeof window !== 'undefined') {
    window.CinematicCamera = CinematicCamera;
}
