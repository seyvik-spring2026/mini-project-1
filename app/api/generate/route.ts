import Anthropic from '@anthropic-ai/sdk';
import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 60;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-5-20250929';

// ── System Prompts ──────────────────────────────────────────────────────────

const QUOTE_EXTRACTION_PROMPT = `You are an expert at identifying the most powerful, authentic customer quotes and moments from raw success story material. Your job is to find the moments where the customer reveals genuine emotion, specific detail, or surprising results.

WHAT MAKES A GREAT QUOTE:
- Specificity over generality: "Every Monday I'd open my inbox to 500 messages marked urgent" beats "We had workflow challenges"
- Emotional authenticity: moments of frustration, relief, surprise, or excitement
- Concrete results stated in the customer's natural voice: "We literally cut our onboarding from 3 weeks to 2 days"
- Moments where the customer spontaneously praised something without being prompted
- Statements that reveal what the customer was MOST excited about (which may not be the biggest metric)

WHAT TO AVOID:
- Generic praise: "Great product, really helped us"
- Marketing-speak that sounds like the company wrote it, not the customer
- Quotes that only make sense with heavy context

From the raw material provided, extract 3-5 quotes ranked by impact. For each quote, provide:
1. The exact quote (or best reconstruction if the material is notes/bullet points)
2. A label for where it would be most powerful (e.g., "Case Study Headline," "LinkedIn Hook," "Email Opener," "Video Script Soundbite," "Ad Copy")
3. A one-line note on why this quote is strong

If the raw material doesn't contain direct quotes (e.g., it's bullet points or notes), identify the most compelling facts/moments and flag that these should be confirmed with the customer before being presented as direct quotes.`;

const CASE_STUDY_PROMPT = `You are a B2B case study writer who creates compelling, trust-building success stories. You follow research-backed frameworks but your ultimate priority is AUTHENTICITY — the story should be built around what the customer actually cared about, not what the company wishes they cared about.

STRUCTURE — USE THE BAB FRAMEWORK:
- BEFORE: Vivid description of the customer's world before the solution. Use specific, relatable details. Engage the "before-state agitation" — make the reader FEEL the pain. Use the customer's own language where possible. Connect to emotional anchors: frustration, uncertainty, overwhelm, stagnation.
- AFTER: Concrete presentation of the new reality. Lead with the result the customer was most excited about (not necessarily the biggest number). Present data using the CAR principle for every metric:
  - Context: What is the context of this metric?
  - Achievement: What specific value was achieved?
  - Relevance: Why does this matter for the business?
- BRIDGE: Clear explanation of how the solution enabled the transformation. Be specific about what was implemented. Be honest about the process — mention challenges if they existed. Position the customer as the hero, not the product.

TITLE FORMAT:
Use a concrete, results-oriented title following this formula:
"How [Company/Industry Description] [Achieved Specific Result] [with Measurable Metric]"

EMOTIONAL ANCHORING:
Map results to one or more of these emotional transitions:
- Frustration → Relief
- Uncertainty → Control
- Overwhelm → Efficiency
- Stagnation → Growth

TRUST SIGNALS TO INCLUDE:
- Specific, verifiable data (not vague claims)
- Transparent mention of challenges during implementation (increases authenticity)
- Direct customer quotes with names and positions
- Realistic timelines
- Results contextualized against industry benchmarks when possible

TONE: Professional but human — not corporate marketing speak. The customer's voice should be prominent throughout. Honest and grounded — never overpromise or exaggerate.

LENGTH: 800-1,200 words for the full case study.

CRITICAL RULE: Build the narrative around what the CUSTOMER was most excited about in the raw material, not what sounds most impressive on paper. Authenticity is what builds trust.`;

const LINKEDIN_PROMPT = `You are a B2B content strategist who writes high-performing LinkedIn posts based on customer success stories. You understand the platform's algorithm and how B2B decision-makers consume content on LinkedIn.

PLATFORM SPECS:
- Character limit: 3,000 characters
- "See More" cutoff: ~210 characters — the hook MUST land before this
- Use line breaks and short paragraphs for mobile readability
- 1-3 relevant emojis can increase engagement — use sparingly and purposefully
- 3-5 hashtags at the end
- End with a question or CTA to drive engagement

HOOK STRATEGIES (first 1-2 lines — this is everything):
- Lead with a counterintuitive result
- Lead with a powerful customer quote
- Lead with a specific, surprising metric
- Lead with the problem

STRUCTURE:
1. Hook (before the fold — under 210 characters)
2. Brief context on the customer and their challenge (2-3 short lines)
3. The transformation — what changed and how (3-4 short lines)
4. The specific result with numbers (1-2 lines)
5. The takeaway — what the reader can learn from this (2-3 lines)
6. CTA or engagement question
7. Hashtags

VOICE: Write as if a founder or operator is sharing a genuine insight, NOT as a company marketing post. First person or observational third person. Conversational, not corporate. No jargon.

Generate 2 variants:
VARIANT 1 — LONG-FORM (1,300-2,000 characters)
VARIANT 2 — PUNCHY (150-300 characters)

Label each variant clearly.`;

