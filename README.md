# Dornt

News intelligence platform. Ingests hundreds of RSS feeds and Reddit communities, clusters related articles, and uses AI to synthesize what's actually happening — with every claim backed by citations you can verify.

**[dornt.com](https://dornt.com)**

## How it works

1. **Ingest** — Pulls from 30+ RSS feeds and 15+ subreddits
2. **Cluster** — Groups related articles using embedding similarity
3. **Analyze** — AI generates synthesis, claims tracking, coverage analysis, community sentiment, and deep analysis for each cluster
4. **Storylines** — Detects when stories are part of larger narrative arcs
5. **Site Gen** — Builds static JSON data consumed by the frontend

The entire pipeline runs daily via GitHub Actions. No servers, no accounts, no tracking — just a static site deployed to GitHub Pages.

## Stack

- **Pipeline:** Node.js / TypeScript, OpenRouter for LLM and embeddings
- **Frontend:** Vanilla HTML/CSS/JS, no framework
- **Hosting:** GitHub Pages, deployed via Actions
- **Schedule:** Daily at 6 AM Mountain

## Local dev

```bash
# Run the pipeline
cd pipeline && npm install && npm run dev

# Serve the site (zero dependencies)
node site/serve.js
# → http://localhost:3000/stories.html
```

## License

MIT
