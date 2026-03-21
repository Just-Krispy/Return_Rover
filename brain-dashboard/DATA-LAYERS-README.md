# Data Layers System - Intelligence Overlays

Toggleable 3D visualization layers for geopolitical intelligence analysis in the Second Brain knowledge graph.

## Features

### 7 Information Layers

1. **Historical Crises (1913-2026)** - Red/yellow markers based on outcome
   - WWI/WWII major battles and treaties
   - Cold War crises (Cuban Missile Crisis, Berlin Airlift, etc.)
   - Modern conflicts (9/11, Iraq, Syria, Ukraine)
   - Color-coded: Yellow = positive outcome, Red = negative outcome

2. **Active Conflicts** - Pulsing red nodes with live data
   - Ukraine War (Bakhmut, Donetsk, Mariupol, Kherson hotspots)
   - Gaza Conflict (Gaza City, Khan Younis, Rafah)
   - Sudan Civil War (Khartoum, Darfur)
   - Animated pulsing effect for active combat zones

3. **Nuclear Facilities** - Orange triangle markers
   - Enrichment sites (Natanz, Fordow, Yongbyon)
   - Reactors (Bushehr, Dimona)
   - Missile bases (Plesetsk, Baikonur, Vandenberg)
   - Research/production facilities (Los Alamos, Savannah River, Sarov)

4. **Military Assets** - Blue square markers
   - US Carrier Strike Groups (Gerald R. Ford, Nimitz, Ronald Reagan)
   - Major airbases (Ramstein, Al Udeid, Diego Garcia, Guam)
   - Russian military (Tartus Naval Base, Hmeimim AB, Kaliningrad)
   - Chinese bases (Djibouti, South China Sea)
   - Air defense systems (S-400, Iron Dome, THAAD)

5. **Alliance Networks** - Color-coded connection lines
   - NATO (blue lines): Washington DC, London, Paris, Berlin, Warsaw
   - Russia-Iran Axis (red lines): Moscow, Tehran, Damascus
   - China Partnerships (yellow lines): Beijing, Islamabad, Pyongyang
   - Abraham Accords (purple lines): Jerusalem, Abu Dhabi, Manama
   - Animated particle flow along alliance connections

6. **Trade Routes** - Green flowing paths
   - Major shipping lanes (Suez Canal, Strait of Hormuz, Strait of Malacca)
   - Oil pipelines (Nord Stream, Druzhba Pipeline)
   - Animated flow particles representing trade movement

7. **Early Warning Indicators** - Flashing yellow star badges
   - Taiwan Strait Tension (high alert)
   - Korea DMZ Activity (medium alert)
   - Baltic Sea NATO Activity (medium alert)
   - Persian Gulf Monitoring (high alert)
   - Real-time blinking animation

## UI Controls

### Sidebar Panel
- **Toggle visibility**: Checkbox for each layer
- **Opacity sliders**: 0-100% transparency control
- **Collapse/expand**: Minimal footprint when collapsed
- **Mobile-friendly**: Bottom drawer on mobile devices

### Bulk Actions
- **Hide All**: Instantly disable all layers
- **Show All**: Re-enable all layers
- **Reset**: Restore default visibility and opacity

### Search & Filter
- Search across all layers (facilities, bases, crises, etc.)
- Auto-enable hidden layers when search matches
- Highlight matching markers on globe

### Legend
- Visual reference for all marker types and colors
- Connection line color coding
- Icon shape meanings

## Visual Design

### Animations
- **Smooth fade in/out** (300ms transitions)
- **Pulsing conflicts**: Active war zones pulse at 3 Hz
- **Flashing warnings**: Early warning indicators blink at 2 Hz
- **Flow particles**: Animated dots travel along connection lines
- **Highlight effect**: Search results temporarily scale up 1.5x

### Performance
- **LOD (Level of Detail)**: Only render visible elements
- **Sprite-based rendering**: Optimized for hundreds of markers
- **Selective updates**: Only animate enabled layers
- **GPU acceleration**: Three.js hardware acceleration

### Color Coding
- **Red**: Negative outcomes, active conflicts
- **Yellow/Amber**: Positive outcomes, warnings
- **Orange**: Nuclear facilities
- **Blue**: Military assets, NATO alliances
- **Green**: Trade routes, commerce
- **Purple**: Neutral alliances

## Technical Architecture

### Core Classes

**DataLayersManager** (`js/data-layers.js`)
- Layer registry and state management
- Marker creation (circle, square, triangle, hexagon, star shapes)
- Connection line generation with Bezier curves
- Pulsing/flashing animation logic
- Flow particle systems for animated routes
- Search and filter functionality

**LayerControlsUI** (`js/layer-controls.js`)
- Sidebar panel HTML generation
- Event listeners for toggles and sliders
- Bulk action handlers
- Search interface
- Mobile responsive layout
- Notification system

### Integration

```javascript
// Initialize layers manager
const layersManager = new DataLayersManager(scene, camera);

// Create UI controls
const layersUI = new LayerControlsUI(layersManager);

// Animation loop
function animate() {
    const deltaTime = clock.getDelta();
    layersManager.update(deltaTime);
    requestAnimationFrame(animate);
}
```

### Coordinate System
- **Lat/Lon → Vector3**: Spherical to Cartesian conversion
- **Radius offset**: Markers positioned at 1.01-1.02 units (above globe surface)
- **Bezier curves**: Connection lines arc above globe for visibility

## Data Sources

All geopolitical data is hardcoded for demo purposes. In production, layers would connect to:
- Live conflict monitoring APIs (ACLED, GDELT)
- Nuclear facility databases (IAEA, NTI)
- Military asset tracking (Flightradar24, MarineTraffic)
- Alliance treaty registries (NATO, UN)
- Trade flow data (IMF, World Bank)

## Mobile Optimization

- Touch-friendly controls (44px minimum tap targets)
- Bottom drawer sidebar on mobile
- Collapsible sections to save screen space
- Reduced particle counts on low-end devices
- Simplified shaders for better frame rates

## Browser Support

- Chrome/Edge 90+ (recommended)
- Firefox 88+
- Safari 14+
- Mobile browsers with WebGL support

## Future Enhancements

- [ ] Real-time data integration
- [ ] Time-series playback (scrub through history)
- [ ] Custom layer creation (user-defined overlays)
- [ ] Export/import layer configurations
- [ ] Heatmap overlays (conflict intensity, nuclear risk)
- [ ] 3D extrusion for data visualization
- [ ] VR mode support

## License

Part of the Return_Rover Second Brain dashboard.