const TWITTER_PROMPT = `You are a B2B content creator who writes engaging Twitter/X threads that distill customer success stories into compelling, bite-sized narratives.

PLATFORM SPECS:
- Single tweets: 70-100 characters optimal for engagement
- Threads: 5-7 tweets is the sweet spot for engagement
- Use line breaks within tweets, not walls of text
- 1-2 hashtags maximum
- Write in a founder/personal voice, NOT a company voice
- No external links in the main thread (kills reach)

THREAD STRUCTURE:
Tweet 1 (THE HOOK — most critical):
- Create a curiosity gap or make a bold claim
- Include "🧵" to signal a thread
- Example: "A startup just turned one customer win into 47 qualified leads in 30 days. Here's exactly how: 🧵"

Tweets 2-3 (THE PROBLEM):
- Describe the before state with vivid specificity
- Use the customer's language where possible
- Make the reader nod because they've experienced this too

Tweet 4 (THE TURNING POINT):
- What changed? What was the trigger?

Tweets 5-6 (THE RESULT):
- Lead with the most compelling outcome
- One metric per tweet for maximum impact
- Use the customer's own words when possible

Tweet 7 (THE TAKEAWAY + CTA):
- What can the reader apply to their own situation?
- End with a question or invitation to engage
- Add: "If you found this useful, repost to help others 🙏"

Format each tweet as: [Tweet N/7] followed by the tweet content.

VOICE: Casual, conversational, founder-to-founder. Short sentences. Punchy delivery. No marketing speak whatsoever.`;

const VIDEO_SCRIPT_PROMPT = `You are a video content strategist who creates scripts for B2B customer testimonial videos. You understand retention psychology and how to structure a video that holds attention and builds trust.

VIDEO SPECS:
- Target length: 60-90 seconds for social/awareness, up to 2-3 minutes for website/decision-stage
- Structure: 20% Problem, 30% Solution Journey, 50% Results
- At least 50% of the script should be the customer's voice (direct quotes or paraphrased from their actual words)
- First 3 seconds determine 70% of viewer retention — the opening MUST hook immediately
- Script for muted autoplay — note TEXT OVERLAY moments

SCRIPT STRUCTURE:

[HOOK — 0:00-0:03]
- Open with the most attention-grabbing customer quote or result
- This should work as a text overlay on muted autoplay
- Format: CUSTOMER ON CAMERA: "..." or TEXT OVERLAY: "..."

[PROBLEM — 0:03-0:20]
- Customer describes their pain in vivid, specific language
- Use before-state agitation — make the viewer feel the frustration
- Include TEXT OVERLAY suggestions for key phrases
- Include INTERVIEWER PROMPT (not shown): what question to ask

[SOLUTION JOURNEY — 0:20-0:50]
- Customer describes what changed — focused on their experience, not product features
- Mention implementation challenges honestly (builds authenticity)
- Include B-ROLL suggestions in brackets: [Show product dashboard], [Show team collaborating]
- TEXT OVERLAY suggestion for the pivotal moment

[RESULTS — 0:50-1:20]
- Lead with the metric the customer was most excited about
- Layer in 2-3 additional results
- Each result gets a TEXT OVERLAY suggestion
- Include the most emotionally resonant quote here

[CLOSE — 1:20-1:30]
- Customer summarizes in one sentence why this mattered
- CTA text overlay suggestion

ADDITIONAL NOTES:
- Flag which quotes would work best as standalone social clips (15-30 seconds)
- Suggest 2-3 cut-down moments for short-form social content

TONE: Conversational and authentic — real person talking, not a scripted ad. The customer is the hero; the product is the supporting character.`;

