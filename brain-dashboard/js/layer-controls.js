/**
 * Layer Controls UI - Sidebar toggle panel with opacity sliders
 */

class LayerControlsUI {
    constructor(layersManager) {
        this.layersManager = layersManager;
        this.isOpen = true;
        this.init();
    }

    init() {
        // Create sidebar container
        const sidebar = document.createElement('div');
        sidebar.id = 'layerControlsSidebar';
        sidebar.className = 'layer-controls-sidebar open';
        sidebar.innerHTML = this.buildHTML();
        document.body.appendChild(sidebar);

        // Attach event listeners
        this.attachListeners();

        // Apply initial states
        this.updateAllToggles();
    }

    buildHTML() {
        return `
            <div class="layer-controls-header">
                <div class="layer-controls-title">
                    <i data-lucide="layers" style="width:18px;height:18px"></i>
                    <span>Intelligence Layers</span>
                </div>
                <button class="layer-controls-toggle" id="sidebarToggle" title="Collapse sidebar">
                    <i data-lucide="chevron-left" style="width:16px;height:16px"></i>
                </button>
            </div>

            <div class="layer-controls-body">
                <!-- Historical Crises -->
                <div class="layer-control-item" data-layer="historicalCrises">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Historical Crises</span>
                            <span class="layer-badge" style="background:rgba(251,191,36,0.2);color:#fbbf24">1913-2026</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">Red/yellow markers based on outcome</div>
                </div>

                <!-- Active Conflicts -->
                <div class="layer-control-item" data-layer="activeConflicts">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Active Conflicts</span>
                            <span class="layer-badge" style="background:rgba(220,38,38,0.2);color:#dc2626">LIVE</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">Ukraine, Gaza, Sudan - pulsing red nodes</div>
                </div>

                <!-- Nuclear Facilities -->
                <div class="layer-control-item" data-layer="nuclearFacilities">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Nuclear Facilities</span>
                            <span class="layer-badge" style="background:rgba(249,115,22,0.2);color:#f97316">☢</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">Enrichment sites, reactors, missile bases</div>
                </div>

                <!-- Military Assets -->
                <div class="layer-control-item" data-layer="militaryAssets">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Military Assets</span>
                            <span class="layer-badge" style="background:rgba(59,130,246,0.2);color:#3b82f6">⚔</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">Carriers, bases, air defense systems</div>
                </div>

                <!-- Alliance Networks -->
                <div class="layer-control-item" data-layer="allianceNetworks">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Alliance Networks</span>
                            <span class="layer-badge" style="background:rgba(139,92,246,0.2);color:#8b5cf6">🔗</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">NATO, Russia-Iran, China partnerships</div>
                </div>

                <!-- Trade Routes -->
                <div class="layer-control-item" data-layer="tradeRoutes">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Trade Routes</span>
                            <span class="layer-badge" style="background:rgba(34,197,94,0.2);color:#22c55e">🚢</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">Oil, shipping lanes, pipelines</div>
                </div>

                <!-- Early Warning -->
                <div class="layer-control-item" data-layer="earlyWarning">
                    <div class="layer-control-header">
                        <label class="layer-checkbox">
                            <input type="checkbox" checked>
                            <span class="layer-name">Early Warning</span>
                            <span class="layer-badge" style="background:rgba(234,179,8,0.2);color:#eab308">⚠</span>
                        </label>
                    </div>
                    <div class="layer-control-slider">
                        <input type="range" min="0" max="100" value="100" class="opacity-slider">
                        <span class="opacity-value">100%</span>
                    </div>
                    <div class="layer-description">Real-time tension indicators</div>
                </div>
            </div>

            <div class="layer-controls-footer">
                <button class="layer-btn" id="toggleAllLayers">
                    <i data-lucide="eye-off" style="width:14px;height:14px;margin-right:4px"></i>
                    Hide All
                </button>
                <button class="layer-btn" id="resetLayers">
                    <i data-lucide="refresh-cw" style="width:14px;height:14px;margin-right:4px"></i>
                    Reset
                </button>
            </div>

            <div class="layer-legend">
                <div class="layer-legend-title">Legend</div>
                <div class="layer-legend-items">
                    <div class="legend-item"><span class="legend-icon" style="background:#fbbf24">●</span> Positive Outcome</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#f87171">●</span> Negative Outcome</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#dc2626">▲</span> Active Conflict</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#f97316">▲</span> Nuclear Site</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#3b82f6">■</span> Military Asset</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#8b5cf6">─</span> Alliance Link</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#22c55e">~</span> Trade Route</div>
                    <div class="legend-item"><span class="legend-icon" style="background:#eab308">★</span> Early Warning</div>
                </div>
            </div>

            <div class="layer-search">
                <input type="text" id="layerSearchInput" placeholder="Search facilities, bases..." />
                <button id="layerSearchBtn">
                    <i data-lucide="search" style="width:14px;height:14px"></i>
                </button>
            </div>
        `;
    }

