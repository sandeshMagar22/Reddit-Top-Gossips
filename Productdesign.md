Reddit Top Gossips — Product Design Document
Author: Antigravity
Date: March 04, 2026
Version: 1.0

1. Overview
Reddit Top Gossips is a lightweight, interactive single-page web application that surfaces the top 10 posts from the most trending topic (subreddit) on Reddit at any given moment. Users can browse trending discussions, click through to original posts, and refresh results on demand — all within a clean, modern UI.

2. Goals
Goal	Description
Discoverability	Help users instantly discover what's trending on Reddit without navigating the platform itself
Simplicity	Keep the interface minimal and laser-focused on the top-10 content list
Responsiveness	Work seamlessly on desktop, tablet, and mobile
Real-time feel	Allow users to refresh results on demand to get the latest posts
3. Target Audience
Casual Reddit readers who want a quick daily digest
Content creators and marketers tracking trending topics
Anyone curious about what the internet is talking about right now
4. Core Features
4.1 Subreddit Selector
A search/dropdown input allowing the user to enter or pick a subreddit (e.g., r/worldnews, r/technology)
Defaults to a popular subreddit (e.g., r/popular or r/all) on first load
4.2 Top 10 Post Feed
Displays 10 cards, each representing a trending post
Each card shows:
Rank (1–10)
Post Title (clickable, opens Reddit post in a new tab)
Subreddit name (e.g., r/worldnews)
Upvote count with an upvote icon
Comment count with a comment icon
Post author (u/username)
Time posted (e.g., "3 hours ago")
Thumbnail/image (if available)
4.3 Refresh Button
A clearly visible "Refresh" button fetches the latest top-10 results from Reddit's API
Shows a loading spinner while data is being fetched
4.4 Trending Badge
Highlights the #1 post with a special "🔥 Trending" badge to draw attention
5. UI / UX Design
5.1 Layout
┌────────────────────────────────────────────┐
│  🔴 Reddit Top Gossips          [Refresh]  │
│  ─────────────────────────────────────     │
│  Subreddit: [ r/popular ▾ ]                │
│                                            │
│  #1 🔥  [Thumbnail] Post Title Here        │
│           r/worldnews · ↑ 42.3k · 💬 3.1k │
│           u/author · 5 hours ago           │
│  ─────────────────────────────────────     │
│  #2      [Thumbnail] Another Post Title    │
│           r/technology · ↑ 31k · 💬 1.2k  │
│  ...                                       │
└────────────────────────────────────────────┘
5.2 Visual Style
Theme: Dark mode by default, with a Reddit-inspired red accent (#FF4500)
Font: Inter or Roboto (Google Fonts)
Cards: Glassmorphism-style cards with subtle hover animations
Animations: Fade-in on load, smooth hover lift effect on cards
5.3 Responsive Behavior
Desktop: Two-column card grid
Mobile: Single-column stacked cards
6. Technical Design
6.1 Tech Stack
Layer	Technology
Structure	HTML5
Styling	Vanilla CSS (with CSS variables for theming)
Logic	Vanilla JavaScript (ES6+)
Data	Reddit JSON API (no auth required)
6.2 Reddit API Endpoint
Reddit provides a public, no-auth JSON feed for any subreddit:

GET https://www.reddit.com/r/{subreddit}/hot.json?limit=10
No API key required for read-only public data
Returns post title, score, author, thumbnail, num_comments, permalink, and created_utc
Response is standard JSON; no SDK needed
6.3 Data Flow
User selects subreddit
        ↓
JS calls Reddit JSON API
        ↓
Response parsed → top 10 posts extracted
        ↓
Cards rendered dynamically in the DOM
        ↓
User clicks card → opens Reddit post in new tab
6.4 Error Handling
Show a friendly error message if the subreddit is not found (e.g., r/invalidsubreddit)
Handle network failures with a retry prompt
Sanitize all user-provided subreddit input before making API calls
7. Out of Scope (v1.0)
User login or Reddit OAuth
Voting or commenting from within the app
Saving or bookmarking posts
Push notifications or auto-refresh
8. Verification Plan
Test	Method
API data loads correctly	Check network tab; verify 10 cards render
Subreddit switching works	Enter different subreddit names and confirm results change
Responsive layout	Test in Chrome DevTools at 375px, 768px, 1440px
External links open correctly	Click post titles; verify they open Reddit in a new tab
Error state	Enter a fake subreddit (e.g., r/thisdoesnotexist123)
9. Future Enhancements (v2.0+)
Auto-detect the most trending subreddit of the day using a trend signal
Add category filters (e.g., News, Gaming, Science)
Light/dark mode toggle
Share a post card as an image

Comment
Ctrl+Alt+M
