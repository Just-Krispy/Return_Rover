# Guided Tours System

## Overview

The Guided Tours system transforms the Second Brain dashboard into an interactive storytelling platform. Users can experience curated historical narratives with cinematic camera movements, voiceover narration, and contextual information panels.

## Features

✅ **4 Complete Tours:**
1. **The Road to WWI** - How Sarajevo triggered global war (5 stops, ~3 min)
2. **Appeasement to WWII** - The failure of appeasement 1936-1939 (5 stops, ~3 min)
3. **Nuclear Brinkmanship** - Cold War near-misses (3 stops, ~3 min)
4. **2026: Echoes of History** - Modern parallels to 1914 & 1939 (4 stops, ~3 min)

✅ **Cinematic Experience:**
- Smooth camera transitions to geographic locations
- Automatic fly-through sequences
- Configurable camera angles per stop

✅ **Voiceover Narration:**
- Web Speech API (text-to-speech)
- Adjustable speed (1x, 1.5x, 2x)
- Auto-advances to next stop when narration completes

✅ **Context Panels:**
- Rich historical information at each stop
- Markdown formatting (bold, lists, headings)
- Auto-opens with relevant content

✅ **Interactive Controls:**
- Play/Pause
- Previous/Next stop navigation
- Speed adjustment
- Progress bar
- Auto-hide controls (fade after 3s, show on hover)
- Exit tour anytime

✅ **Keyboard Shortcuts:**
- `Space` - Play/Pause
- `←` - Previous stop
- `→` - Next stop
- `Esc` - Exit tour

✅ **Progress Tracking:**
- Resume tours from last position (saved 24h)
- LocalStorage persistence

## File Structure

```
brain-dashboard/
├── js/
│   └── tours.js          # Tour engine + data
├── css/
│   └── tours.css         # Tour UI styles
└── index.html            # Integrated UI components
```

## Tour Data Structure

Each tour consists of:

```javascript
{
  id: 'tour-id',
  title: 'Tour Title',
  description: 'Brief description',
  duration: '~3 min',
  color: '#hex',         // Theme color
  icon: '🔥',            // Display icon
  stops: [
    {
      title: 'Stop Title',
      location: { lat: 48.2082, lon: 16.3738 },
      camera: { distance: 180, altitude: 40, angle: 30 },
      narration: 'Text read aloud via TTS',
      duration: 20,      // Seconds at this stop
      context: {
        title: 'Context Panel Title',
        content: `Markdown content with **bold**, lists, etc.`
      }
    },
    // ... more stops
  ]
}
```

## Usage

### Opening Tour Menu

Click the 🎬 button (bottom-right corner) to open the tour selection menu.

### Starting a Tour

Click any tour card to begin. The camera will fly to the first stop and narration will begin automatically.

### During a Tour

- **Pause/Resume**: Click pause button or press `Space`
- **Navigate**: Use Previous/Next buttons or arrow keys
- **Speed**: Click 1x/1.5x/2x buttons to adjust narration speed
- **Exit**: Click "Exit Tour" or press `Esc`

### Context Panel

The context panel appears on the right side with historical details. Click the ✕ to close it (narration continues).

## Adding New Tours

1. Open `js/tours.js`
2. Add a new tour object to the `TOURS` array
3. Define stops with locations, narration, and context
4. Save and refresh

Example:

```javascript
{
  id: 'my-new-tour',
  title: 'My Historical Journey',
  description: 'A brief teaser of what this tour covers',
  duration: '~4 min',
  color: '#22d3ee',
  icon: '🌍',
  stops: [
    {
      title: 'First Stop',
      location: { lat: 40.7128, lon: -74.0060 },
      camera: { distance: 200, altitude: 50, angle: 30 },
      narration: 'This is what the narrator will say...',
      duration: 15,
      context: {
        title: 'Historical Context',
        content: `**Date:** March 15, 1939

More details here...`
      }
    }
  ]
}
```

## Browser Compatibility

- **TTS**: Requires Web Speech API (Chrome, Edge, Safari)
- **3D**: Requires WebGL (all modern browsers)
- **LocalStorage**: For progress saving

## Performance

- Tours run on top of the existing 3D graph
- Camera animations use requestAnimationFrame
- Auto-hide controls reduce UI clutter
- Responsive design works on mobile (simplified layout)

## Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation fully supported
- Focus indicators on buttons/cards
- High contrast mode support
- Reduced motion support (disables animations)

## Future Enhancements

Possible additions:
- Background music support (optional cinematic score)
- Multi-language narration
- User-created tours (save/share via JSON)
- Tour analytics (completion rates, favorite stops)
- Interactive quizzes at tour end
- AR/VR mode for immersive tours

## Testing

**Test "The Road to WWI" tour:**
1. Open index.html
2. Click 🎬 button
3. Select "The Road to WWI"
4. Verify:
   - Camera flies to Sarajevo
   - Narration begins automatically
   - Context panel opens
   - Progress bar updates
   - Auto-advance after ~18s
   - All 5 stops complete
   - Exit returns to menu

## Known Issues

- **Safari TTS**: May require user interaction before first utterance
- **Mobile**: Context panel overlaps controls on small screens (intentional - swipe to dismiss)
- **Firefox**: Some voices may sound robotic (browser limitation)

## Credits

- **Design**: Inspired by museum audio tours and documentary storytelling
- **Data**: Historical events from public domain sources
- **TTS**: Web Speech API (browser native)
- **3D**: Three.js camera system

---

**Built with ❤️ for the Second Brain Mission Control**
