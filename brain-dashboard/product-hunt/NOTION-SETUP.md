# Content Calendar — Notion Setup Guide

## Database: Content Calendar

### Properties

| Property | Type | Options |
|----------|------|---------|
| Title | Title | — |
| Status | Select | Draft, Scheduled, Published, Archived |
| Platform | Multi-select | YouTube, X/Twitter, LinkedIn, Blog, Product Hunt, Discord |
| Publish Date | Date | — |
| Content Type | Select | Thread, Video, Post, Article, Announcement |
| Topic | Select | Second Brain, PawsitiveID, Farm Credit, Vibe Coding, Personal |
| Asset URL | URL | Link to image/video |
| Published URL | URL | Fill after publishing |
| Notes | Rich text | Draft copy, hashtags, etc. |

---

## Views

1. **Calendar** — Default view, grouped by Publish Date
2. **By Platform** — Board view, grouped by Platform
3. **Pipeline** — Board view, grouped by Status (Draft → Scheduled → Published)
4. **This Week** — Table filtered to current week

---

## Zapier Automations (start with these 3)

### 1. Notion → X/Twitter
**Trigger:** Notion database item, Status changes to "Scheduled", Platform contains "X/Twitter"
**Action:** Post to X/Twitter with Title as tweet text
**Note:** Use Buffer or Typefully as intermediary for thread support

### 2. Notion → LinkedIn
**Trigger:** Same as above, Platform contains "LinkedIn"
**Action:** Post to LinkedIn via LinkedIn API (or Buffer)

### 3. Notion → Discord Announcement
**Trigger:** Status changes to "Published"
**Action:** Send Discord webhook to #announcements
**Template:** "New content: {Title} — {Published URL}"

---

## Content Workflow

```
1. Braindump idea → Notion (Status: Draft)
2. Write/polish → attach assets
3. Set Publish Date + Platform(s)
4. Change Status → "Scheduled"
5. Zapier fires on schedule
6. After publish → Status auto-updates to "Published"
7. Fill Published URL for tracking
```

---

## Quick-Start Steps

1. Create new Notion database with properties above
2. Create the 4 views
3. Sign up for Zapier (free tier: 100 tasks/month)
4. Connect: Notion + X + LinkedIn + Discord webhook
5. Test with a dummy post
6. Document webhook URLs in vault

---

## Future: Metrics Sync Back

Once publishing is working, add these properties:
- Likes/Impressions (Number) — manual or API sync
- Click-through (Number)
- Notes (after publish reflections)

n8n can automate metrics collection via Twitter/LinkedIn APIs → Notion API updates.

---

*Requires Ryan's Notion workspace + Zapier account to execute.*
