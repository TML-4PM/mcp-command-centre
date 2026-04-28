# Bridge/Pen Handoff Payload — AI Sweet Spots Research Site Restructure

Status: DEV/BRIDGE ACCEPTANCE PAYLOAD
Source: ChatGPT session
Target repo: TML-4PM/mcp-command-centre
Autonomy: DEV accepted, production gated
Date: 2026-04-28

## First 30 Seconds

The current research site is being restructured from a confused research/poster archive into a clear Human + AI Performance Intelligence front door.

Primary fixes:
- Make Insights the lead experience, not papers or posters.
- Remove Unified Biological Intelligence from the conference poster gallery.
- Gate books and courses behind a coming-soon email capture.
- Remove four authors and bulk manager from front-of-site navigation.
- Consolidate Research and Population Research into one coherent research layer with filters.
- Hide or compress legal/contact content.
- Update visible date language from 2025 to 2026.
- Fix weak credibility signals such as “Join 0 people”.
- Highlight Performance Crossovers and the research coverage mix graph.
- Keep Adaptive Architecture for now, but do not make it a leading item.

## Final Site Information Architecture

Primary navigation:
1. Insights
2. Research
3. Assessment
4. Platform
5. Resources

Footer-only / hidden:
- About
- Contact
- Legal
- Authors
- Bulk Manager

Removed from primary experience:
- Poster gallery as a top-level lead experience
- Unified Biological Intelligence as a standalone conference poster item
- Books / Courses as open unfinished pages

## Homepage Replacement

Homepage should open with Insights-first positioning.

Hero:
Human Performance in the Age of AI

Subcopy:
Evidence-backed insights into how people actually think, learn, and perform with AI.

Primary CTAs:
- Explore Insights
- Take Assessment
- Get Early Access

Key insight cards:
- AI Sweet Spot: Performance peaks at different AI involvement levels depending on cognitive profile.
- Performance Crossovers: Advantage flips by cognitive type and task condition.
- Cognitive Load Threshold: Overuse creates measurable cognitive debt.
- Neurodivergent Advantage: Neurodivergent users can gain disproportionate uplift from AI support.

Preferred visual priority:
1. Research coverage mix graph
2. Sweet spot curve visuals
3. Performance crossover visuals
4. Profile signatures / workplace correlation visuals

## Research Page Restructure

Use three groups:

### Foundations
- Core Discovery
- Sweet Spot Analysis

### Performance
- Performance Crossovers
- Workplace Correlation
- Profile Signatures

### Experimental / Emerging
- Adaptive Architecture
- Altered States

Population filters:
- All
- Neurodivergent
- Indigenous
- Elderly
- General Population
- Workplace

Important: Population Research should not sit as a disconnected competing section. It should become filterable research context.

## Resources Gate

Books and courses must be locked behind an auth/lead gate.

Page copy:

Early Access to Tools, Courses & Research

These materials are being prepared for release. Join the early access list and we will notify you as soon as the relevant book, course, or toolkit is available.

Fields:
- Email
- Role
- Interest area

Interest options:
- Individual AI Sweet Spot
- Education / Reading Buddy
- Workplace / AHC
- Research collaboration
- Government / policy

Button:
Get Early Access

## Content Removals / Demotions

Remove or demote:
- Unified Biological Intelligence from conference poster gallery
- Four authors from homepage and primary nav
- Bulk manager from homepage and primary nav
- Poster gallery from leading experience
- “Join 0 people”
- Duplicated “10 topics available” messaging where it makes the site feel small
- Excessive legal/contact material from main content area

Replace:
- “Join 0 people” → “Be part of the first cohort” or hide count entirely
- “10 topics available” → “10 research domains · 11,000+ participants”
- 2025 footer/date references → 2026

## Visual System

Research group colours:
- Foundations: blue
- Performance: green
- Experimental: orange

Social skills and similar cards must not look like same-category duplicates. Give them clearer colour and descriptive differentiation.

Graph requirements:
- Graphs must be visible as real assets, not trapped in images where text cannot be copied.
- Where possible, expose underlying chart text/data for copy, download, and reuse.
- Graph viewer should support expand and download.

## Supabase Schema Payload

