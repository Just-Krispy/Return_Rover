/**
 * Connection Controls UI
 * Filter panel for connection visualization types
 */

class ConnectionControls {
    constructor(connectionsSystem) {
        this.connectionsSystem = connectionsSystem;
        this.controlsVisible = true;
        
        this.createControls();
    }

    /**
     * Create control panel UI
     */
    createControls() {
        // Create container
        const container = document.createElement('div');
        container.id = 'connection-controls';
        container.style.cssText = `
            position: fixed;
            top: 140px;
            left: 20px;
            background: rgba(24, 24, 27, 0.95);
            border: 1px solid rgba(63, 63, 70, 0.6);
            border-radius: 12px;
            padding: 16px;
            color: #fafafa;
            font-family: Inter, sans-serif;
            font-size: 13px;
            z-index: 1000;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            min-width: 240px;
            transition: all 0.25s cubic-bezier(0.22, 1, 0.36, 1);
        `;

        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 12px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(63, 63, 70, 0.5);
        `;
        header.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                    <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
                <strong style="font-size: 14px;">Connections</strong>
            </div>
            <button id="toggle-connections-panel" style="
                background: none;
                border: none;
                color: #a1a1aa;
                cursor: pointer;
                padding: 4px;
                display: flex;
                align-items: center;
                transition: color 0.15s;
            ">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                </svg>
            </button>
        `;

        // Content container
        const content = document.createElement('div');
        content.id = 'connection-controls-content';
        content.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;

        // Master toggle
        const masterToggle = this.createToggleButton(
            'All Connections',
            true,
            '#ffffff',
            () => {
                this.connectionsSystem.toggleAllConnections();
                this.updateCheckboxStates();
            }
        );
        masterToggle.style.marginBottom = '6px';
        masterToggle.style.paddingBottom = '10px';
        masterToggle.style.borderBottom = '1px solid rgba(63, 63, 70, 0.4)';

        // Individual connection type toggles
        const connectionTypes = [
            { 
                key: 'causal', 
                label: 'Causal Links', 
                color: '#a78bfa',
                description: 'Direct cause-and-effect chains'
            },
            { 
                key: 'alliance', 
                label: 'Alliance Networks', 
                color: '#60a5fa',
                description: 'Geopolitical partnerships'
            },
            { 
                key: 'influence', 
                label: 'Influence Flows', 
                color: '#f87171',
                description: 'Proxy relationships & support'
            },
            { 
                key: 'pattern', 
                label: 'Pattern Threads', 
                color: '#fbbf24',
                description: 'Recurring historical dynamics'
            },
            { 
                key: 'echo', 
                label: 'Historical Echoes', 
                color: '#22d3ee',
                description: 'Multi-generational parallels'
            }
        ];

        connectionTypes.forEach(type => {
            const toggle = this.createToggleButton(
                type.label,
                true,
                type.color,
                () => {
                    this.connectionsSystem.toggleConnectionType(type.key);
                    this.updateMasterToggle();
                },
                type.description
            );
            toggle.dataset.connectionType = type.key;
            content.appendChild(toggle);
        });

        // Legend section
        const legend = document.createElement('div');
        legend.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(63, 63, 70, 0.4);
            font-size: 11px;
            color: #71717a;
        `;
        legend.innerHTML = `
            <div style="margin-bottom: 6px; font-weight: 600; color: #a1a1aa;">Visual Guide</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 20px; height: 2px; background: #a78bfa;"></div>
                    <span>Solid = Direct link</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 20px; height: 2px; background: #fbbf24; background-image: repeating-linear-gradient(90deg, #fbbf24 0, #fbbf24 4px, transparent 4px, transparent 8px);"></div>
                    <span>Dashed = Pattern</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #22d3ee; box-shadow: 0 0 8px #22d3ee;"></div>
                    <span>Glow = Historical echo</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px;">
                    <div style="width: 8px; height: 8px; border-radius: 50%; background: #60a5fa;"></div>
                    <span>Animated particles</span>
                </div>
            </div>
        `;

        // Stats section
        const stats = document.createElement('div');
        stats.id = 'connection-stats';
        stats.style.cssText = `
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid rgba(63, 63, 70, 0.4);
            font-size: 11px;
            color: #71717a;
        `;
        this.updateStats(stats);

        // Assemble
        content.appendChild(masterToggle);
        container.appendChild(header);
        container.appendChild(content);
        container.appendChild(legend);
        container.appendChild(stats);
        document.body.appendChild(container);

        // Toggle panel visibility
        document.getElementById('toggle-connections-panel').addEventListener('click', () => {
            this.togglePanel();
        });

        this.container = container;
        this.contentElement = content;
        this.statsElement = stats;
    }

    /**
     * Create a toggle button for connection type
     */
    createToggleButton(label, initialState, color, onToggle, description = null) {
        const button = document.createElement('div');
        button.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 8px 10px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.15s;
            background: rgba(39, 39, 42, 0.4);
        `;
        
        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(39, 39, 42, 0.7)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(39, 39, 42, 0.4)';
        });

        const leftSide = document.createElement('div');
        leftSide.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            flex: 1;
        `;

        const colorDot = document.createElement('div');
        colorDot.style.cssText = `
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: ${color};
            flex-shrink: 0;
        `;

        const labelContainer = document.createElement('div');
        labelContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 2px;
        `;

        const labelText = document.createElement('div');
        labelText.textContent = label;
        labelText.style.cssText = `
            font-size: 13px;
            color: #fafafa;
            font-weight: 500;
        `;

        labelContainer.appendChild(labelText);

        if (description) {
            const descText = document.createElement('div');
            descText.textContent = description;
            descText.style.cssText = `
                font-size: 11px;
                color: #71717a;
            `;
            labelContainer.appendChild(descText);
        }

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = initialState;
        checkbox.style.cssText = `
            width: 16px;
            height: 16px;
            cursor: pointer;
            accent-color: ${color};
        `;

        leftSide.appendChild(colorDot);
        leftSide.appendChild(labelContainer);
        button.appendChild(leftSide);
        button.appendChild(checkbox);

        button.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
                checkbox.checked = !checkbox.checked;
            }
            onToggle();
            this.updateStats();
        });

        return button;
    }

    /**
     * Update checkbox states based on system state
     */
    updateCheckboxStates() {
        Object.keys(this.connectionsSystem.connectionTypes).forEach(type => {
            const toggle = this.contentElement.querySelector(`[data-connection-type="${type}"]`);
            if (toggle) {
                const checkbox = toggle.querySelector('input[type="checkbox"]');
                checkbox.checked = this.connectionsSystem.connectionTypes[type].visible;
            }
        });
    }

    /**
     * Update master toggle based on individual states
     */
    updateMasterToggle() {
        const allVisible = Object.values(this.connectionsSystem.connectionTypes)
            .every(config => config.visible);
        
        this.connectionsSystem.allConnectionsVisible = allVisible;
        this.updateStats();
    }

    /**
     * Update stats display
     */
    updateStats(statsElement = null) {
        const target = statsElement || this.statsElement;
        if (!target) return;

        let totalConnections = 0;
        let visibleConnections = 0;

        Object.values(this.connectionsSystem.connectionTypes).forEach(config => {
            const count = config.connections.length;
            totalConnections += count;
            if (config.visible) {
                visibleConnections += count;
            }
        });

        target.innerHTML = `
            <div style="font-weight: 600; color: #a1a1aa; margin-bottom: 4px;">Statistics</div>
            <div style="display: flex; justify-content: space-between;">
                <span>Total connections:</span>
                <span style="color: #fafafa; font-weight: 600;">${totalConnections}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
                <span>Currently visible:</span>
                <span style="color: ${visibleConnections > 0 ? '#4ade80' : '#71717a'}; font-weight: 600;">
                    ${visibleConnections}
                </span>
            </div>
        `;
    }

    /**
     * Toggle panel collapsed/expanded
     */
    togglePanel() {
        this.controlsVisible = !this.controlsVisible;
        
        const content = document.getElementById('connection-controls-content');
        const legend = this.container.querySelector('div:nth-child(4)');
        const stats = this.statsElement;
        const toggleButton = document.getElementById('toggle-connections-panel');
        
        if (this.controlsVisible) {
            content.style.display = 'flex';
            legend.style.display = 'block';
            stats.style.display = 'block';
            toggleButton.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="18 15 12 9 6 15"/>
                </svg>
            `;
        } else {
            content.style.display = 'none';
            legend.style.display = 'none';
            stats.style.display = 'none';
            toggleButton.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"/>
                </svg>
            `;
        }
    }

    /**
     * Show/hide entire control panel
     */
    setVisible(visible) {
        this.container.style.display = visible ? 'block' : 'none';
    }

    /**
     * Cleanup
     */
    dispose() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}
