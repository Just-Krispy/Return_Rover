# Live Data Integration - Real-Time OSINT Intelligence Feeds

Comprehensive real-time data layer for Second Brain dashboard with multiple OSINT (Open Source Intelligence) sources.

## 📊 Data Sources

### 1. IAEA Reports (Iran Enrichment Levels)
- **Source**: IAEA public reports, UN API (simulated for demo)
- **Update Frequency**: Weekly (IAEA releases)
- **Data Points**:
  - Enrichment percentage (20%, 60%, 90%)
  - Stockpile weight (kg of U-235)
  - Facility status (Natanz, Fordow)
  - Breakout time estimate
  - Historical trend

**Visualization**: Red/amber pulsing nodes on Iran facilities, escalation arrows

**API Integration** (Production):
```javascript
// Replace simulateIAEAData() with real scraper or API
const response = await fetch('https://api.un.org/iaea/enrichment');
const data = await response.json();
```

---

### 2. Oil Prices (Brent Crude Real-Time)
- **Source**: Alpha Vantage API (free tier: 5 calls/min, 500/day)
- **Update Frequency**: Every 5 minutes
- **Data Points**:
  - Current price (USD per barrel)
  - Price change (+/- from previous)
  - Percentage change
  - Daily high/low

**Visualization**: Live ticker at bottom of screen, trend arrows (↑/↓)

