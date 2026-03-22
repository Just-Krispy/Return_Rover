/**
 * Time Slider System - Historical Playback (1900-2026)
 * Interactive timeline scrubber with animated history
 */

class TimeSlider {
    constructor(scene, camera, dataLayersManager) {
        this.scene = scene;
        this.camera = camera;
        this.dataLayers = dataLayersManager;
        
        // Time range
        this.minYear = 1900;
        this.maxYear = 2026;
        this.currentYear = 2026; // Start at present
        
        // Playback state
        this.isPlaying = false;
        this.playbackSpeed = 1; // 1x, 2x, 5x, 10x
        this.playbackDuration = 60000; // 60 seconds for full timeline at 1x
        this.lastFrameTime = 0;
        
        // UI elements (will be created)
        this.container = null;
        this.slider = null;
        this.dateLabel = null;
        this.playButton = null;
        this.speedButton = null;
        
        // Key events for tick marks
        this.keyEvents = [
            { year: 1914, label: "WWI", color: "#f87171" },
            { year: 1918, label: "WWI Ends", color: "#fbbf24" },
            { year: 1939, label: "WWII", color: "#f87171" },
            { year: 1945, label: "WWII Ends", color: "#fbbf24" },
            { year: 1949, label: "NATO", color: "#3b82f6" },
            { year: 1955, label: "Warsaw Pact", color: "#dc2626" },
            { year: 1962, label: "Cuban Crisis", color: "#f87171" },
            { year: 1989, label: "Berlin Wall", color: "#22c55e" },
            { year: 1991, label: "USSR Collapse", color: "#22c55e" },
            { year: 2001, label: "9/11", color: "#f87171" },
            { year: 2022, label: "Ukraine War", color: "#f87171" }
        ];
        
        // Alliance timeline data
        this.alliances = [
            { name: "NATO", startYear: 1949, endYear: 2026, color: "#3b82f6" },
            { name: "Warsaw Pact", startYear: 1955, endYear: 1991, color: "#dc2626" },
            { name: "SEATO", startYear: 1954, endYear: 1977, color: "#8b5cf6" },
            { name: "CENTO", startYear: 1955, endYear: 1979, color: "#f97316" }
        ];
        
        // Initialize UI
        this.createUI();
        this.attachEventListeners();
        this.updateVisibility();
    }

