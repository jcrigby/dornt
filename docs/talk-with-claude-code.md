# Building a News Intelligence Platform with Claude Code

*A conference talk script — the AI-assisted approach*

---

## Slide 1: The Premise

I'm going to show you how I built a full news intelligence platform — RSS ingestion, AI-powered clustering and analysis, static site generation, automated daily deployment — in a single afternoon.

Not by writing boilerplate. Not by copy-pasting from Stack Overflow. By having a conversation.

The tool is Claude Code, Anthropic's CLI agent. It reads your codebase, writes code, runs commands, and iterates with you. Think of it as pair programming where your partner has read every documentation page you haven't.

The result is live at [dornt.com](https://dornt.com). Let me show you how we got there.

---

## Slide 2: The Spark

It started with a LinkedIn post. [Max Frazer](https://www.linkedin.com/in/maxfrazer/) shared a link to [Grond.ai](https://grond.ai), a news intelligence platform that clusters articles and synthesizes stories using AI. I looked at it and thought: I could build that. Not copy it — but take the concept and see how far I could get in an afternoon with Claude Code.

That's how most side projects start, right? You see something cool and think "what if I built my own?"

## Slide 3: Starting with a Plan

The first thing I did was describe what I wanted. Not in code. Not in a spec. Just in English:

> "I want a news intelligence platform. It should ingest RSS feeds and Reddit posts, cluster related articles using embeddings, analyze each cluster with an LLM to produce synthesis with citations, claims tracking, and coverage analysis. Deploy as a static site on GitHub Pages, rebuilt daily by Actions."

Claude Code's response? It asked to enter "plan mode." In plan mode, it:

1. Explored possible architectures
2. Identified the key files it would need to create
3. Laid out the implementation in stages
4. Asked me which embedding provider I preferred

I said "OpenRouter for everything" and approved the plan. Then it started building.

---

## Slide 4: The Conversation is the IDE

Here's what working with Claude Code actually looks like. It's a terminal. You type. It acts.

**Me:** "Implement the plan"

It creates `pipeline/src/config.ts`, `pipeline/src/ingestion/rss-fetcher.ts`, types, the Express server, all the analysis stages. Dozens of files. I'm watching it work, occasionally glancing at what it's writing.

**Me:** "Try running it with npm run dev"

It runs the command. Server starts. First bug:

```
Error [ERR_MODULE_NOT_FOUND]: Cannot find package 'express'
```

**Claude Code:** "Need to install dependencies first." Runs `npm install`. Server starts. Next issue — port 8080 is already in use. It finds the PID and asks if it should kill it. I say yes. Server starts cleanly.

This is the rhythm. You talk, it acts, things break, it fixes them. But each cycle takes seconds, not minutes.

---

## Slide 5: When Things Go Wrong (They Always Do)

The pipeline had real bugs. Not toy bugs. Let me walk you through three of them, because this is where Claude Code earns its keep.

**Bug 1: The Off-By-One**

After ingestion, clustering returned "No new articles to cluster." I told Claude Code. It didn't guess — it wrote a debug script:

```javascript
const files = fs.readdirSync(dir);
const listed = await listFiles(bucket, prefix);
files.forEach((f, i) => console.log(f, '→', listed[i]));
```

Output showed filenames with the first character missing. `a1b2c3.json` became `1b2c3.json`. Claude Code traced it to `localListFiles` in the storage adapter:

```typescript
// Bug: when prefix ends with '/', dir.length + 1 skips one too many
const relPath = fullPath.slice(dir.length + 1);

// Fix:
const stripped = dir.endsWith('/') ? dir.length : dir.length + 1;
const relPath = fullPath.slice(stripped);
```

One character. Would have taken me an hour of staring at path strings.

**Bug 2: The Model That Doesn't Exist**

Clustering needed embeddings. The config specified `nomic-ai/nomic-embed-text-v1.5`. OpenRouter returned 404. Claude Code queried the OpenRouter API to list available embedding models, found `openai/text-embedding-3-small`, swapped it in, and re-ran. Fixed in under a minute.

**Bug 3: The Markdown Fence**

Analysis stage: "0 clusters analyzed." Logs showed JSON parse errors. Claude Code checked the raw LLM responses — they were valid JSON wrapped in \`\`\`json fences. It added stripping logic:

```typescript
if (content.startsWith('```')) {
  content = content.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
}
```

Every LLM does this. Claude Code knew that because it's seen it a thousand times in other codebases.

---

## Slide 6: UI Iteration at Conversation Speed

Once the pipeline worked, I shifted to the frontend. This is where the speed advantage becomes absurd.

**Me:** "The stories page is too plain. Make it look more like this" *(pastes screenshot)*

Claude Code reads the existing `components.js`, understands the data structures available, and redesigns the card layout — search bar, filter pills, richer cards with images and excerpts. It modifies three files simultaneously: HTML structure, JS rendering, CSS styles.

**Me:** "The filter bubbles should be categories not sources. Put sources somewhere else."

It traces where categories come from (feed registry), finds they're on raw articles but not carried to the story index, updates the TypeScript types, modifies the site generator to collect categories from articles, rebuilds the pipeline, re-runs sitegen, and updates the frontend — all from that one sentence.

**Me:** "Show me some earthy color palettes, green-brown instead of teal"

It creates an HTML page with six palette options, each with a live preview showing how the UI would look with that palette — nav bar, filter pills, story cards. Opens it in my browser. I pick "Juniper & Sienna." It applies the palette by updating CSS variables. Done.

Each of these iterations took 2-3 minutes. In a normal workflow, each would be 30-60 minutes of fiddling with CSS, checking responsive breakpoints, making sure nothing else broke.

---

## Slide 7: Deployment in One Sentence

**Me:** "Set it up to use GitHub Actions to run once a day and deploy to GitHub Pages"

Claude Code writes the entire workflow YAML. Not a template — a workflow specific to this project:

- Checks out code, installs deps, builds TypeScript
- Starts the pipeline server in the background
- Curls each stage endpoint with appropriate timeouts
- Copies generated JSON into the site directory
- Commits data back to the repo
- Deploys to GitHub Pages

It also creates a second "Deploy Site Only" workflow for quick UI-only deploys that skip the 20-minute pipeline.

First run failed — Pages wasn't enabled on the repo. Claude Code enabled it via the GitHub API and re-triggered. Second run: success.

**Me:** "The workflow fails if I push code while it's running"

Claude Code adds `git pull --rebase` before the push step. Problem solved.

---

## Slide 8: The Uncomfortable Conversation

Let's talk about what Claude Code can't do.

It can't make product decisions for you. When I said "make it look like Grond.ai," it could execute that — but the decision to look like Grond.ai was mine. When I chose the Juniper & Sienna palette over Moss & Walnut, that was taste. It presented options, I chose.

It can't debug problems it can't see. When the Squarespace domain forwarding created a redirect loop, I had to describe what I was seeing in the browser. It diagnosed the cause (CNAME file + domain forwarding = loop) and fixed it, but it needed my eyes.

It makes mistakes. It tried to import Express in a zero-dependency dev server. It forgot to export a function. It used `fileURLToPath(import.meta.url)` which breaks under `tsx`. Each time, the fix was fast — but the mistakes happened.

The mental model that works: Claude Code is a very fast junior developer with encyclopedic knowledge and zero ego. It will never push back on a bad idea, so you need to have good ideas. It will implement exactly what you ask for, so you need to ask for the right things.

---

## Slide 9: What Changed About How I Work

Before Claude Code, a project like this would take me a week. Setting up the build system. Writing the RSS parser. Googling embedding APIs. Fighting with CSS grid. Writing the GitHub Actions workflow from the docs.

With Claude Code, those tasks collapse. The creative work — what should this product do, how should it feel, what's the right level of abstraction — that stays the same. The translation work — from idea to code — gets 10x faster.

My new workflow:
1. **Describe** what I want in plain English
2. **Review** what Claude Code proposes (plan mode)
3. **Watch** it implement, intervening when something looks wrong
4. **Test** in the browser, describe what I see
5. **Iterate** — "make the cards bigger," "add search," "change the colors"

I typed maybe 200 lines of code by hand during this entire project. Claude Code wrote several thousand. But every architectural decision, every product choice, every "no, put the sources over there instead" — that was me.

---

## Slide 10: The Numbers

Here's what we built in one session:

| Component | Files | Lines |
|-----------|-------|-------|
| Pipeline (TypeScript) | ~15 | ~2,000 |
| Frontend (HTML/CSS/JS) | ~10 | ~1,500 |
| Infrastructure (Actions, config) | ~5 | ~200 |
| **Total** | **~30** | **~3,700** |

Runtime costs:
- **Hosting:** $0 (GitHub Pages)
- **CI/CD:** $0 (GitHub Actions free tier)
- **LLM/Embeddings:** ~$2-5/day (OpenRouter)
- **Domain:** $12/year (Squarespace)

Time: One afternoon to build. Zero time to maintain — it runs itself.

---

## Slide 11: Try It

The site is live at [dornt.com](https://dornt.com). The code is at [github.com/jcrigby/dornt](https://github.com/jcrigby/dornt).

Claude Code is available at [claude.ai/code](https://claude.ai/code).

The best way to understand this workflow is to try it. Pick a project you've been putting off because it felt like too much boilerplate. Open a terminal. Start talking.

You might be surprised how fast "I want a thing that does X" turns into a thing that does X.

---

*Questions?*
