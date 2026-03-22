# Nash Integration - Quick Start Guide

## 🚀 Getting Started (30 seconds)

### Option 1: Test Page
1. Open `test-nash.html` in your browser
2. Click "Cuban Missile Crisis" button
3. Watch the sidebar slide in with analysis
4. Try export/copy/save buttons
5. Press ESC to close

### Option 2: Main Dashboard
1. Open `index.html` in your browser
2. Double-click the "☢️ Cuban Missile Crisis" node in the 3D graph
3. Context panel opens
4. Scroll to **Analysis** section
5. Click **"Analyze with Nash"** button
6. Sidebar slides in with game theory analysis

### Option 3: Header Button
1. Open `index.html`
2. Single-click any node to select it (node glows)
3. Click **"🧠 Nash It"** in the header
4. Sidebar opens with analysis

## 📖 What You'll See

### Loading State (3 seconds)
- Purple spinner animation
- Progress bar filling up
- Estimated time countdown
- "Analyzing with Nash..." message

### Results (4 sections)
1. **📄 Summary** - High-level game theory overview
2. **🔀 Game Theory** - Players, strategies, payoff matrix, Nash equilibrium
3. **📊 Probabilities** - Outcome likelihoods with visual bars
4. **💡 Recommendations** - Strategic insights with impact badges

### Actions (bottom of sidebar)
- **Copy** - Copies full analysis to clipboard (markdown)
- **Save** - Saves to vault (downloads for now)
- **Export** - Downloads as `.md` file

## 🎮 Controls

- **ESC** - Close sidebar
- **Click outside** - Close sidebar
- **X button** (top-right) - Close sidebar
- **Click section headers** - Collapse/expand sections
- **Scroll** - Long analysis results are scrollable

## 🧪 Testing Checklist

Quick validation (2 minutes):

- [ ] Sidebar slides in smoothly
- [ ] Loading spinner appears
- [ ] Progress bar animates
- [ ] Results render in 4 sections
- [ ] All sections are collapsible
- [ ] Copy button copies to clipboard
- [ ] Export button downloads file
- [ ] ESC closes sidebar
- [ ] Icons render properly (Lucide)
- [ ] Responsive on mobile (resize browser)

## 🔧 Customization

### Change Sidebar Width
Edit `css/nash-sidebar.css`:
```css
.nash-sidebar {
    width: 500px; /* Change from 400px */
}
```

### Change Loading Time Estimate
Edit `js/nash-sidebar.js`:
```javascript
const CONFIG = {
    ESTIMATION_TIME: 20000, // Change from 15000 (20 seconds)
};
```

### Add Your API Endpoint
Edit `js/nash-sidebar.js`:
```javascript
const CONFIG = {
    API_ENDPOINT: 'https://your-api.com/analyze',
};
```

## 🐛 Troubleshooting

### Sidebar doesn't open
**Check console for errors:**
- F12 → Console tab
- Should see: "Nash sidebar initialized"

**Verify files loaded:**
- Check Network tab for `nash-sidebar.css` and `nash-sidebar.js`
- Check `marked.js` loaded from CDN

### Icons not showing
**Re-initialize Lucide:**
```javascript
lucide.createIcons();
```

### Results don't render
**Check `marked` is loaded:**
```javascript
console.log(typeof marked); // Should be 'object'
```

### Analysis takes too long
**Currently using mock data** (3 second delay).  
For real API, response time depends on your endpoint.

## 📱 Mobile Tips

- Sidebar becomes full-screen on phones
- Swipe down won't close (use close button or ESC)
- All sections stack vertically
- Action buttons stack too

## 🎯 Next Steps

1. ✅ Test with `test-nash.html`
2. ✅ Test in main dashboard
3. Connect real API (optional)
4. Customize styling (optional)
5. Add more test nodes with rich data

## 📚 Full Documentation

For complete details, see:
- `NASH_INTEGRATION.md` - Full feature documentation
- `NASH_IMPLEMENTATION_SUMMARY.md` - Implementation details

## 💬 Support

**Questions?** Check the main docs or inspect the code:
- `js/nash-sidebar.js` - All logic (well-commented)
- `css/nash-sidebar.css` - All styles (organized)

---

**Ready to analyze?** Open `test-nash.html` and click "Cuban Missile Crisis"! 🧠🚀