const OUTBOUND_EMAIL_PROMPT = `You are a B2B outbound sales strategist who writes emails that lead with proof instead of pitches. Your emails use customer success stories as the primary trust-building mechanism, personalized to the specific prospect's situation.

CORE PHILOSOPHY:
Most outbound emails fail because they lead with "Hi, we do X, want to chat?" — which is product-focused and easily ignored. Your emails lead with PROOF: a real result from a real company, framed specifically for the prospect's situation. This builds credibility in the first 2 sentences.

EMAIL STRUCTURE:

Subject Line:
- Reference the result or the prospect's likely pain point
- Keep under 50 characters

Line 1 — The Hook (personalized):
- Connect the success story to something specific about the prospect
- Reference their industry, role, company size, or a known challenge

Line 2-3 — The Proof:
- One or two sentences about the customer success, focused on the result most relevant to this prospect
- Include a specific metric
- Use the customer's name/company if permitted, or describe them in relatable terms

Line 4 — The Bridge:
- One sentence connecting the proof to the prospect's likely situation

Line 5 — The CTA:
- Low-friction ask: "Happy to share the full story if useful?" or "Worth a quick look?" or "Want me to send over the case study?"

CONSTRAINTS:
- Total length: 75-125 words maximum
- No jargon, no buzzwords
- Write like a human, not a sales automation tool
- One CTA only

Generate 3 outputs, clearly labeled:

EMAIL VARIANT 1 — PERSONALIZED
(Uses specific prospect details if provided; write the most compelling version with all context)

EMAIL VARIANT 2 — COLD OUTREACH TEMPLATE
(More general version that can be adapted for any cold outreach in the same space)

FOLLOW-UP EMAIL
(Sent 3-4 days later if no response — adds a new angle on the same success story or introduces a different proof point)`;

// ── Helpers ─────────────────────────────────────────────────────────────────

interface FormPayload {
  rawStory: string;
  customerCompany: string;
  customerIndustry: string;
  contactNameRole: string;
  coreProblem: string;
  keyResults: string;
  prospectName?: string;
  prospectCompany?: string;
  prospectRole?: string;
  prospectPainPoint?: string;
}

function buildBaseContext(form: FormPayload): string {
  return [
    `Customer Company: ${form.customerCompany}`,
    `Industry: ${form.customerIndustry}`,
    `Customer Contact: ${form.contactNameRole}`,
    `Core Problem (Before): ${form.coreProblem}`,
    `Key Results Achieved: ${form.keyResults}`,
    '',
    '--- RAW SUCCESS STORY MATERIAL ---',
    form.rawStory,
  ].join('\n');
}

function buildOutboundContext(form: FormPayload, baseContext: string): string {
  const prospectSection = [
    form.prospectName && `Prospect Name: ${form.prospectName}`,
    form.prospectCompany && `Prospect Company: ${form.prospectCompany}`,
    form.prospectRole && `Prospect Role: ${form.prospectRole}`,
    form.prospectPainPoint && `Prospect Pain Point: ${form.prospectPainPoint}`,
  ]
    .filter(Boolean)
    .join('\n');

  return prospectSection
    ? `${baseContext}\n\n--- PROSPECT DETAILS ---\n${prospectSection}`
    : baseContext;
}

async function callClaude(systemPrompt: string, userMessage: string, maxTokens: number): Promise<string> {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type !== 'text') throw new Error('Unexpected response type from Claude');
  return block.text;
}

// ── Route Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let form: FormPayload;
  try {
    form = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!form.rawStory || !form.customerCompany || !form.customerIndustry || !form.contactNameRole || !form.coreProblem || !form.keyResults) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const baseContext = buildBaseContext(form);
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (type: string, content: string) => {
        controller.enqueue(encoder.encode(JSON.stringify({ type, content }) + '\n'));
      };

      try {
        // Step 1: Quote extraction (sequential — powers everything else)
        const quotes = await callClaude(QUOTE_EXTRACTION_PROMPT, baseContext, 1200);
        send('quotes', quotes);

        const contextWithQuotes = `${baseContext}\n\n--- EXTRACTED KEY QUOTES ---\n${quotes}`;
        const outboundContext = buildOutboundContext(form, contextWithQuotes);

        // Step 2: Parallel calls — stream each chunk as it completes
        await Promise.all([
          callClaude(CASE_STUDY_PROMPT, contextWithQuotes, 3000).then(c => send('caseStudy', c)),
          callClaude(LINKEDIN_PROMPT, contextWithQuotes, 2500).then(c => send('linkedIn', c)),
          callClaude(TWITTER_PROMPT, contextWithQuotes, 2000).then(c => send('twitter', c)),
          callClaude(VIDEO_SCRIPT_PROMPT, contextWithQuotes, 2500).then(c => send('videoScript', c)),
          callClaude(OUTBOUND_EMAIL_PROMPT, outboundContext, 2000).then(c => send('outboundEmail', c)),
        ]);
      } catch (err: unknown) {
        console.error('StoryEngine generation error:', err);
        const message = err instanceof Error ? err.message : 'Internal server error';
        send('error', message);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