**API Setup**:
1. Get free API key from [Alpha Vantage](https://www.alphavantage.co/support/#api-key)
2. Replace `API_KEY = 'demo'` in `live-data-feeds.js`
3. Alternative: Use Twelve Data or Yahoo Finance

```javascript
// Alpha Vantage endpoint
const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=BZ=F&apikey=${API_KEY}`;
```

---

### 3. Flight Tracking (Military Aircraft via ADS-B)
- **Source**: OpenSky Network (free, public ADS-B data)
- **Update Frequency**: Real-time (every 5 minutes)
- **Data Points**:
  - Callsign (e.g., RCH234, NATO01)
  - GPS coordinates (lat/lon)
  - Altitude (meters/feet)
  - Velocity (km/h)
  - Heading (degrees)
  - Aircraft type (tanker, surveillance, transport)

**Visualization**: Blue markers for military aircraft, hotspot identification (Persian Gulf, Baltic Sea)

**API Integration**:
```javascript
// OpenSky Network (no auth required)
const url = 'https://opensky-network.org/api/states/all';
// Filter bounding box for specific region
const bbox = `?lamin=24&lomin=48&lamax=30&lomax=58`; // Persian Gulf
```

**Military Callsign Filters**:
- `RCH` - Reach (USAF air mobility)
- `CNV` - Convoy
- `NATO` - NATO operations
- `USAF`, `RAF`, `RSAF` - Air force designations

---

### 4. Shipping Traffic (Strait of Hormuz, Suez, Malacca)
- **Source**: MarineTraffic API or AIS Exchange (public endpoints)
- **Update Frequency**: Every 5 minutes
- **Data Points**:
  - Daily transit count
  - Oil tanker count
  - Commercial vessel count
  - Military presence
  - Congestion level (normal/high)

**Visualization**: Green ship markers, traffic density indicators

**Critical Chokepoints**:
- **Strait of Hormuz** (26.5667°N, 56.25°E) - 21% of global oil
- **Suez Canal** (30.5°N, 32.35°E) - 12% of global trade
- **Strait of Malacca** (1.43°N, 102.89°E) - 25% of traded goods

**API Integration**:
```javascript
// MarineTraffic (requires API key for production)
const url = `https://services.marinetraffic.com/api/exportvessels/${API_KEY}/v:5/`;
// Alternative: AIS Exchange (free tier)
const url = 'https://www.aishub.net/api/get-vessels/';
```

---

### 5. News Alerts (Breaking Geopolitical Events)
- **Source**: NewsAPI, RSS feeds (Reuters, BBC, AP)
- **Update Frequency**: Every 5 minutes
- **Data Points**:
  - Article title
  - Source (Reuters, BBC, etc.)
  - Publication timestamp
  - Severity level (high/medium/low)
  - Region (Middle East, Europe, Asia)

**Visualization**: Red alert badges on live ticker, severity-based filtering

**API Setup**:
1. Get free API key from [NewsAPI](https://newsapi.org/register)
2. Replace `API_KEY = 'demo'` in `live-data-feeds.js`
3. Free tier: 100 requests/day

```javascript
// NewsAPI endpoint
const query = 'iran OR ukraine OR israel OR taiwan';
const url = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&apiKey=${API_KEY}`;
```

**Severity Assessment**:
- **High**: nuclear, war, attack, invasion, crisis, escalation
- **Medium**: tension, threat, military, conflict, sanctions
- **Low**: diplomatic, meeting, statement

---

## 🎨 Visualization Features

### Pulsing Nodes
- **Active data sources** pulse with color-coded intensity
- **Red/Amber**: IAEA enrichment (escalating threat)
- **Blue**: Military flights (tracking surveillance/tankers)
- **Green**: Shipping traffic (trade flow)
- **Cyan**: Live data updates

### Alert Badges
- **Red dot** appears on nodes with new intel (last 10 minutes)
- Auto-fades after user views

### Trend Arrows
- **↑ Escalating**: Red background (conflict intensifying)
- **↓ De-escalating**: Green background (tensions reducing)
- **→ Stable**: Gray background (no change)

### Live Ticker
- **Bottom scrolling ticker** with real-time updates
- Icons per data type (☢️ IAEA, 🛢️ Oil, ✈️ Flights, 🚢 Shipping, 📰 News)
- Auto-scrolls every 60 seconds
- Manually scrollable

### Historical Charts
- **Enrichment over time**: Line chart (last 30 days)
- **Oil price trends**: Candlestick or line chart
- **Shipping density**: Bar chart (daily transits)
- Stored in `localStorage` (1000 entries max per metric)

---

## 🔧 Technical Implementation

### Architecture
```
LiveDataManager (live-data-feeds.js)
  ├── Data Fetchers (fetchIAEAData, fetchOilPrices, etc.)
  ├── Cache Layer (5-minute TTL, localStorage)
  ├── Visualization Layer (createDataNode, updateLiveTicker)
  ├── Auto-Refresh System (5-minute interval)
  └── Event Handlers (manual refresh, filter toggles)
```

### Cache Management
- **TTL**: 5 minutes (prevents excessive API calls)
- **Storage**: In-memory `Map` + localStorage for historical data
- **Invalidation**: Auto-clears on TTL expiry or manual refresh

### Error Handling
- **API failures**: Graceful fallback to simulated data
- **Rate limits**: Exponential backoff + user notification
- **CORS proxies**: Use if needed for browser-side fetching
- **Timeout**: 10-second fetch timeout with abort controller

### Performance Optimization
- **Lazy loading**: Only fetch data for visible nodes
- **Debouncing**: Manual refresh throttled to 1 req/10s
- **Batching**: Parallel `Promise.all()` for all sources
- **Cleanup**: Dispose old sprites/textures on refresh

---

## 🚀 Setup & Integration

### 1. Install Dependencies
No external packages needed — pure vanilla JS + Three.js (already loaded).

### 2. Add to Main Dashboard

In `index.html`, add before `</body>`:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/live-data.css">

<!-- JavaScript -->
<script src="js/live-data-feeds.js"></script>

<!-- UI Components -->
<!-- Paste content from live-data-ui.html -->
```

### 3. Initialize in Main App

In your main Three.js initialization:

```javascript
// After scene, camera, renderer setup
const liveDataManager = new LiveDataManager(scene, camera, dataLayersManager);

// Start auto-refresh (every 5 minutes)
liveDataManager.startAutoRefresh();

// Add to animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // ... existing rendering code ...
    
    liveDataManager.update(deltaTime);
    
    renderer.render(scene, camera);
}
```

### 4. Configure API Keys

Replace placeholder API keys in `js/live-data-feeds.js`:

```javascript
// Oil Prices (Alpha Vantage)
const API_KEY = 'YOUR_ALPHA_VANTAGE_KEY'; // Line 107

