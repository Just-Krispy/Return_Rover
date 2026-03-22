# Nash Integration - One-Click Game Theory Analysis

## Overview

The Nash Integration brings seamless game theory analysis directly into the Second Brain Dashboard. Instead of copying text and opening external tools, users can now analyze crisis nodes with a single click and see results in a beautiful sliding sidebar.

## Features

### 🎯 One-Click Analysis
- Click "Analyze with Nash" in any context panel
- Or click "🧠 Nash It" in the header for selected nodes
- Sidebar slides in from the right with live analysis

### 📊 Structured Results
Results are organized into four collapsible sections:

1. **Summary** - High-level game theory overview
2. **Game Theory** - Players, strategies, payoff matrix, Nash equilibrium
3. **Probabilities** - Outcome likelihood with visual bars
4. **Recommendations** - Strategic insights and impact ratings

### 💾 Export & Save
- **Copy to Clipboard** - Full markdown format
- **Save to Vault** - Store analysis in your Obsidian vault
- **Export as File** - Download `.md` file for external use

### 🎨 Beautiful UI
- 400px sliding sidebar (full-screen on mobile)
- Loading spinner with progress bar and time estimate
- Glassmorphic design matching dashboard theme
- Collapsible sections with smooth animations
- Light/dark theme compatible

### ⌨️ Keyboard Shortcuts
- **ESC** - Close sidebar
- Click outside to close
- Close button in header

## Usage

### Basic Workflow

1. **Double-click** any crisis node in the knowledge graph
2. Context panel opens with node details
3. Click **"Analyze with Nash"** in the Analysis section
4. Sidebar slides in and shows loading state
5. Results stream in with typewriter effect
6. Review analysis in collapsible sections
7. Export, save, or copy results

### Alternative: Header Button

1. **Select** a node in the 3D graph (click once)
2. Click **"🧠 Nash It"** in the header
3. Sidebar opens with analysis

### Compare Mode (Coming Soon)

Select 2-3 crisis nodes, then click "Compare with Nash" to generate comparative analysis.

## Technical Architecture

### Files Structure

```
brain-dashboard/
├── css/
│   └── nash-sidebar.css       # Sidebar styles
├── js/
│   └── nash-sidebar.js        # Sidebar logic & API integration
└── index.html                 # Updated with Nash integration
```

### API Integration

The sidebar supports two modes:

#### Option 1: Claude API (Recommended)

Set your API endpoint in `js/nash-sidebar.js`:

```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-api-endpoint.com/analyze',
    // ...
};
```

POST request format:
```json
{
    "prompt": "Generated analysis prompt...",
    "nodeId": "Cuban Missile Crisis"
}
```

Expected response:
```json
{
    "summary": "Brief overview...",
    "gameTheory": {
        "players": [...],
        "payoffMatrix": "Markdown table...",
        "nash": "Equilibrium explanation..."
    },
    "probabilities": [...],
    "recommendations": [...]
}
```

#### Option 2: Mock Analysis (Demo Mode)

For testing without an API, the sidebar includes a `generateMockAnalysis()` function that creates realistic-looking results based on the node data.

### Prompt Generation

The system auto-generates structured prompts from node data:

```markdown
# Game Theory Analysis Request

## Crisis: Cuban Missile Crisis

## Context
[Node description from RICH_NODE_DATA]

## Timeline
- **Oct 14, 1962**: U-2 spy plane discovers missiles
- **Oct 16, 1962**: Kennedy convenes EXCOMM
[...]

## Analysis Required
1. **Summary**: Brief overview from game theory perspective
2. **Key Players & Strategies**: Major actors and strategies
3. **Payoff Matrix**: Strategic interaction matrix
4. **Nash Equilibrium**: Identify and explain equilibrium
5. **Probability Analysis**: Likelihood of outcomes
6. **Strategic Recommendations**: What could've been done
```

### Data Format

Results are rendered as markdown with the following structure:

```javascript
{
    summary: "Overview text...",
    gameTheory: {
        players: [
            { 
                name: "United States", 
                strategies: ["Naval Blockade", "Air Strike", ...] 
            }
        ],
        payoffMatrix: "| US | USSR |\n|---|---|\n...",
        nash: "Equilibrium explanation..."
    },
    probabilities: [
        { 
            outcome: "Diplomatic Resolution", 
            probability: 65, 
            rationale: "Reasoning..." 
        }
    ],
    recommendations: [
        { 
            title: "Establish Backchannel", 
            description: "Details...", 
            impact: "HIGH" 
        }
    ]
}
```

## Customization

### Styling

Edit `css/nash-sidebar.css` to customize:

- Sidebar width (default: 400px)
- Colors and theme
- Animation timing
- Section styles
- Mobile breakpoints

### Behavior

Edit `js/nash-sidebar.js` configuration:

```javascript
const CONFIG = {
    API_ENDPOINT: null,              // Your API endpoint
    VAULT_PATH: '../vault/analysis/', // Save location
    SIDEBAR_WIDTH: '400px',          // Desktop width
    ANIMATION_DURATION: 300,         // Slide animation (ms)
    ESTIMATION_TIME: 15000,          // Progress bar duration (ms)
};
```

