/**
 * Reddit Top Gossips — app.js
 * Fetches top 10 posts from Reddit's public JSON API
 * Author: Antigravity · v1.0
 */

/* ===========================
   STATE
   =========================== */
const state = {
  subreddit: 'popular',
  sort: 'hot',
  lastFetch: null,
  posts: []
};

/* ===========================
   DOM REF CACHE
   =========================== */
const $ = id => document.getElementById(id);

const dom = {
  input:         $('subreddit-input'),
  btnGo:         $('btn-go'),
  btnRefresh:    $('btn-refresh'),
  btnRetry:      $('btn-retry'),
  cardsGrid:     $('cards-grid'),
  loadingState:  $('loading-state'),
  errorState:    $('error-state'),
  errorMsg:      $('error-msg'),
  currentSub:    $('current-sub'),
  trendingItems: document.querySelectorAll('.trending-item'),
  qpBtns:        document.querySelectorAll('.qp-btn'),
  sortOpts:      document.querySelectorAll('.sort-opt'),
  navLinks:      document.querySelectorAll('.nav-link'),
  // stats
  statPosts:     $('stat-posts'),
  statUpvotes:   $('stat-upvotes'),
  statTopScore:  $('stat-top-score'),
  statAvg:       $('stat-avg'),
  statAvgC:      $('stat-avg-comments'),
  statRefreshT:  $('stat-refresh-time'),
  // community
  communityName: $('community-name'),
  communityDesc: $('community-desc'),
  communityBanner: $('community-banner'),
  csMmb:         $('cs-members'),
  csOnline:      $('cs-online'),
  btnVisit:      $('btn-visit'),
};

/* ===========================
   UTILS
   =========================== */
function formatNumber(n) {
  if (n === undefined || n === null) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'k';
  return String(n);
}

function timeAgo(epochSec) {
  const diff = Math.floor(Date.now() / 1000) - epochSec;
  if (diff < 60)      return 'just now';
  if (diff < 3600)    return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400)   return `${Math.floor(diff/3600)}h ago`;
  if (diff < 604800)  return `${Math.floor(diff/86400)}d ago`;
  return `${Math.floor(diff/604800)}w ago`;
}

function sanitizeSubreddit(raw) {
  return raw.replace(/^r\//i, '').replace(/[^a-zA-Z0-9_]/g, '').slice(0, 21);
}

function pickEmoji(post) {
  const title = (post.title || '').toLowerCase();
  if (post.is_video)                     return '🎬';
  if (post.post_hint === 'image')        return '🖼️';
  if (title.includes('news'))            return '📰';
  if (title.includes('game') || title.includes('gaming')) return '🎮';
  if (title.includes('science'))         return '🔬';
  if (title.includes('sport') || title.includes('football') || title.includes('nba')) return '⚽';
  if (title.includes('tech'))            return '💻';
  if (title.includes('music'))           return '🎵';
  if (title.includes('movie') || title.includes('film')) return '🎥';
  if (title.includes('art'))             return '🎨';
  return '📝';
}

/* ===========================
   REDDIT API
   =========================== */
async function fetchPosts(subreddit, sort = 'hot') {
  // Use Reddit's JSON+CORS endpoint
  const url = `https://www.reddit.com/r/${subreddit}/${sort}.json?limit=10&raw_json=1`;
  const resp = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    cache: 'no-store'
  });
  if (!resp.ok) {
    const msg = resp.status === 404
      ? `r/${subreddit} doesn't exist or is private.`
      : `Reddit returned status ${resp.status}. Try again later.`;
    throw new Error(msg);
  }
  const data = await resp.json();
  const children = data?.data?.children;
  if (!children || children.length === 0) throw new Error(`No posts found in r/${subreddit}.`);
  return children.map(c => c.data).slice(0, 10);
}

