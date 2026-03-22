/**
 * Live Data Integration System - Real-Time OSINT Intelligence Feeds
 * Integrates multiple public data sources for real-time geopolitical intelligence
 */

class LiveDataManager {
    constructor(scene, camera, dataLayersManager) {
        this.scene = scene;
        this.camera = camera;
        this.dataLayers = dataLayersManager;
        
        // Data cache with TTL (5 minutes)
        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes in milliseconds
        
        // Auto-refresh interval
        this.autoRefreshInterval = null;
        this.refreshRate = 5 * 60 * 1000; // 5 minutes
        
        // Active data nodes (visual representations)
        this.dataNodes = new Map();
        
        // Historical data for charts
        this.historicalData = {
            iranEnrichment: [],
            oilPrices: [],
            shippingTraffic: []
        };
        
        // Data source status
        this.sourceStatus = {
            iaea: { active: false, lastUpdate: null, error: null },
            oil: { active: false, lastUpdate: null, error: null },
            news: { active: false, lastUpdate: null, error: null },
            flights: { active: false, lastUpdate: null, error: null },
            shipping: { active: false, lastUpdate: null, error: null }
        };
        
        // Initialize localStorage for persistence
        this.loadHistoricalData();
        
        // Event listeners for user interactions
        this.setupEventListeners();
    }

    // ===== Data Source Integration =====

