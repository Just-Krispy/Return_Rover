# Rich Context Panels - Feature Documentation

## Overview

Rich Context Panels replace the simple tooltip system with a cinematic sliding panel that displays detailed, multimedia-rich information about knowledge graph nodes.

## Features

### Design
- **Glassmorphism**: Frosted dark background with subtle blur effect
- **Slide-in animation**: Smooth 300ms ease-out from the right
- **Responsive**: Works on mobile (full-width) and desktop (600px)
- **Collapsible sections**: All sections can be expanded/collapsed
- **Close interactions**: 
  - Click X button
  - Click outside panel
  - Press Escape key

### Sections

#### 1. Overview
- Node icon/emoji
- Title and subtitle (date, category, etc.)
- Key statistics grid (duration, players, outcome, casualties)
- Rich text description

#### 2. Timeline
- Vertical timeline with gradient line
- Key events with dates
- Event titles and descriptions
- Visual indicators for each event

#### 3. Analysis
- Game theory summary cards
- Nash equilibrium explanation
- "Analyze with Nash" button
  - Copies structured prompt to clipboard
  - Opens Cassandra AI in new tab
  - Shows success toast notification

#### 4. Media & Resources
- **Image Grid**: Lazy-loaded images with captions
- **External Links**: Styled links with icons
- Opens in new tab with `rel="noopener"` for security

## Usage

### Opening the Panel

**Double-click any node** in the 3D knowledge graph to open its context panel.

### Example Nodes

The dashboard includes two fully-featured example nodes:

1. **Cuban Missile Crisis** (☢️)
   - 13-day crisis timeline
   - Game theory analysis
   - Historical photos
   - Archive links

2. **Bay of Pigs** (🏝️)
   - 3-day invasion timeline
   - CIA miscalculation analysis
   - Declassified documents
   - Historical context

### Adding Your Own Rich Nodes

Edit the `RICH_NODE_DATA` object in `index.html`:

```javascript
const RICH_NODE_DATA = {
    'Your Node Name': {
        icon: '🎯',
        subtitle: 'Category • Context',
        description: 'Full description text...',
        stats: {
            'Stat 1': 'Value 1',
            'Stat 2': 'Value 2',
            // ... more stats
        },
        timeline: [
            { 
                date: 'Jan 1, 2024', 
                event: 'Event Title', 
                desc: 'Event description' 
            },
            // ... more events
        ],
        gameTheory: {
            summary: 'Game theory analysis...',
            nash: 'Nash equilibrium explanation...'
        },
        media: {
            images: [
                { 
                    url: 'https://example.com/image.jpg', 
                    caption: 'Image caption' 
                },
                // ... more images
            ],
            links: [
                { 
                    text: 'Link text', 
                    url: 'https://example.com' 
                },
                // ... more links
            ]
        }
    }
};
```

### Fallback Behavior

If a node **doesn't have rich data**, the panel still opens with:
- Basic node metadata (word count, connections, folder)
- Generic description
- "Analyze with Nash" button (always available)

## Technical Details

### CSS Classes

- `.context-panel-overlay` - Dark backdrop with blur
- `.context-panel` - Main sliding panel container
- `.context-section` - Collapsible section wrapper
- `.timeline` - Timeline container with gradient line
- `.analysis-card` - Game theory analysis card
- `.media-grid` - Responsive image grid
- `.media-link` - Styled external link

### JavaScript Functions

- `openContextPanel(nodeData)` - Opens panel with node data
- `closeContextPanel()` - Closes panel and clears state
- `toggleSection(sectionId)` - Collapses/expands sections
- `analyzeWithNash()` - Copies prompt and opens Nash

### Performance Optimizations

- **Lazy loading**: Images use `loading="lazy"` attribute
- **CSS transitions**: GPU-accelerated transforms
- **Icon caching**: Lucide icons re-rendered only on panel open

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Requires JavaScript enabled
- Falls back gracefully if features unsupported

## Future Enhancements

Potential additions for the context panel system:

- [ ] Video embed support (YouTube, Vimeo)
- [ ] Interactive charts (Chart.js integration)
- [ ] PDF preview inline
- [ ] Related nodes graph
- [ ] Edit mode (update node data)
- [ ] Export panel content as markdown
- [ ] Social sharing buttons
- [ ] Comments/annotations system

## Credits

Built for the **Second Brain Dashboard** as part of the Return_Rover project.

- Design: Glassmorphic dark mode with light theme support
- Icons: Lucide icons
- Images: Unsplash (demo content)
- Integration: Cassandra AI (Nash) for game theory analysis
