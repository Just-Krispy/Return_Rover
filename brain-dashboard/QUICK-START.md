# Cinematic Camera Quick Start 🎬

## What Changed?
Camera transitions are now **smooth and cinematic** (like Google Earth) instead of instant jumps.

## Key Features
- 🛫 **Arc paths** — Camera flies in curves, not straight lines
- ⏱️ **Smart speed** — Faster for short hops (1s), slower for long flights (3s)
- 🛬 **Smooth landing** — Slows down at start/end, speeds up in middle
- ✈️ **Banking** — Camera tilts during turns (airplane effect)
- 🔭 **Zoom** — Pulls back for long distances, dives in on arrival

## How to Test

### Desktop
1. Open `https://just-krispy.github.io/Return_Rover/brain-dashboard/`
2. Click any node → Watch smooth fly-to
3. Click distant node → Notice pull-back zoom mid-flight
4. Try autopilot (✈ button) → Scenic tour with smooth transitions
5. Drag to orbit → Smooth rotation
6. Scroll to zoom → Smooth distance changes

### Mobile
1. Open dashboard on phone/tablet
2. Tap node → Cinematic fly-to
3. Drag to orbit → Smooth rotation
4. Pinch to zoom → Smooth zoom
5. Autopilot works same as desktop

## Edge Cases to Try
- Click same node 5 times → Party mode (shakes all nodes)
- Manual drag during autopilot → Cancels tour
- Zoom during transition → Cancels flight
- Reset button (↻) → Flies home smoothly

## Keyboard Shortcuts
- `G` — Reset camera (fly home)
- `P` — Toggle autopilot tour
- `R` — Refresh dashboard
- `?` — Show all shortcuts

## Performance Expectations
- **Desktop**: 60fps smooth
- **Mobile**: 30fps+ smooth
- **Transition time**: 1-3 seconds auto-calculated

## Debugging in Browser Console
```javascript
// Check if camera is transitioning
cinematicCamera.isTransitioning

// Check transition progress
cinematicCamera.transitionProgress  // 0 to 1

// Current camera state
{
  theta: cinematicCamera.theta,
  phi: cinematicCamera.phi,
  distance: cinematicCamera.distance,
  lookAt: cinematicCamera.lookAt
}

// Manually trigger a flight
const randomNode = g3.nodeMeshes[Math.floor(Math.random() * g3.nodeMeshes.length)];
cinematicCamera.flyTo(
    Math.PI / 4,    // theta
    Math.PI / 3,    // phi
    100,            // distance
    randomNode.position
);
```

## Files Modified
- `camera-transitions.js` — New camera controller
- `index.html` — Integrated cinematic camera
- `test-camera.html` — Isolated test page

## Rollback (if needed)
```bash
cd Return_Rover
git revert HEAD  # Undo camera transitions
git push origin main
```

## Support
- Issues? Open GitHub issue
- Questions? Ping @Krispy on Discord

---

**TL;DR**: Click nodes → camera flies smoothly instead of jumping instantly. Enjoy the ride! 🚀