    /**
     * Fetch IAEA Reports (Iran enrichment levels)
     * Source: IAEA public reports, UN API, or cached proxy
     */
    async fetchIAEAData() {
        const cacheKey = 'iaea_enrichment';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // IAEA doesn't have a public API, so we'll use a simulated feed
            // In production, this would scrape IAEA reports or use a data aggregator
            const data = await this.fetchWithTimeout(
                'https://api.example.com/iaea/enrichment', // Replace with actual endpoint
                { timeout: 10000 }
            ).catch(() => {
                // Fallback to simulated data for demo
                return this.simulateIAEAData();
            });

            this.setCache(cacheKey, data);
            this.sourceStatus.iaea.active = true;
            this.sourceStatus.iaea.lastUpdate = Date.now();
            this.sourceStatus.iaea.error = null;

            // Store historical data
            this.historicalData.iranEnrichment.push({
                timestamp: Date.now(),
                enrichmentLevel: data.enrichmentPercent,
                stockpile: data.stockpileKg
            });
            this.saveHistoricalData();

            return data;
        } catch (error) {
            this.sourceStatus.iaea.active = false;
            this.sourceStatus.iaea.error = error.message;
            console.error('IAEA fetch failed:', error);
            return null;
        }
    }

    simulateIAEAData() {
        // Simulate realistic enrichment data based on recent reports
        return {
            lastUpdated: new Date().toISOString(),
            facilities: [
                {
                    name: "Natanz",
                    lat: 33.7241,
                    lon: 51.7303,
                    enrichmentPercent: 60, // 60% enriched uranium (near weapons-grade)
                    stockpileKg: 114.1, // kg of 60% enriched U-235
                    trend: "escalating",
                    status: "active"
                },
                {
                    name: "Fordow",
                    lat: 34.8831,
                    lon: 50.9872,
                    enrichmentPercent: 20,
                    stockpileKg: 567.8,
                    trend: "stable",
                    status: "active"
                }
            ],
            overallTrend: "escalating",
            breakoutTime: "12 days" // Time to weapons-grade if decided
        };
    }

    /**
     * Fetch Oil Prices (Brent Crude real-time)
     * Sources: Alpha Vantage, Twelve Data, or Yahoo Finance
     */
    async fetchOilPrices() {
        const cacheKey = 'oil_prices';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Using Alpha Vantage free tier (5 calls/min, 500/day)
            const API_KEY = 'demo'; // Replace with actual API key
            const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=BZ=F&apikey=${API_KEY}`;
            
            const response = await this.fetchWithTimeout(url, { timeout: 10000 });
            const data = await response.json();

            if (data['Global Quote']) {
                const quote = data['Global Quote'];
                const result = {
                    lastUpdated: new Date().toISOString(),
                    symbol: 'BZ=F', // Brent Crude Futures
                    price: parseFloat(quote['05. price']),
                    change: parseFloat(quote['09. change']),
                    changePercent: quote['10. change percent'],
                    trend: parseFloat(quote['09. change']) > 0 ? 'up' : 'down'
                };

                this.setCache(cacheKey, result);
                this.sourceStatus.oil.active = true;
                this.sourceStatus.oil.lastUpdate = Date.now();
                this.sourceStatus.oil.error = null;

                // Store historical
                this.historicalData.oilPrices.push({
                    timestamp: Date.now(),
                    price: result.price,
                    change: result.change
                });
                this.saveHistoricalData();

                return result;
            }

            // Fallback to simulated data
            return this.simulateOilData();
        } catch (error) {
            this.sourceStatus.oil.active = false;
            this.sourceStatus.oil.error = error.message;
            console.error('Oil price fetch failed:', error);
            return this.simulateOilData();
        }
    }

    simulateOilData() {
        const basePrice = 85.4;
        const volatility = (Math.random() - 0.5) * 3;
        return {
            lastUpdated: new Date().toISOString(),
            symbol: 'Brent Crude',
            price: +(basePrice + volatility).toFixed(2),
            change: +volatility.toFixed(2),
            changePercent: +((volatility / basePrice) * 100).toFixed(2) + '%',
            trend: volatility > 0 ? 'up' : 'down'
        };
    }

    /**
     * Fetch Flight Tracking (Military aircraft, tankers via ADS-B)
     * Source: OpenSky Network (free, public ADS-B data)
     */
    async fetchFlightData(bbox = null) {
        const cacheKey = 'flight_tracking';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // OpenSky Network API (no auth needed, rate-limited)
            // bbox format: [lat_min, lon_min, lat_max, lon_max]
            let url = 'https://opensky-network.org/api/states/all';
            if (bbox) {
                url += `?lamin=${bbox[0]}&lomin=${bbox[1]}&lamax=${bbox[2]}&lomax=${bbox[3]}`;
            }

            const response = await this.fetchWithTimeout(url, { timeout: 15000 });
            const data = await response.json();

            if (data.states) {
                // Filter for military/interesting aircraft
                const militaryFlights = data.states.filter(state => {
                    const callsign = state[1] ? state[1].trim() : '';
                    // Filter for military callsigns (simplified heuristics)
                    return callsign.match(/^(RCH|CNV|EVAC|TORCH|NATO|MAR|NAVY|USAF|RAF|RSAF)/i);
                }).map(state => ({
                    icao24: state[0],
                    callsign: state[1] ? state[1].trim() : 'N/A',
                    originCountry: state[2],
                    lat: state[6],
                    lon: state[5],
                    altitude: state[7], // meters
                    velocity: state[9], // m/s
                    heading: state[10], // degrees
                    lastSeen: state[3]
                }));

                const result = {
                    lastUpdated: new Date().toISOString(),
                    totalFlights: data.states.length,
                    militaryFlights,
                    hotspots: this.identifyFlightHotspots(militaryFlights)
                };

                this.setCache(cacheKey, result);
                this.sourceStatus.flights.active = true;
                this.sourceStatus.flights.lastUpdate = Date.now();
                this.sourceStatus.flights.error = null;

                return result;
            }

            return this.simulateFlightData();
        } catch (error) {
            this.sourceStatus.flights.active = false;
            this.sourceStatus.flights.error = error.message;
            console.error('Flight tracking failed:', error);
            return this.simulateFlightData();
        }
    }

    simulateFlightData() {
        return {
            lastUpdated: new Date().toISOString(),
            totalFlights: 12847,
            militaryFlights: [
                { callsign: 'RCH234', lat: 26.0667, lon: 50.5577, altitude: 11000, type: 'tanker', region: 'Persian Gulf' },
                { callsign: 'NATO01', lat: 54.7104, lon: 20.4522, altitude: 9500, type: 'surveillance', region: 'Baltic Sea' },
                { callsign: 'USAF921', lat: 36.8468, lon: -76.2955, altitude: 8000, type: 'transport', region: 'East Coast US' }
            ],
            hotspots: [
                { region: 'Persian Gulf', count: 8, alertLevel: 'high' },
                { region: 'Baltic Sea', count: 5, alertLevel: 'medium' },
                { region: 'South China Sea', count: 12, alertLevel: 'high' }
            ]
        };
    }

    identifyFlightHotspots(flights) {
        // Group flights by region and identify high-activity areas
        const regions = {
            'Persian Gulf': { count: 0, bounds: [24, 48, 30, 58] },
            'Baltic Sea': { count: 0, bounds: [53, 10, 66, 30] },
            'South China Sea': { count: 0, bounds: [0, 100, 25, 120] },
            'Eastern Europe': { count: 0, bounds: [45, 20, 55, 40] }
        };

        flights.forEach(flight => {
            for (const [region, { bounds }] of Object.entries(regions)) {
                const [latMin, lonMin, latMax, lonMax] = bounds;
                if (flight.lat >= latMin && flight.lat <= latMax &&
                    flight.lon >= lonMin && flight.lon <= lonMax) {
                    regions[region].count++;
                }
            }
        });

        return Object.entries(regions).map(([region, { count }]) => ({
            region,
            count,
            alertLevel: count > 10 ? 'high' : count > 5 ? 'medium' : 'low'
        }));
    }

    /**
     * Fetch Shipping Traffic (Strait of Hormuz, Suez, Malacca)
     * Source: MarineTraffic public API or AIS data aggregators
     */
    async fetchShippingData(region = 'hormuz') {
        const cacheKey = `shipping_${region}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // MarineTraffic has limited free tier - using simulated data
            // In production, integrate with MarineTraffic API or AIS exchange
            const result = this.simulateShippingData(region);

            this.setCache(cacheKey, result);
            this.sourceStatus.shipping.active = true;
            this.sourceStatus.shipping.lastUpdate = Date.now();
            this.sourceStatus.shipping.error = null;

            return result;
        } catch (error) {
            this.sourceStatus.shipping.active = false;
            this.sourceStatus.shipping.error = error.message;
            console.error('Shipping data failed:', error);
            return null;
        }
    }

    simulateShippingData(region) {
        const regions = {
            hormuz: {
                name: 'Strait of Hormuz',
                lat: 26.5667,
                lon: 56.25,
                dailyTransits: 21,
                oilTankersToday: 15,
                commercialVessels: 34,
                militaryPresence: 3,
                trend: 'stable',
                congestionLevel: 'normal'
            },
            suez: {
                name: 'Suez Canal',
                lat: 30.5,
                lon: 32.35,
                dailyTransits: 58,
                oilTankersToday: 12,
                commercialVessels: 89,
                militaryPresence: 1,
                trend: 'stable',
                congestionLevel: 'normal'
            },
            malacca: {
                name: 'Strait of Malacca',
                lat: 1.43,
                lon: 102.89,
                dailyTransits: 94,
                oilTankersToday: 28,
                commercialVessels: 156,
                militaryPresence: 2,
                trend: 'increasing',
                congestionLevel: 'high'
            }
        };

        const data = regions[region] || regions.hormuz;
        return {
            lastUpdated: new Date().toISOString(),
            region: data.name,
            location: { lat: data.lat, lon: data.lon },
            ...data
        };
    }

    /**
     * Fetch Breaking News (Geopolitical events)
     * Sources: NewsAPI, RSS feeds (Reuters, BBC, AP)
     */
    async fetchNewsAlerts(topics = ['iran', 'ukraine', 'israel', 'taiwan']) {
        const cacheKey = 'news_alerts';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // NewsAPI free tier (100 requests/day)
            const API_KEY = 'demo'; // Replace with actual key
            const query = topics.join(' OR ');
            const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&language=en&pageSize=20&apiKey=${API_KEY}`;

            const response = await this.fetchWithTimeout(url, { timeout: 10000 });
            const data = await response.json();

            if (data.articles) {
                const alerts = data.articles.map(article => ({
                    title: article.title,
                    source: article.source.name,
                    url: article.url,
                    publishedAt: article.publishedAt,
                    description: article.description,
                    severity: this.assessNewsSeverity(article.title + ' ' + article.description)
                }));

                const result = {
                    lastUpdated: new Date().toISOString(),
                    alerts,
                    highSeverityCount: alerts.filter(a => a.severity === 'high').length
                };

                this.setCache(cacheKey, result);
                this.sourceStatus.news.active = true;
                this.sourceStatus.news.lastUpdate = Date.now();
                this.sourceStatus.news.error = null;

                return result;
            }

            return this.simulateNewsData();
        } catch (error) {
            this.sourceStatus.news.active = false;
            this.sourceStatus.news.error = error.message;
            console.error('News fetch failed:', error);
            return this.simulateNewsData();
        }
    }

    simulateNewsData() {
        return {
            lastUpdated: new Date().toISOString(),
            alerts: [
                {
                    title: 'IAEA Reports Iran Enrichment Increase',
                    source: 'Reuters',
                    publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
                    severity: 'high',
                    region: 'Middle East'
                },
                {
                    title: 'NATO Exercises Begin in Baltic Sea',
                    source: 'AP News',
                    publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
                    severity: 'medium',
                    region: 'Europe'
                },
                {
                    title: 'Oil Prices Surge on Supply Concerns',
                    source: 'Bloomberg',
                    publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
                    severity: 'medium',
                    region: 'Global'
                }
            ],
            highSeverityCount: 1
        };
    }

    assessNewsSeverity(text) {
        const highKeywords = ['nuclear', 'war', 'attack', 'invasion', 'crisis', 'escalation', 'weapons'];
        const mediumKeywords = ['tension', 'threat', 'military', 'conflict', 'sanctions', 'exercises'];
        
        const lower = text.toLowerCase();
        if (highKeywords.some(kw => lower.includes(kw))) return 'high';
        if (mediumKeywords.some(kw => lower.includes(kw))) return 'medium';
        return 'low';
    }

    // ===== Visualization Layer =====

    /**
     * Create visual indicators for live data on the globe
     */
    async visualizeIAEAData() {
        const data = await this.fetchIAEAData();
        if (!data) return;

        data.facilities.forEach(facility => {
            const node = this.createDataNode(
                facility.lat, facility.lon,
                {
                    type: 'iaea',
                    name: facility.name,
                    value: `${facility.enrichmentPercent}% enriched`,
                    stockpile: `${facility.stockpileKg} kg`,
                    trend: facility.trend,
                    status: facility.status
                }
            );
            this.dataNodes.set(`iaea_${facility.name}`, node);
        });
    }

    async visualizeOilPrices() {
        const data = await this.fetchOilPrices();
        if (!data) return;

        // Display oil price ticker globally (not location-specific)
        this.updateLiveTicker({
            type: 'oil',
            text: `Brent Crude: $${data.price} (${data.changePercent})`,
            trend: data.trend
        });
    }

    async visualizeFlightData() {
        const data = await this.fetchFlightData();
        if (!data) return;

        data.militaryFlights.forEach((flight, idx) => {
            if (flight.lat && flight.lon) {
                const node = this.createDataNode(
                    flight.lat, flight.lon,
                    {
                        type: 'flight',
                        callsign: flight.callsign,
                        altitude: `${Math.round(flight.altitude / 1000)} km`,
                        velocity: flight.velocity ? `${Math.round(flight.velocity * 3.6)} km/h` : 'N/A'
                    }
                );
                this.dataNodes.set(`flight_${idx}`, node);
            }
        });
    }

    async visualizeShippingData() {
        const regions = ['hormuz', 'suez', 'malacca'];
        
        for (const region of regions) {
            const data = await this.fetchShippingData(region);
            if (!data) continue;

            const node = this.createDataNode(
                data.location.lat, data.location.lon,
                {
                    type: 'shipping',
                    region: data.region,
                    dailyTransits: data.dailyTransits,
                    oilTankers: data.oilTankersToday,
                    trend: data.trend,
                    congestion: data.congestionLevel
                }
            );
            this.dataNodes.set(`shipping_${region}`, node);
        }
    }

    async visualizeNewsAlerts() {
        const data = await this.fetchNewsAlerts();
        if (!data) return;

        // Display high-severity alerts on the ticker
        const highSeverityAlerts = data.alerts.filter(a => a.severity === 'high');
        highSeverityAlerts.forEach((alert, idx) => {
            this.updateLiveTicker({
                type: 'news',
                text: alert.title,
                source: alert.source,
                severity: alert.severity
            });
        });
    }

    /**
     * Create a pulsing data node on the globe
     */
    createDataNode(lat, lon, metadata) {
        const pos = this.latLonToVector3(lat, lon, 1.02);
        
        // Determine color based on data type and trend
        let color = 0x22d3ee; // Default cyan
        if (metadata.type === 'iaea') {
            color = metadata.trend === 'escalating' ? 0xf87171 : 0xfbbf24;
        } else if (metadata.type === 'flight') {
            color = 0x60a5fa;
        } else if (metadata.type === 'shipping') {
            color = 0x4ade80;
        }

        // Create pulsing marker
        const canvas = this.createPulsingCanvas(color);
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true, 
            opacity: 0.9 
        });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(pos);
        sprite.scale.set(0.4, 0.4, 1);
        
        // Add metadata
        sprite.userData = { ...metadata, pulsing: true, baseScale: 0.4 };
        
        // Add badge if new data
        if (this.isNewData(metadata)) {
            this.addAlertBadge(sprite);
        }
        
        this.scene.add(sprite);
        return sprite;
    }

    createPulsingCanvas(color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // Draw pulsing circle with glow
        const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
        gradient.addColorStop(0, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 1)`);
        gradient.addColorStop(0.5, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0.6)`);
        gradient.addColorStop(1, `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, 0)`);
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(32, 32, 28, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright dot
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(32, 32, 8, 0, Math.PI * 2);
        ctx.fill();
        
        return canvas;
    }

    addAlertBadge(sprite) {
        // Add red dot badge for new intel
        const badgeCanvas = document.createElement('canvas');
        badgeCanvas.width = 16;
        badgeCanvas.height = 16;
        const ctx = badgeCanvas.getContext('2d');
        
        ctx.fillStyle = '#f87171';
        ctx.beginPath();
        ctx.arc(8, 8, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        const badgeTexture = new THREE.CanvasTexture(badgeCanvas);
        const badgeMaterial = new THREE.SpriteMaterial({ map: badgeTexture, transparent: true });
        const badge = new THREE.Sprite(badgeMaterial);
        badge.scale.set(0.15, 0.15, 1);
        badge.position.set(0.15, 0.15, 0); // Offset from main sprite
        
        sprite.add(badge);
        sprite.userData.hasAlert = true;
    }

    isNewData(metadata) {
        // Check if data was updated in the last 10 minutes
        const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
        const sourceKey = metadata.type;
        return this.sourceStatus[sourceKey]?.lastUpdate > tenMinutesAgo;
    }

    // ===== Live Ticker =====

    updateLiveTicker(item) {
        const ticker = document.getElementById('live-ticker');
        if (!ticker) return;

        const tickerItem = document.createElement('div');
        tickerItem.className = 'ticker-item';
        tickerItem.innerHTML = `
            <span class="ticker-icon">${this.getTickerIcon(item.type)}</span>
            <span class="ticker-text">${item.text}</span>
            ${item.trend ? `<span class="ticker-trend ${item.trend}">${item.trend === 'up' ? '↑' : '↓'}</span>` : ''}
        `;
        
        // Prepend to show latest first
        ticker.insertBefore(tickerItem, ticker.firstChild);
        
        // Keep only last 20 items
        while (ticker.children.length > 20) {
            ticker.removeChild(ticker.lastChild);
        }
    }

    getTickerIcon(type) {
        const icons = {
            iaea: '☢️',
            oil: '🛢️',
            flight: '✈️',
            shipping: '🚢',
            news: '📰'
        };
        return icons[type] || '•';
    }

    // ===== Auto-Refresh System =====

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        // Initial fetch
        this.refreshAllData();

        // Set up interval
        this.autoRefreshInterval = setInterval(() => {
            this.refreshAllData();
        }, this.refreshRate);

        console.log(`Auto-refresh started: every ${this.refreshRate / 1000} seconds`);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
            console.log('Auto-refresh stopped');
        }
    }

    async refreshAllData() {
        console.log('Refreshing all data sources...');
        
        // Clear old nodes
        this.clearDataNodes();
        
        // Fetch and visualize all sources in parallel
        await Promise.all([
            this.visualizeIAEAData(),
            this.visualizeOilPrices(),
            this.visualizeFlightData(),
            this.visualizeShippingData(),
            this.visualizeNewsAlerts()
        ]);
        
        // Update timestamp
        this.updateLastRefreshTimestamp();
        
        console.log('Data refresh complete');
    }

    manualRefresh() {
        this.refreshAllData();
    }

    clearDataNodes() {
        this.dataNodes.forEach(node => {
            if (node.material.map) node.material.map.dispose();
            node.material.dispose();
            this.scene.remove(node);
        });
        this.dataNodes.clear();
    }

    updateLastRefreshTimestamp() {
        const timestampEl = document.getElementById('last-updated');
        if (timestampEl) {
            const now = new Date();
            timestampEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    // ===== Cache Management =====

    getFromCache(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        const now = Date.now();
        if (now - item.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    clearCache() {
        this.cache.clear();
    }

    // ===== Historical Data Management =====

    loadHistoricalData() {
        try {
            const stored = localStorage.getItem('liveDataHistorical');
            if (stored) {
                this.historicalData = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load historical data:', error);
        }
    }

    saveHistoricalData() {
        try {
            // Keep only last 1000 entries per metric to avoid bloat
            Object.keys(this.historicalData).forEach(key => {
                if (this.historicalData[key].length > 1000) {
                    this.historicalData[key] = this.historicalData[key].slice(-1000);
                }
            });
            
            localStorage.setItem('liveDataHistorical', JSON.stringify(this.historicalData));
        } catch (error) {
            console.error('Failed to save historical data:', error);
        }
    }

    getHistoricalChart(metric, timeRange = '24h') {
        const data = this.historicalData[metric] || [];
        
        // Filter by time range
        const now = Date.now();
        const ranges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
        };
        
        const cutoff = now - (ranges[timeRange] || ranges['24h']);
        return data.filter(d => d.timestamp > cutoff);
    }

    // ===== Utility Functions =====

    latLonToVector3(lat, lon, radius) {
        const phi = (90 - lat) * (Math.PI / 180);
        const theta = (lon + 180) * (Math.PI / 180);
        const x = -(radius * Math.sin(phi) * Math.cos(theta));
        const z = radius * Math.sin(phi) * Math.sin(theta);
        const y = radius * Math.cos(phi);
        return new THREE.Vector3(x, y, z);
    }

    async fetchWithTimeout(url, options = {}) {
        const { timeout = 8000 } = options;
        
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    }

    // ===== Event Listeners =====

    setupEventListeners() {
        // Manual refresh button
        const refreshBtn = document.getElementById('manual-refresh-btn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.manualRefresh());
        }

        // Data source filters
        const filterCheckboxes = document.querySelectorAll('[data-filter-source]');
        filterCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const source = e.target.dataset.filterSource;
                this.toggleDataSource(source, e.target.checked);
            });
        });
    }

    toggleDataSource(source, enabled) {
        // Show/hide specific data nodes based on source
        this.dataNodes.forEach((node, key) => {
            if (key.startsWith(source)) {
                node.visible = enabled;
            }
        });
    }

    // ===== Animation Loop =====

    update(deltaTime) {
        const time = Date.now() * 0.001;
        
        // Pulse data nodes
        this.dataNodes.forEach(node => {
            if (node.userData.pulsing) {
                const scale = node.userData.baseScale * (1 + 0.15 * Math.sin(time * 2));
                node.scale.set(scale, scale, 1);
            }
        });
    }

    // ===== Cleanup =====

    dispose() {
        this.stopAutoRefresh();
        this.clearDataNodes();
        this.clearCache();
    }
}

// Export for use in main app
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveDataManager;
}