### Adding Custom Sections

To add a new section to the results:

1. Add section HTML in `createSidebarHTML()`
2. Add section render logic in `displayResults()`
3. Add section styles in `nash-sidebar.css`
4. Update `generateMarkdown()` to include new section

Example:

```javascript
// In displayResults()
const customContent = document.getElementById('nashCustomContent');
customContent.innerHTML = `<p>${results.customData}</p>`;
```

## Mobile Optimization

The sidebar is fully responsive:

- **Desktop**: 400px sidebar slides from right
- **Tablet**: 400px sidebar (may overlap content)
- **Mobile**: Full-screen overlay with close button

Mobile-specific features:
- Touch-friendly close gestures
- Full-height scrolling
- Stacked action buttons

## Performance

### Optimization Techniques

1. **Lazy initialization** - Sidebar only created when first used
2. **CSS transforms** - GPU-accelerated animations
3. **Progressive rendering** - Sections fade in sequentially
4. **Icon caching** - Lucide icons re-initialized on demand
5. **Markdown parsing** - Cached with `marked.js`

### Loading States

The sidebar includes three states:
1. **Loading** - Spinner with progress bar
2. **Results** - Rendered analysis sections
3. **Error** - Error message with retry button

Only one state is visible at a time (controlled by `.hidden` class).

## Testing

### Test with Cuban Missile Crisis

1. Double-click "☢️ Cuban Missile Crisis" node
2. Click "Analyze with Nash"
3. Verify sidebar slides in
4. Check all sections render correctly
5. Test export/copy/save buttons
6. Test ESC key and close button

### Test Cases

- [ ] Sidebar opens on button click
- [ ] Loading state shows spinner and progress
- [ ] Results render with proper formatting
- [ ] Sections are collapsible
- [ ] Export downloads `.md` file
- [ ] Copy adds markdown to clipboard
- [ ] Save triggers vault integration
- [ ] ESC closes sidebar
- [ ] Click outside closes sidebar
- [ ] Mobile view uses full screen
- [ ] Retry button works on error
- [ ] Icons render properly

## Future Enhancements

### Planned Features

- [ ] **Compare Mode** - Analyze 2-3 crises side-by-side
- [ ] **Streaming Results** - Real-time typewriter effect from API
- [ ] **Historical Comparisons** - Auto-suggest similar crises
- [ ] **Interactive Payoff Matrix** - Clickable cells with explanations
- [ ] **Probability Simulation** - Monte Carlo visualization
- [ ] **Strategy Explorer** - What-if scenario builder
- [ ] **AI Tuning** - Adjust analysis depth/focus
- [ ] **Citation Links** - Auto-link to source documents
- [ ] **Analysis History** - Browse past analyses
- [ ] **Share Analysis** - Generate shareable links

### API Improvements

- [ ] Streaming responses (SSE or WebSocket)
- [ ] Caching for repeated analyses
- [ ] Rate limiting with queue
- [ ] Batch analysis for compare mode
- [ ] Custom model selection (GPT-4, Claude, etc.)

### UI Enhancements

- [ ] Resizable sidebar (drag edge)
- [ ] Docked mode (keep sidebar open)
- [ ] Split view (sidebar + graph)
- [ ] PDF export with charts
- [ ] Print-friendly layout
- [ ] Presentation mode (full-screen slides)

## Troubleshooting

### Sidebar Not Opening

**Check console for errors:**
```javascript
// Should see:
"Nash sidebar initialized"
```

**Verify files loaded:**
- Check `css/nash-sidebar.css` exists
- Check `js/nash-sidebar.js` exists
- Check `marked.js` CDN loaded

### Analysis Fails

**Check API configuration:**
- Verify `CONFIG.API_ENDPOINT` is set
- Check API response format matches expected structure
- Enable console logs in `callNashAPI()`

**Test with mock data:**
- Comment out API call
- Uncomment `generateMockAnalysis()` call

### Styling Issues

**Check theme variables:**
```css
:root {
    --bg-surface: #18181b;
    --text-primary: #fafafa;
    /* ... verify all vars exist */
}
```

**Force refresh:**
- Clear browser cache
- Hard reload (Ctrl+Shift+R)

### Icons Not Rendering

**Verify Lucide loaded:**
```javascript
// In console:
typeof lucide !== 'undefined'  // Should be true
```

**Re-initialize icons:**
```javascript
lucide.createIcons();
```

## Credits

**Built for:** Second Brain Dashboard (Return_Rover)  
**Integration Date:** March 22, 2026  
**Dependencies:**
- Three.js (3D graph)
- Lucide Icons (UI icons)
- Marked.js (Markdown rendering)

**Design Inspiration:**
- Linear's command palette
- Notion's sidebar panels
- Obsidian's plugin architecture

## License

Same as parent project (Return_Rover).

---

*Nash Integration v1.0 - Making game theory accessible, one click at a time.* 🦞🧠