    createUI() {
        // Main container
        this.container = document.createElement('div');
        this.container.id = 'time-slider-container';
        this.container.className = 'time-slider-container';
        
        // Timeline bar wrapper
        const timelineWrapper = document.createElement('div');
        timelineWrapper.className = 'timeline-wrapper';
        
        // Key events tick marks
        const ticksContainer = document.createElement('div');
        ticksContainer.className = 'timeline-ticks';
        
        this.keyEvents.forEach(event => {
            const tick = document.createElement('div');
            tick.className = 'timeline-tick';
            const position = ((event.year - this.minYear) / (this.maxYear - this.minYear)) * 100;
            tick.style.left = `${position}%`;
            tick.style.borderColor = event.color;
            tick.title = `${event.year}: ${event.label}`;
            ticksContainer.appendChild(tick);
        });
        
        // Progress bar (color-coded eras)
        const progressBar = document.createElement('div');
        progressBar.className = 'timeline-progress';
        this.progressBar = progressBar;
        
        // Era backgrounds (WWI, Interwar, WWII, Cold War, Post-Cold War, Modern)
        const eras = [
            { start: 1900, end: 1918, color: 'rgba(248, 113, 113, 0.2)', label: 'WWI Era' },
            { start: 1918, end: 1939, color: 'rgba(251, 191, 36, 0.2)', label: 'Interwar Period' },
            { start: 1939, end: 1945, color: 'rgba(220, 38, 38, 0.3)', label: 'WWII' },
            { start: 1945, end: 1991, color: 'rgba(139, 92, 246, 0.2)', label: 'Cold War' },
            { start: 1991, end: 2001, color: 'rgba(34, 197, 94, 0.2)', label: 'Post-Cold War' },
            { start: 2001, end: 2026, color: 'rgba(249, 115, 22, 0.2)', label: 'War on Terror' }
        ];
        
        const eraContainer = document.createElement('div');
        eraContainer.className = 'timeline-eras';
        
        eras.forEach(era => {
            const eraDiv = document.createElement('div');
            eraDiv.className = 'timeline-era';
            const startPos = ((era.start - this.minYear) / (this.maxYear - this.minYear)) * 100;
            const width = ((era.end - era.start) / (this.maxYear - this.minYear)) * 100;
            eraDiv.style.left = `${startPos}%`;
            eraDiv.style.width = `${width}%`;
            eraDiv.style.background = era.color;
            eraDiv.title = era.label;
            eraContainer.appendChild(eraDiv);
        });
        
        // Slider input
        this.slider = document.createElement('input');
        this.slider.type = 'range';
        this.slider.min = this.minYear;
        this.slider.max = this.maxYear;
        this.slider.value = this.currentYear;
        this.slider.step = 1;
        this.slider.className = 'timeline-slider';
        
        // Date label (follows cursor)
        this.dateLabel = document.createElement('div');
        this.dateLabel.className = 'timeline-date-label';
        this.dateLabel.textContent = this.currentYear;
        
        // Year markers (every 10 years)
        const markersContainer = document.createElement('div');
        markersContainer.className = 'timeline-markers';
        
        for (let year = 1900; year <= 2030; year += 10) {
            const marker = document.createElement('div');
            marker.className = 'timeline-marker';
            const position = ((year - this.minYear) / (this.maxYear - this.minYear)) * 100;
            marker.style.left = `${position}%`;
            marker.textContent = year;
            markersContainer.appendChild(marker);
        }
        
        // Assemble timeline
        timelineWrapper.appendChild(eraContainer);
        timelineWrapper.appendChild(ticksContainer);
        timelineWrapper.appendChild(progressBar);
        timelineWrapper.appendChild(this.slider);
        timelineWrapper.appendChild(this.dateLabel);
        timelineWrapper.appendChild(markersContainer);
        
        // Controls
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'timeline-controls';
        
        // Play/Pause button
        this.playButton = document.createElement('button');
        this.playButton.className = 'timeline-btn timeline-play-btn';
        this.playButton.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
        `;
        this.playButton.title = 'Play (Space)';
        
        // Speed control
        this.speedButton = document.createElement('button');
        this.speedButton.className = 'timeline-btn timeline-speed-btn';
        this.speedButton.textContent = `${this.playbackSpeed}x`;
        this.speedButton.title = 'Playback Speed';
        
        // Step backward
        const stepBackBtn = document.createElement('button');
        stepBackBtn.className = 'timeline-btn timeline-step-btn';
        stepBackBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        `;
        stepBackBtn.title = 'Step Backward (←)';
        stepBackBtn.onclick = () => this.stepYear(-1);
        
        // Step forward
        const stepFwdBtn = document.createElement('button');
        stepFwdBtn.className = 'timeline-btn timeline-step-btn';
        stepFwdBtn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        `;
        stepFwdBtn.title = 'Step Forward (→)';
        stepFwdBtn.onclick = () => this.stepYear(1);
        
        controlsContainer.appendChild(stepBackBtn);
        controlsContainer.appendChild(this.playButton);
        controlsContainer.appendChild(this.speedButton);
        controlsContainer.appendChild(stepFwdBtn);
        
        // Assemble container
        this.container.appendChild(controlsContainer);
        this.container.appendChild(timelineWrapper);
        
        document.body.appendChild(this.container);
    }

    attachEventListeners() {
        // Slider change
        this.slider.addEventListener('input', (e) => {
            this.currentYear = parseInt(e.target.value);
            this.updateDateLabel();
            this.updateVisibility();
            this.updateProgress();
        });
        
        // Slider hover (show date)
        this.slider.addEventListener('mousemove', (e) => {
            const rect = this.slider.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            const year = Math.round(this.minYear + pos * (this.maxYear - this.minYear));
            this.dateLabel.textContent = year;
            this.dateLabel.style.left = `${e.clientX - rect.left}px`;
            this.dateLabel.style.opacity = '1';
        });
        
        this.slider.addEventListener('mouseleave', () => {
            this.dateLabel.textContent = this.currentYear;
            this.updateDateLabelPosition();
        });
        
        // Play/Pause button
        this.playButton.addEventListener('click', () => {
            this.togglePlayback();
        });
        
        // Speed button
        this.speedButton.addEventListener('click', () => {
            this.cycleSpeed();
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Only handle if not typing in an input
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
            
            switch(e.key) {
                case ' ': // Space = play/pause
                    e.preventDefault();
                    this.togglePlayback();
                    break;
                case 'ArrowLeft': // Left = step back
                    e.preventDefault();
                    this.stepYear(-1);
                    break;
                case 'ArrowRight': // Right = step forward
                    e.preventDefault();
                    this.stepYear(1);
                    break;
            }
        });
    }

    updateDateLabel() {
        this.dateLabel.textContent = this.currentYear;
        this.updateDateLabelPosition();
    }

    updateDateLabelPosition() {
        const position = ((this.currentYear - this.minYear) / (this.maxYear - this.minYear)) * 100;
        const rect = this.slider.getBoundingClientRect();
        this.dateLabel.style.left = `${rect.width * (position / 100)}px`;
    }

    updateProgress() {
        const position = ((this.currentYear - this.minYear) / (this.maxYear - this.minYear)) * 100;
        this.progressBar.style.width = `${position}%`;
    }

    updateVisibility() {
        if (!this.dataLayers) return;
        
        // Update historical crises visibility
        if (this.dataLayers.layers.historicalCrises) {
            this.dataLayers.layers.historicalCrises.sprites.forEach(sprite => {
                if (sprite.userData && sprite.userData.crisis) {
                    const crisis = sprite.userData.crisis;
                    const shouldShow = crisis.year <= this.currentYear;
                    
                    // Smooth fade in/out
                    if (shouldShow && sprite.material.opacity < 1.0) {
                        sprite.material.opacity = Math.min(1.0, sprite.material.opacity + 0.05);
                        sprite.visible = true;
                    } else if (!shouldShow && sprite.material.opacity > 0) {
                        sprite.material.opacity = Math.max(0, sprite.material.opacity - 0.05);
                        if (sprite.material.opacity === 0) sprite.visible = false;
                    }
                }
            });
        }
        
        // Update alliance networks based on year
        this.updateAllianceVisibility();
    }

    updateAllianceVisibility() {
        // This would integrate with the alliance network layer
        // Show/hide alliance connections based on formation/dissolution dates
        const activeAlliances = this.alliances.filter(
            a => this.currentYear >= a.startYear && this.currentYear <= a.endYear
        );
        
        // Store active alliances for rendering
        this.activeAlliances = activeAlliances;
        
        // Trigger alliance layer update if it exists
        if (this.dataLayers && typeof this.dataLayers.updateAlliancesForYear === 'function') {
            this.dataLayers.updateAlliancesForYear(this.currentYear);
        }
    }

    togglePlayback() {
        this.isPlaying = !this.isPlaying;
        
        if (this.isPlaying) {
            this.playButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                </svg>
            `;
            this.playButton.title = 'Pause (Space)';
            this.lastFrameTime = Date.now();
            this.playbackLoop();
        } else {
            this.playButton.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
            `;
            this.playButton.title = 'Play (Space)';
        }
    }

    playbackLoop() {
        if (!this.isPlaying) return;
        
        const now = Date.now();
        const deltaTime = now - this.lastFrameTime;
        this.lastFrameTime = now;
        
        // Calculate year increment based on speed
        const yearsPerSecond = ((this.maxYear - this.minYear) / this.playbackDuration) * 1000 * this.playbackSpeed;
        const yearIncrement = (yearsPerSecond * deltaTime) / 1000;
        
        this.currentYear += yearIncrement;
        
        // Loop back to start if we reach the end
        if (this.currentYear >= this.maxYear) {
            this.currentYear = this.minYear;
        }
        
        this.slider.value = Math.round(this.currentYear);
        this.updateDateLabel();
        this.updateVisibility();
        this.updateProgress();
        
        requestAnimationFrame(() => this.playbackLoop());
    }

    stepYear(direction) {
        this.currentYear = Math.max(this.minYear, Math.min(this.maxYear, this.currentYear + direction));
        this.slider.value = this.currentYear;
        this.updateDateLabel();
        this.updateVisibility();
        this.updateProgress();
    }

    cycleSpeed() {
        const speeds = [1, 2, 5, 10];
        const currentIndex = speeds.indexOf(this.playbackSpeed);
        this.playbackSpeed = speeds[(currentIndex + 1) % speeds.length];
        this.speedButton.textContent = `${this.playbackSpeed}x`;
    }

    // Animation update (call from main render loop)
    update() {
        // Smooth opacity transitions
        this.updateVisibility();
    }

    // Get current active events for display
    getActiveEvents() {
        if (!this.dataLayers || !this.dataLayers.layers.historicalCrises) return [];
        
        return this.dataLayers.layers.historicalCrises.sprites
            .filter(s => s.userData && s.userData.crisis && s.userData.crisis.year <= this.currentYear)
            .map(s => s.userData.crisis)
            .sort((a, b) => b.year - a.year)
            .slice(0, 5); // Top 5 most recent
    }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TimeSlider;
}
