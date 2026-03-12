# Second Brain Discord Community — Setup Guide

## Server Settings

**Server Name:** Second Brain Builders
**Icon:** Brain emoji or custom logo (use dashboard preview as template)
**Banner:** Screenshot of 3D knowledge graph

---

## Channel Structure (copy-paste ready)

### Category: START HERE
```
#welcome          — Auto-message with 3 key actions
#introductions    — "What do you use for note-taking?"
#rules            — Community guidelines
#getting-started  — Quick setup guide for Second Brain
```

### Category: DISCUSSION
```
#general          — Main chat
#show-your-graph  — Share your knowledge graph screenshots
#help             — Technical help + troubleshooting
#feature-ideas    — Feature requests + voting
```

### Category: EVENTS
```
#announcements    — Product updates, launches
#upcoming-events  — Office hours, co-working sessions
#event-recaps     — Summaries of past events
```

### Category: VOICE
```
co-working        — Silent co-working (cameras optional)
office-hours      — Weekly live Q&A
```

---

## Welcome Message (paste into #welcome)

```
Welcome to **Second Brain Builders**! 🧠

We're a community of knowledge workers building AI-powered second brains.

**Get started:**
1. Introduce yourself in #introductions — tell us what note app you use
2. Check out the live demo: https://just-krispy.github.io/Return_Rover/brain-dashboard/
3. Share your graph in #show-your-graph

**Weekly events:**
- Tuesday 7 PM CT — Office Hours (voice)
- Saturday 10 AM CT — Co-working Session

Questions? Ask in #help — we're friendly!
```

---

## Roles

| Role | Color | Permissions | How to get |
|------|-------|-------------|------------|
| @Maker | Indigo #818cf8 | Admin | Manual |
| @Early Adopter | Green #4ade80 | Send messages, attach files | First 50 members |
| @Contributor | Cyan #22d3ee | Same + manage threads | After 10+ helpful posts |
| @Graph Master | Amber #fbbf24 | Same + events | Share 3+ graph screenshots |

---

## Bot Setup

### Archer Integration
- Archer can post daily vault stats to #announcements
- Add webhook URL to n8n for automated posts
- Endpoint: create n8n workflow that POSTs to Discord webhook

### Welcome DM (use Discord's built-in or MEE6)
```
Hey {username}! Welcome to Second Brain Builders 🧠

Here's your first-week checklist:
□ Introduce yourself in #introductions
□ Try the live demo (link in #welcome)
□ Share a screenshot of your notes setup
□ Join Tuesday Office Hours

See you around!
```

---

## First 30 Days Content Calendar

| Day | Post | Channel |
|-----|------|---------|
| 1 | "What's your biggest note-taking frustration?" | #general |
| 3 | Graph tip: "How connections form" | #show-your-graph |
| 5 | "Share your note-taking stack" | #general |
| 7 | Office Hours recap | #event-recaps |
| 10 | Feature spotlight: RAG search | #announcements |
| 14 | "Before/after: my vault in 2 weeks" | #show-your-graph |
| 21 | Community challenge: "Build your first automation" | #general |
| 28 | "Month 1 recap — what we learned" | #announcements |

---

*Ready to create — just needs Ryan's Discord account to execute.*