```sql
create table if not exists public.research_site_leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role text,
  interest_area text,
  source text not null default 'research_site_resources_gate',
  created_at timestamptz not null default now()
);

create table if not exists public.research_site_content_items (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  item_type text not null check (item_type in ('insight','research','poster','resource','assessment','platform')),
  group_name text,
  population_tags text[] default '{}',
  summary text,
  body jsonb default '{}'::jsonb,
  graph_urls text[] default '{}',
  is_featured boolean not null default false,
  is_public boolean not null default true,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.research_site_evidence_log (
  id uuid primary key default gen_random_uuid(),
  entity_slug text not null,
  action text not null,
  classification text not null check (classification in ('REAL','PARTIAL','PRETEND')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
```

## Seed Records

```sql
insert into public.research_site_content_items
(slug, title, item_type, group_name, population_tags, summary, is_featured, sort_order)
values
('core-discovery', 'Core Discovery', 'research', 'Foundations', array['general population'], 'Core research finding for human performance with AI.', true, 10),
('sweet-spot-analysis', 'Sweet Spot Analysis', 'research', 'Foundations', array['general population','neurodivergent'], 'Analysis of optimal AI involvement ranges by cognitive profile.', true, 20),
('performance-crossovers', 'Performance Crossovers', 'research', 'Performance', array['workplace','neurodivergent'], 'Shows where AI advantage changes by profile, context and task condition.', true, 30),
('workplace-correlation', 'Workplace Correlation', 'research', 'Performance', array['workplace'], 'Maps research signals to workplace performance and adoption patterns.', true, 40),
('profile-signatures', 'Profile Signatures', 'research', 'Performance', array['neurodivergent','workplace'], 'Profile-level patterns that explain why different people need different AI support.', true, 50),
('adaptive-architecture', 'Adaptive Architecture', 'research', 'Experimental', array['general population'], 'Emerging architecture concept. Kept visible but not leading.', false, 80),
('altered-states', 'Altered States', 'research', 'Experimental', array['general population'], 'Experimental stream moved out of the poster-first experience.', false, 90)
on conflict (slug) do update set
  title = excluded.title,
  item_type = excluded.item_type,
  group_name = excluded.group_name,
  population_tags = excluded.population_tags,
  summary = excluded.summary,
  is_featured = excluded.is_featured,
  sort_order = excluded.sort_order,
  updated_at = now();
```

## Bridge Invocation Envelope

```json
{
  "action": "invoke_function",
  "function_name": "troy-code-pusher",
  "invocation_type": "RequestResponse",
  "payload": {
    "target_repo": "TML-4PM/mcp-command-centre",
    "workstream": "ai_sweet_spots_research_site_restructure",
    "environment": "dev",
    "production_gated": true,
    "tasks": [
      "Restructure research site navigation to Insights, Research, Assessment, Platform, Resources",
      "Remove Unified Biological Intelligence from conference poster gallery",
      "Gate books and courses with coming-soon lead capture",
      "Remove authors and bulk manager from front-of-site",
      "Merge population research into research filters",
      "Update date references from 2025 to 2026",
      "Replace zero-count assessment copy",
      "Feature research coverage mix graph and performance crossovers",
      "Create Supabase tables and seed records",
      "Log Reality Ledger / evidence outcome as PARTIAL until deployed and smoke-tested"
    ]
  },
  "metadata": {
    "request_id": "ai-sweet-spots-research-site-2026-04-28",
    "source": "chatgpt-github-connector",
    "timestamp_utc": "2026-04-28T00:00:00Z",
    "auth_context": "github_connector_session"
  }
}
```

## Acceptance Gates

DEV accepted when:
- File payload is present in repo.
- Issue exists with build instructions and acceptance criteria.
- Dev can implement without further human clarification.

REAL only when:
- Deployed site shows new IA.
- Books/courses gate writes a lead record.
- Research page groups/filtering work.
- Footer/date copy reads 2026.
- Poster gallery no longer leads and Unified Biological Intelligence is no longer standalone there.
- Evidence log has proof rows.

Current Reality Ledger classification: PARTIAL
Reason: Payload lodged to GitHub; runtime deployment and live smoke test still pending.
