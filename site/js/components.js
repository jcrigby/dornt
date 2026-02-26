// Dornt UI Components — Vanilla JS rendering

// ── Icons (inline SVG from Lucide) ──
const icons = {
  layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/></svg>',
  newspaper: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>',
  triangleAlert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  scale: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  brain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>',
  trendingUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>',
  network: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  circleCheck: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  circleX: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  quote: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>',
};

function icon(name, size = 16) {
  return `<span class="icon" style="width:${size}px;height:${size}px;display:inline-flex">${icons[name] || ''}</span>`;
}

// ── Time formatting ──
function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ── Story Card ──
function renderStoryCard(story) {
  const sourcesHtml = story.topSources
    .slice(0, 3)
    .map(s => `<span class="source-tag">${s}</span>`)
    .join('');

  return `
    <a href="story.html#${story.id}" class="story-card">
      <div class="story-card-header">
        <span class="importance-badge importance-${importanceLevel(story.importance)}">${story.importance}</span>
        <span class="story-meta">${story.articleCount} articles &middot; ${story.sourceCount} sources</span>
      </div>
      <h3 class="story-title">${escapeHtml(story.title)}</h3>
      <p class="story-summary">${escapeHtml(story.summary || '').slice(0, 180)}</p>
      <div class="story-footer">
        <div class="source-tags">${sourcesHtml}</div>
        <span class="story-time">${timeAgo(story.updatedAt)}</span>
      </div>
    </a>
  `;
}

// ── Story Detail Sections ──
function renderSynthesis(synthesis) {
  if (!synthesis) return '<p class="empty-state">Analysis pending...</p>';

  const citationsMap = {};
  synthesis.citations.forEach(c => { citationsMap[c.index] = c; });

  // Replace [N] markers with tooltip spans
  const narrative = synthesis.narrative.replace(/\[(\d+)\]/g, (match, num) => {
    const c = citationsMap[parseInt(num)];
    if (!c) return match;
    return `<a href="${escapeAttr(c.url)}" class="citation" title="${escapeAttr(c.source)}: ${escapeAttr(c.title)}" target="_blank">[${num}]</a>`;
  });

  const devs = synthesis.keyDevelopments
    .map(d => `<li>${escapeHtml(d)}</li>`)
    .join('');

  return `
    <div class="section synthesis-section">
      <h2>${icon('newspaper', 20)} State of the Story</h2>
      <div class="narrative">${narrative}</div>
      <h3>Key Developments</h3>
      <ul class="key-developments">${devs}</ul>
      <div class="section-meta">Generated ${timeAgo(synthesis.generatedAt)}</div>
    </div>
  `;
}

function renderClaims(claims) {
  if (!claims || claims.length === 0) return '';

  const rows = claims.map(c => {
    const statusIcon = c.status === 'undisputed' ? icon('circleCheck', 14) :
                       c.status === 'disputed' ? icon('circleX', 14) :
                       icon('triangleAlert', 14);
    return `
      <div class="claim claim-${c.status}">
        <div class="claim-status">${statusIcon} ${c.status}</div>
        <div class="claim-text">${escapeHtml(c.text)}</div>
        <div class="claim-sources">
          ${c.supportingSources.map(s => `<span class="source-support">${escapeHtml(s)}</span>`).join('')}
          ${c.disputingSources.map(s => `<span class="source-dispute">${escapeHtml(s)}</span>`).join('')}
        </div>
      </div>
    `;
  }).join('');

  return `
    <div class="section claims-section">
      <h2>${icon('scale', 20)} Claims Tracker</h2>
      <div class="claims-list">${rows}</div>
    </div>
  `;
}

function renderCoverage(coverage) {
  if (!coverage) return '';

  const frames = coverage.frames.map(f => `
    <div class="frame">
      <h4>${escapeHtml(f.name)}</h4>
      <p>${escapeHtml(f.description)}</p>
      <div class="frame-sources">${f.sources.map(s => `<span class="source-tag">${escapeHtml(s)}</span>`).join('')}</div>
      <div class="frame-emphasis">${escapeHtml(f.emphasis)}</div>
    </div>
  `).join('');

  const outliers = coverage.outlierPerspectives.map(p => `<li>${escapeHtml(p)}</li>`).join('');
  const missing = coverage.missingContext.map(m => `<li>${escapeHtml(m)}</li>`).join('');

  return `
    <div class="section coverage-section">
      <h2>${icon('layers', 20)} Coverage Lens</h2>
      <div class="frames-grid">${frames}</div>
      ${outliers ? `<h3>Outlier Perspectives</h3><ul>${outliers}</ul>` : ''}
      ${missing ? `<h3>Missing Context</h3><ul>${missing}</ul>` : ''}
    </div>
  `;
}