async function fetchSubredditInfo(subreddit) {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/about.json?raw_json=1`;
    const resp = await fetch(url, { headers: { 'Accept': 'application/json' } });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data?.data || null;
  } catch { return null; }
}

/* ===========================
   RENDER POSTS
   =========================== */
function renderPosts(posts) {
  dom.cardsGrid.innerHTML = '';

  posts.forEach((post, i) => {
    const rank = i + 1;
    const isTop = rank === 1;

    // Determine thumbnail
    let thumbHTML = '';
    const thumb = post.thumbnail;
    const hasThumb = thumb && thumb.startsWith('http');

    if (hasThumb) {
      thumbHTML = `
        <div class="post-thumb">
          <img src="${escapeAttr(thumb)}" alt="thumbnail" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'thumb-placeholder\\'>${pickEmoji(post)}</span>'" />
        </div>`;
    } else {
      thumbHTML = `<div class="post-thumb"><span class="thumb-placeholder">${pickEmoji(post)}</span></div>`;
    }

    // NSFW flag
    const nsfwTag = post.over_18
      ? `<span class="post-flag-nsfw">NSFW</span>`
      : '';

    // Flair
    const flair = post.link_flair_text
      ? `<span class="post-flair">${escapeHTML(post.link_flair_text)}</span>`
      : '';

    // Trending badge for #1
    const trendingBadge = isTop ? `<div class="trending-badge">🔥 TRENDING</div>` : '';

    const card = document.createElement('a');
    card.className = `post-card${isTop ? ' rank-1' : ''}`;
    card.href = `https://www.reddit.com${post.permalink}`;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.setAttribute('aria-label', `Post ${rank}: ${post.title}`);
    card.style.animationDelay = `${i * 0.045}s`;

    card.innerHTML = `
      <div class="post-rank">
        <span class="rank-num">#${rank}</span>
        ${trendingBadge}
      </div>
      ${thumbHTML}
      <div class="post-body">
        <div class="post-meta-top">
          <span class="post-subreddit">r/${escapeHTML(post.subreddit)}</span>
          <span class="dot-sep">•</span>
          <span class="post-author">u/${escapeHTML(post.author)}</span>
          <span class="dot-sep">•</span>
          <span class="post-time">${timeAgo(post.created_utc)}</span>
          ${nsfwTag}
        </div>
        <div class="post-title">${escapeHTML(post.title)}</div>
        <div class="post-stats">
          <span class="post-stat stat-upvotes">
            ${upvoteIcon()}
            ${formatNumber(post.score)}
          </span>
          <span class="post-stat">
            ${commentIcon()}
            ${formatNumber(post.num_comments)}
          </span>
          ${flair}
        </div>
      </div>
    `;

    dom.cardsGrid.appendChild(card);
  });
}

/* ===========================
   RENDER STATS
   =========================== */
function updateStats(posts) {
  const totalUpvotes = posts.reduce((s, p) => s + (p.score || 0), 0);
  const avgUpvotes   = Math.round(totalUpvotes / posts.length);
  const avgComments  = Math.round(posts.reduce((s,p) => s + (p.num_comments||0), 0) / posts.length);
  const topScore     = posts[0]?.score || 0;
  const now          = new Date();
  const timeStr      = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  dom.statPosts.textContent     = posts.length;
  dom.statUpvotes.textContent   = formatNumber(totalUpvotes);
  dom.statTopScore.textContent  = formatNumber(topScore);
  dom.statAvg.textContent       = formatNumber(avgUpvotes);
  dom.statAvgC.textContent      = formatNumber(avgComments);
  dom.statRefreshT.textContent  = timeStr;
}

/* ===========================
   RENDER COMMUNITY INFO
   =========================== */
function updateCommunityInfo(info, subreddit) {
  dom.communityName.textContent = `r/${subreddit}`;
  dom.btnVisit.href = `https://www.reddit.com/r/${subreddit}`;
  dom.btnVisit.textContent = `Visit r/${subreddit} ↗`;

  if (info) {
    dom.communityDesc.textContent = info.public_description || info.description?.slice(0, 120) || `The r/${subreddit} community on Reddit.`;
    dom.csMmb.textContent    = formatNumber(info.subscribers);
    dom.csOnline.textContent = formatNumber(info.accounts_active);

    // Banner color from banner_img or key color
    const keyColor = info.primary_color || info.key_color || '#1a0a00';
    dom.communityBanner.style.background = `linear-gradient(135deg, ${keyColor}55, ${keyColor}aa)`;
  } else {
    dom.communityDesc.textContent = `Browse the top posts from r/${subreddit}.`;
    dom.csMmb.textContent    = '—';
    dom.csOnline.textContent = '—';
  }
}

