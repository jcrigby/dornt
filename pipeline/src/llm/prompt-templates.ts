export const SYSTEM_PROMPT = `You are Dornt, a news intelligence analyst. You provide factual, balanced analysis with clear source attribution. You never inject opinion — you identify and attribute the opinions of others. You are precise with claims and always distinguish between confirmed facts, allegations, and speculation.`;

export const TITLE_PROMPT = `Given these article titles about the same news event, generate a concise, neutral headline (max 15 words) that captures the core story. Return only the headline, nothing else.

Titles:
{titles}`;

export const SYNTHESIS_PROMPT = `Analyze the following articles about the same news story. Write a comprehensive "State of the Story" synthesis that:

1. Summarizes the key facts established across sources
2. Notes where sources agree and disagree
3. Identifies the timeline of events
4. Highlights any breaking or evolving developments
5. Uses citation markers [1], [2], etc. to attribute specific facts to specific sources

Format your response as JSON:
{
  "narrative": "markdown text with [1] [2] citation markers",
  "keyDevelopments": ["development 1", "development 2", ...],
  "citations": [
    {"index": 1, "source": "source name", "title": "article title", "quote": "relevant quote"}
  ]
}

Articles:
{articles}`;

export const CLAIMS_PROMPT = `Extract all significant factual claims from these articles about the same story. For each claim, identify:
- The claim text
- Whether it's undisputed (all sources agree), disputed (sources disagree), evolving (has changed), or retracted
- Which sources support it and which dispute it

Format your response as JSON:
{
  "claims": [
    {
      "text": "claim text",
      "status": "undisputed|disputed|evolving|retracted",
      "supportingSources": ["source1", "source2"],
      "disputingSources": ["source3"]
    }
  ]
}

Articles:
{articles}`;

export const COVERAGE_LENS_PROMPT = `Analyze how different sources frame and cover this story. Identify:

1. **Narrative frames**: Different angles or framings used by different outlets
2. **Outlier perspectives**: Unique angles only one or two sources cover
3. **Missing context**: Important context that most coverage lacks

Format your response as JSON:
{
  "frames": [
    {
      "name": "frame name",
      "description": "how this frame presents the story",
      "sources": ["source1", "source2"],
      "emphasis": "what this frame emphasizes"
    }
  ],
  "outlierPerspectives": ["perspective 1"],
  "missingContext": ["context 1"]
}

Articles:
{articles}`;

export const COMMUNITY_PROMPT = `Analyze these Reddit discussions about a news story. Determine:

1. Overall community sentiment (positive/negative/mixed/neutral) with a score from -1 to 1
2. Key themes in the discussion
3. Notable quotes that represent important perspectives

Format your response as JSON:
{
  "sentiment": "positive|negative|mixed|neutral",
  "sentimentScore": 0.0,
  "keyThemes": ["theme 1", "theme 2"],
  "notableQuotes": [
    {"text": "quote", "author": "username", "subreddit": "sub", "score": 123}
  ],
  "discussionVolume": 0
}

Reddit discussions:
{discussions}`;

export const DEEP_ANALYSIS_PROMPT = `Provide deep analysis of this news story based on the synthesis and claims already extracted.

Include:
1. **Stakeholder analysis**: Who are the key players, their roles, positions, and influence level
2. **Predictions**: What might happen next, with likelihood and timeframe
3. **Historical context**: How does this connect to past events
4. **Implications**: Broader consequences of this story

Format your response as JSON:
{
  "stakeholders": [
    {"name": "name", "role": "role", "position": "their stance", "influence": "high|medium|low"}
  ],
  "predictions": [
    {"text": "prediction", "likelihood": "likely|possible|unlikely", "timeframe": "time", "basis": "reasoning"}
  ],
  "historicalContext": "paragraph of context",
  "implications": ["implication 1", "implication 2"]
}

Story synthesis:
{synthesis}

Key claims:
{claims}`;

export const STORYLINE_PROMPT = `Analyze these news clusters and identify narrative arcs — stories that are connected across clusters and evolving over time.

For each storyline:
1. Give it a descriptive title
2. Explain the narrative arc
3. List which cluster IDs belong to it
4. Note the current status (developing/ongoing/concluded)

Format your response as JSON:
{
  "storylines": [
    {
      "title": "storyline title",
      "description": "what connects these stories",
      "clusterIds": ["id1", "id2"],
      "arc": "narrative arc description",
      "status": "developing|ongoing|concluded"
    }
  ]
}

Clusters:
{clusters}`;

export const BRIEFING_PROMPT = `Generate a daily news briefing based on today's top stories. Include:

1. A compelling headline for the briefing
2. Top stories ranked by importance, each with a brief summary
3. Emerging themes across stories
4. Notable shifts in ongoing narratives

Format your response as JSON:
{
  "headline": "briefing headline",
  "topStories": [
    {"clusterId": "id", "title": "story title", "summary": "brief summary", "importance": 85}
  ],
  "emergingThemes": ["theme 1"],
  "notableShifts": ["shift 1"]
}

Today's active clusters:
{clusters}`;

export const BATCH_SUMMARY_PROMPT = `Summarize each of these articles in 2-3 sentences, preserving key facts, quotes, and source attribution. Number each summary to match the article number.

Articles:
{articles}`;