function renderCommunity(community) {
  if (!community) return '';

  const sentimentColor = community.sentimentScore > 0.2 ? 'positive' :
                         community.sentimentScore < -0.2 ? 'negative' : 'neutral';

  const quotes = community.notableQuotes.map(q => `
    <blockquote class="community-quote">
      <p>${escapeHtml(q.text)}</p>
      <cite>u/${escapeHtml(q.author)} in r/${escapeHtml(q.subreddit)} (${q.score} pts)</cite>
    </blockquote>
  `).join('');

  const themes = community.keyThemes.map(t => `<span class="theme-tag">${escapeHtml(t)}</span>`).join('');

  return `
    <div class="section community-section">
      <h2>${icon('users', 20)} Community Pulse</h2>
      <div class="sentiment-bar sentiment-${sentimentColor}">
        <span class="sentiment-label">${community.sentiment}</span>
        <span class="sentiment-score">${community.sentimentScore.toFixed(2)}</span>
        <span class="discussion-volume">${community.discussionVolume} comments</span>
      </div>
      <div class="community-themes">${themes}</div>
      <div class="community-quotes">${quotes}</div>
    </div>
  `;
}

function renderDeepAnalysis(analysis) {
  if (!analysis) return '';

  const stakeholders = analysis.stakeholders.map(s => `
    <div class="stakeholder">
      <div class="stakeholder-name">${escapeHtml(s.name)} <span class="influence influence-${s.influence}">${s.influence}</span></div>
      <div class="stakeholder-role">${escapeHtml(s.role)}</div>
      <div class="stakeholder-position">${escapeHtml(s.position)}</div>
    </div>
  `).join('');

  const predictions = analysis.predictions.map(p => `
    <div class="prediction prediction-${p.likelihood}">
      <div class="prediction-text">${escapeHtml(p.text)}</div>
      <div class="prediction-meta">
        <span class="likelihood">${p.likelihood}</span>
        <span class="timeframe">${escapeHtml(p.timeframe)}</span>
      </div>
    </div>
  `).join('');

  return `
    <div class="section deep-analysis-section">
      <h2>${icon('brain', 20)} Deep Analysis</h2>
      <h3>Stakeholders</h3>
      <div class="stakeholders-grid">${stakeholders}</div>
      <h3>Predictions</h3>
      <div class="predictions-list">${predictions}</div>
      ${analysis.historicalContext ? `<h3>Historical Context</h3><p>${escapeHtml(analysis.historicalContext)}</p>` : ''}
      ${analysis.implications.length ? `<h3>Implications</h3><ul>${analysis.implications.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>` : ''}
    </div>
  `;
}

function renderArticleList(articles) {
  if (!articles || articles.length === 0) return '';

  const items = articles.map(a => `
    <a href="${escapeAttr(a.url)}" class="article-item" target="_blank" rel="noopener">
      <span class="article-source">${escapeHtml(a.source)}</span>
      <span class="article-title">${escapeHtml(a.title)}</span>
      <span class="article-time">${timeAgo(a.publishedAt)}</span>
    </a>
  `).join('');

  return `
    <div class="section articles-section">
      <h2>${icon('newspaper', 20)} Sources (${articles.length})</h2>
      <div class="articles-list">${items}</div>
    </div>
  `;
}

// ── Storyline Card ──
function renderStorylineCard(storyline) {
  return `
    <div class="storyline-card">
      <div class="storyline-status storyline-${storyline.status}">${storyline.status}</div>
      <h3>${escapeHtml(storyline.title)}</h3>
      <p>${escapeHtml(storyline.description)}</p>
      <div class="storyline-meta">
        ${storyline.clusterCount || storyline.clusterIds?.length || 0} connected stories
      </div>
    </div>
  `;
}

// ── Briefing ──
function renderBriefing(briefing) {
  const stories = briefing.topStories.map(s => `
    <div class="briefing-story">
      <span class="briefing-importance">${s.importance}</span>
      <div>
        <a href="story.html#${s.clusterId}" class="briefing-title">${escapeHtml(s.title)}</a>
        <p class="briefing-summary">${escapeHtml(s.summary)}</p>
      </div>
    </div>
  `).join('');

  const themes = briefing.emergingThemes.map(t => `<li>${escapeHtml(t)}</li>`).join('');
  const shifts = briefing.notableShifts.map(s => `<li>${escapeHtml(s)}</li>`).join('');

  return `
    <div class="briefing">
      <h1>${escapeHtml(briefing.headline)}</h1>
      <div class="briefing-date">${briefing.date}</div>
      <div class="briefing-stories">${stories}</div>
      ${themes ? `<h2>Emerging Themes</h2><ul>${themes}</ul>` : ''}
      ${shifts ? `<h2>Notable Shifts</h2><ul>${shifts}</ul>` : ''}
    </div>
  `;
}

// ── Loading / Error states ──
function renderLoading() {
  return '<div class="loading"><div class="spinner"></div><p>Loading...</p></div>';
}

function renderError(message) {
  return `<div class="error-state">${icon('triangleAlert', 24)}<p>${escapeHtml(message)}</p></div>`;
}

// ── Utilities ──
function importanceLevel(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function escapeAttr(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Export for non-module usage
window.dorntUI = {
  renderStoryCard,
  renderSynthesis,
  renderClaims,
  renderCoverage,
  renderCommunity,
  renderDeepAnalysis,
  renderArticleList,
  renderStorylineCard,
  renderBriefing,
  renderLoading,
  renderError,
  icon,
  timeAgo,
};