/* ===========================
   MAIN LOAD FLOW
   =========================== */
async function load(subreddit, sort) {
  subreddit = sanitizeSubreddit(subreddit);
  if (!subreddit) return;

  state.subreddit = subreddit;
  state.sort      = sort;

  // Update UI labels
  dom.currentSub.textContent = `r/${subreddit}`;
  dom.input.value = '';
  dom.input.placeholder = `r/${subreddit}`;

  // Activate quick-picks
  dom.qpBtns.forEach(b => b.classList.toggle('active', b.dataset.sub === subreddit));
  dom.trendingItems.forEach(li => li.classList.toggle('active', li.dataset.sub === subreddit));

  // Show loading
  showLoading();

  // Refresh button animation
  dom.btnRefresh.classList.add('loading');

  try {
    const [posts, info] = await Promise.all([
      fetchPosts(subreddit, sort),
      fetchSubredditInfo(subreddit)
    ]);

    state.posts = posts;
    state.lastFetch = Date.now();

    hideLoading();
    hideError();
    renderPosts(posts);
    updateStats(posts);
    updateCommunityInfo(info, subreddit);

  } catch (err) {
    hideLoading();
    showError(err.message);
  } finally {
    dom.btnRefresh.classList.remove('loading');
  }
}

/* ===========================
   SHOW/HIDE HELPERS
   =========================== */
function showLoading() {
  dom.loadingState.style.display = 'flex';
  dom.cardsGrid.style.display    = 'none';
  dom.errorState.style.display   = 'none';
}
function hideLoading() {
  dom.loadingState.style.display = 'none';
  dom.cardsGrid.style.display    = 'flex';
}
function showError(msg) {
  dom.errorState.style.display = 'flex';
  dom.errorMsg.textContent = msg || 'Something went wrong. Please try again.';
  dom.cardsGrid.style.display = 'none';
}
function hideError() {
  dom.errorState.style.display = 'none';
}

/* ===========================
   ICONS (inline SVG)
   =========================== */
function upvoteIcon() {
  return `<svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 4 L20 14 H14 V20 H10 V14 H4 Z"/></svg>`;
}
function commentIcon() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`;
}

/* ===========================
   ESCAPE helpers
   =========================== */
function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
function escapeAttr(str) {
  return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/* ===========================
   EVENT LISTENERS
   =========================== */

// Refresh button
dom.btnRefresh.addEventListener('click', () => load(state.subreddit, state.sort));

// Retry button
dom.btnRetry.addEventListener('click', () => load(state.subreddit, state.sort));

// Search / Go
function handleGo() {
  const raw = dom.input.value.trim();
  if (!raw) return;
  load(raw, state.sort);
}
dom.btnGo.addEventListener('click', handleGo);
dom.input.addEventListener('keydown', e => { if (e.key === 'Enter') handleGo(); });

// Quick picks
dom.qpBtns.forEach(btn => {
  btn.addEventListener('click', () => load(btn.dataset.sub, state.sort));
});

// Trending sidebar items
dom.trendingItems.forEach(li => {
  li.addEventListener('click', () => load(li.dataset.sub, state.sort));
});

// Sort options
dom.sortOpts.forEach(opt => {
  opt.addEventListener('click', () => {
    dom.sortOpts.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    load(state.subreddit, opt.dataset.sort);
  });
});

// Nav links (sort shortcuts)
const sortMap = { 'nav-hot': 'hot', 'nav-top': 'top', 'nav-new': 'new', 'nav-rising': 'rising' };
dom.navLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    dom.navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const sort = sortMap[link.id] || 'hot';
    // Sync sort-opts
    dom.sortOpts.forEach(o => o.classList.toggle('active', o.dataset.sort === sort));
    load(state.subreddit, sort);
  });
});

/* ===========================
   INIT
   =========================== */
load('popular', 'hot');