    attachListeners() {
        const sidebar = document.getElementById('layerControlsSidebar');

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.isOpen = !this.isOpen;
            sidebar.classList.toggle('open');
            const icon = sidebar.querySelector('.layer-controls-toggle i');
            icon.setAttribute('data-lucide', this.isOpen ? 'chevron-left' : 'chevron-right');
            lucide.createIcons();
        });

        // Layer toggles
        sidebar.querySelectorAll('.layer-control-item').forEach(item => {
            const layerName = item.dataset.layer;
            const checkbox = item.querySelector('input[type="checkbox"]');
            const slider = item.querySelector('.opacity-slider');
            const valueDisplay = item.querySelector('.opacity-value');

            // Checkbox toggle
            checkbox.addEventListener('change', (e) => {
                this.layersManager.toggleLayer(layerName, e.target.checked);
            });

            // Opacity slider
            slider.addEventListener('input', (e) => {
                const value = parseInt(e.target.value);
                valueDisplay.textContent = `${value}%`;
                this.layersManager.setLayerOpacity(layerName, value / 100);
            });
        });

        // Toggle all button
        let allVisible = true;
        document.getElementById('toggleAllLayers').addEventListener('click', () => {
            allVisible = !allVisible;
            const btn = document.getElementById('toggleAllLayers');
            btn.innerHTML = allVisible 
                ? '<i data-lucide="eye-off" style="width:14px;height:14px;margin-right:4px"></i>Hide All'
                : '<i data-lucide="eye" style="width:14px;height:14px;margin-right:4px"></i>Show All';
            lucide.createIcons();

            sidebar.querySelectorAll('.layer-control-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                checkbox.checked = allVisible;
                this.layersManager.toggleLayer(item.dataset.layer, allVisible);
            });
        });

        // Reset button
        document.getElementById('resetLayers').addEventListener('click', () => {
            sidebar.querySelectorAll('.layer-control-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                const slider = item.querySelector('.opacity-slider');
                const valueDisplay = item.querySelector('.opacity-value');

                checkbox.checked = true;
                slider.value = 100;
                valueDisplay.textContent = '100%';

                this.layersManager.toggleLayer(item.dataset.layer, true);
                this.layersManager.setLayerOpacity(item.dataset.layer, 1.0);
            });
        });

        // Search functionality
        document.getElementById('layerSearchBtn').addEventListener('click', () => {
            this.handleSearch();
        });

        document.getElementById('layerSearchInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });

        // Initialize Lucide icons
        lucide.createIcons();
    }

    handleSearch() {
        const query = document.getElementById('layerSearchInput').value.trim();
        if (!query) return;

        let found = false;

        // Search across all layers
        Object.keys(this.layersManager.layers).forEach(layerName => {
            const results = this.layersManager.searchLayer(layerName, query);
            if (results.length > 0) {
                found = true;
                // Enable layer if hidden
                if (!this.layersManager.layers[layerName].enabled) {
                    this.layersManager.toggleLayer(layerName, true);
                    const checkbox = document.querySelector(`[data-layer="${layerName}"] input[type="checkbox"]`);
                    if (checkbox) checkbox.checked = true;
                }
                // Highlight first result
                this.layersManager.highlightSprite(results[0]);
            }
        });

        if (!found) {
            this.showNotification('No results found', 'warning');
        }
    }

    updateAllToggles() {
        Object.entries(this.layersManager.layers).forEach(([name, layer]) => {
            const item = document.querySelector(`[data-layer="${name}"]`);
            if (!item) return;

            const checkbox = item.querySelector('input[type="checkbox"]');
            const slider = item.querySelector('.opacity-slider');
            const valueDisplay = item.querySelector('.opacity-value');

            if (checkbox) checkbox.checked = layer.enabled;
            if (slider) slider.value = layer.opacity * 100;
            if (valueDisplay) valueDisplay.textContent = `${Math.round(layer.opacity * 100)}%`;
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `layer-notification ${type}`;
        notification.textContent = message;
        
        const sidebar = document.getElementById('layerControlsSidebar');
        sidebar.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }

    dispose() {
        const sidebar = document.getElementById('layerControlsSidebar');
        if (sidebar) sidebar.remove();
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LayerControlsUI;
}
