# Connection Visualization Test Guide

## Test: 1914 → 1939 → 2026 Pattern Thread

This test demonstrates the Historical Echoes connection type, showing multi-generational parallels between major conflicts.

### What to Look For

1. **Visual Elements**
   - **Cyan glowing lines** connecting three points:
     - Paris 1914 (WWI Begins)
     - Poland 1939 (WWII Begins)  
     - Kyiv/Washington 2026 (Ukraine/Taiwan crisis)
   - **Animated flow particles** moving along the connection lines
   - **Glow effect** on the cyan lines (unique to "Historical Echoes" type)

2. **Interactive Features**
   - **Hover over line** → Tooltip shows:
     - Connection type (ECHO)
     - From/To locations
     - Description of the parallel
   - **Click line** → Highlights both connected nodes
   - **Click node** → Shows all connections to that node

3. **Control Panel (Left Side)**
   - Toggle "Historical Echoes" on/off
   - See connection count update
   - Filter by connection type

### Connection Types in System

| Type | Color | Line Style | Description |
|------|-------|------------|-------------|
| **Causal** | Purple | Solid | Direct cause-and-effect (Versailles → Hitler → WWII) |
| **Alliance** | Blue | Solid | Geopolitical partnerships (USA-Israel, NATO) |
| **Influence** | Red | Solid | Proxy relationships (Iran → Hezbollah → Hamas) |
| **Pattern** | Orange | Dashed | Recurring dynamics (Appeasement 1938 → 2013 → 2014) |
| **Echo** | Cyan | Solid + Glow | Multi-generational parallels (1914 → 1939 → 2026) |

### Test Scenarios

#### Scenario 1: View All Connections
1. Load the dashboard
2. Connections should render automatically
3. Count visible connection lines (check stats panel)
4. Verify all 5 types are visible

#### Scenario 2: Filter by Type
1. Click "Historical Echoes" toggle in control panel
2. Cyan lines should disappear
3. Stats should update to show fewer visible connections
4. Click again to re-enable

#### Scenario 3: Hover Interaction
1. Move cursor over a cyan connection line
2. Tooltip should appear showing:
   - "ECHO" type badge
   - Connection endpoints
   - Historical parallel description
3. Cursor changes to pointer
4. Move away → tooltip disappears

#### Scenario 4: Click to Highlight
1. Click on a connection line
2. Both connected nodes should highlight
3. Other connections should dim (20% opacity)
4. Target connection should brighten (180% opacity)

#### Scenario 5: Animation
1. Watch particles flow along connection lines
2. Verify smooth movement (no stuttering)
3. Check pulse effect (particles should fade in/out)
4. Verify particles restart at beginning after reaching end

#### Scenario 6: Performance
1. Rotate globe with connections visible
2. Verify smooth rotation (60fps)
3. Connections should cull when off-screen (performance optimization)
4. No lag when toggling connection types

### Mobile Test
1. Touch a connection line
2. Tooltip should appear
3. Touch line again to highlight
4. Touch empty space to clear highlight

### Expected Data

**Echo Connections (4 total):**
1. 1914 WWI → 1939 WWII (Alliance cascade → world war)
2. 1939 WWII → 2026 Ukraine (Appeasement → territorial expansion)
3. 1914 Alliance Cascade → 2026 NATO Article 5 (Unintended escalation)
4. 1936 Militarization → 2024 China Buildup (Pre-war indicators)

**Particle Counts:**
- 8 particles per connection
- Varied speeds (0.002-0.003 progress per frame)
- Staggered starting positions

### Troubleshooting

**No connections visible:**
- Check browser console for errors
- Verify ConnectionsSystem class loaded
- Check "All Connections" toggle is enabled

**Poor performance:**
- Reduce browser zoom
- Close other tabs
- Check if frustum culling is working (connections off-screen should not render)

**Tooltip not showing:**
- Verify hover detection (cursor should change to pointer)
- Check z-index of tooltip (should be 10000)
- Ensure pointer-events: none on tooltip

**Particles not animating:**
- Check animate() function is being called
- Verify deltaTime is being passed
- Check particle userData has curve and progress values

### Success Criteria

✅ All 5 connection types visible
✅ Cyan glow effect on Historical Echoes
✅ 8 animated particles per connection
✅ Smooth 60fps animation
✅ Hover tooltips work correctly
✅ Click highlights work
✅ Filter toggles work
✅ Stats update correctly
✅ Mobile touch support works
✅ Performance stays smooth with all connections

### Code Verification

Check these files exist:
- `js/connections-system.js` (main logic)
- `js/connection-controls.js` (UI panel)

Check initialization in `index.html`:
- Script tags loaded before closing `</body>`
- ConnectionsSystem instantiated after scene creation
- animate() calls connectionsSystem.animate(deltaTime)
- g3 object contains connectionsSystem and connectionControls

### Next Steps

After successful testing:
1. Commit to git with message: "feat: connection visualization with animated flow particles"
2. Push to GitHub
3. Test on production (GitHub Pages)
4. Consider adding more connection types or historical events
