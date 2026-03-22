# 🎬 Quick Start: Guided Tours

## For Users

**Start a tour:**
1. Click the 🎬 button (bottom-right corner)
2. Choose a tour from the menu
3. Sit back and enjoy the narrated journey

**During a tour:**
- **Space** - Pause/Resume
- **← →** - Previous/Next stop
- **Click speed buttons** - Adjust narration speed
- **Esc** - Exit tour
- **Click ✕** - Close context panel (narration continues)

**Tours available:**
- 💥 The Road to WWI (~3 min, 5 stops)
- 📜 Appeasement to WWII (~3 min, 5 stops)
- ☢️ Nuclear Brinkmanship (~3 min, 3 stops)
- 🌍 2026: Echoes of History (~3 min, 4 stops)

---

## For Developers

**Test the system:**
```bash
# Open standalone test page
open brain-dashboard/test-tour.html

# Or test in main dashboard
open brain-dashboard/index.html
```

**Add a new tour:**
```javascript
// Edit js/tours.js, add to TOURS array:
{
  id: 'my-tour',
  title: 'My Tour Title',
  description: 'Brief description',
  duration: '~3 min',
  color: '#818cf8',
  icon: '🔥',
  stops: [
    {
      title: 'Stop 1',
      location: { lat: 40.7128, lon: -74.0060 },
      camera: { distance: 200, altitude: 50, angle: 30 },
      narration: 'Text to read aloud...',
      duration: 20, // seconds
      context: {
        title: 'Context Title',
        content: `**Markdown** content here...`
      }
    }
  ]
}
```

**Files:**
- `js/tours.js` - Tour data + engine
- `css/tours.css` - UI styles
- `index.html` - Integrated UI (search for "GUIDED TOURS UI")
- `test-tour.html` - Standalone test

**Key functions:**
- `initTourEngine(scene, camera, controls)` - Initialize system
- `startTour(tourId)` - Begin a tour
- `tourEngine.pause()` - Pause playback
- `tourEngine.setSpeed(rate)` - Adjust speed

**Browser API used:**
- Web Speech API (`window.speechSynthesis`)
- Three.js (camera animations)
- LocalStorage (progress tracking)

---

## Troubleshooting

**No narration?**
- Check browser supports Web Speech API (Chrome, Edge, Safari)
- Try clicking page first (some browsers require user interaction)

**Camera not moving?**
- Verify Three.js scene/camera passed to `initTourEngine()`
- Check console for errors

**Tours menu not appearing?**
- Verify `css/tours.css` loaded
- Verify `js/tours.js` loaded
- Check for JS errors in console

**Want to skip intro?**
- Press `→` to jump to next stop
- Or adjust speed to 2x

---

**For full documentation, see:**
- `TOURS_README.md` - User guide
- `GUIDED_TOURS_IMPLEMENTATION.md` - Developer docs