// News Alerts (NewsAPI)
const API_KEY = 'YOUR_NEWSAPI_KEY'; // Line 272
```

### 5. Enable Real API Calls

Remove `.catch(() => this.simulateIAEAData())` fallbacks in:
- `fetchIAEAData()` (Line 46)
- `fetchOilPrices()` (Line 110)
- `fetchFlightData()` (Line 165)
- `fetchNewsAlerts()` (Line 285)

---

## 🎮 User Interaction

### Manual Refresh
Click **Refresh** button in Live Data Panel to force immediate update.

### Data Filters
Toggle checkboxes to show/hide specific data sources:
- ☑️ IAEA Reports
- ☑️ Oil Prices
- ☑️ Flight Tracking
- ☑️ Shipping Traffic
- ☑️ News Alerts

### Node Click
Click any pulsing node on globe → **Data Detail Panel** slides in with:
- Current metrics
- Historical chart
- Related intelligence

### Hover Tooltip
Hover over node → Quick preview tooltip appears.

---

## 📈 Historical Data Storage

### localStorage Schema
```json
{
  "liveDataHistorical": {
    "iranEnrichment": [
      { "timestamp": 1711065600000, "enrichmentLevel": 60, "stockpile": 114.1 },
      ...
    ],
    "oilPrices": [
      { "timestamp": 1711065600000, "price": 85.40, "change": 2.1 },
      ...
    ],
    "shippingTraffic": [
      { "timestamp": 1711065600000, "region": "hormuz", "dailyTransits": 21 },
      ...
    ]
  }
}
```

**Max Entries**: 1000 per metric (auto-prunes older entries)

---

## 🔒 Security & Privacy

### No Sensitive Data
All data sources are **public OSINT** — no classified intel, no user tracking.

### API Key Protection
- Never commit API keys to Git
- Use environment variables or separate config file
- Consider server-side proxy for production (hides keys from client)

### CORS Handling
If API blocks browser requests, use CORS proxy:
```javascript
const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
const apiUrl = 'https://api.example.com/data';
const response = await fetch(proxyUrl + apiUrl);
```

---

## 🐛 Troubleshooting

### Issue: "API key invalid"
**Solution**: Verify API key is correct, check free tier limits not exceeded.

### Issue: "No data loading"
**Solution**: Check browser console for CORS errors, use simulated data mode for testing.

### Issue: "Nodes not appearing on globe"
**Solution**: Verify `scene` and `camera` are passed correctly to `LiveDataManager`.

### Issue: "Ticker not scrolling"
**Solution**: Ensure CSS animation is enabled, check `live-ticker-container` is visible.

### Issue: "localStorage quota exceeded"
**Solution**: Clear old historical data via browser DevTools → Application → Local Storage.

---

## 🧪 Testing

### Test with Iran Enrichment Node
1. Refresh dashboard
2. Zoom to Iran (33.7241°N, 51.3890°E)
3. Look for red/amber pulsing node at Natanz facility
4. Click node → Detail panel shows enrichment %, stockpile, trend
5. Verify historical chart displays (if data exists)

### Test Auto-Refresh
1. Open browser console
2. Wait 5 minutes
3. Should see: `"Refreshing all data sources..."`
4. Verify nodes update with new timestamps

### Test Manual Refresh
1. Click **Refresh** button in Live Data Panel
2. Button should show spinner animation
3. Console logs: `"Data refresh complete"`
4. Timestamp updates at bottom of panel

---

## 📦 File Structure

```
brain-dashboard/
├── js/
│   ├── live-data-feeds.js       # Core data fetching & visualization
│   └── data-layers.js            # Existing static layers
├── css/
│   ├── live-data.css             # Live data UI styles
│   └── data-layers.css           # Existing layer styles
├── live-data-ui.html             # UI components (integrate into index.html)
└── LIVE-DATA-README.md           # This file
```

---

## 🚢 Deployment

### GitHub Pages (Static)
1. Commit all files to `brain-dashboard/` folder
2. Push to `main` branch
3. Enable GitHub Pages in repo settings
4. **Note**: API keys will be visible in source — use server proxy for production

### Vercel (Recommended)
1. Deploy with serverless functions to hide API keys
2. Create `/api/iaea.js`, `/api/oil.js`, etc.
3. Update `fetchIAEAData()` to call `/api/iaea` instead of external API

Example serverless function (`/api/oil.js`):
```javascript
export default async function handler(req, res) {
  const API_KEY = process.env.ALPHA_VANTAGE_KEY;
  const response = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=BZ=F&apikey=${API_KEY}`);
  const data = await response.json();
  res.status(200).json(data);
}
```

---

## 🎯 Next Steps

1. **Replace simulated data** with real API calls (add your API keys)
2. **Integrate historical charting** (use Chart.js or D3.js)
3. **Add more data sources**:
   - Earthquake data (USGS)
   - Cyber threat feeds (AlienVault OTX)
   - Sanctions tracker (OFAC)
4. **Build notification system** (browser push for high-severity alerts)
5. **Deploy to production** (Vercel with serverless API proxies)

---

## 📄 License

Public OSINT data — free to use. Attribution appreciated but not required.

---

**Built with ❤️ for geopolitical intelligence visualization**
