# Core 5 Continuous Multi-LLM Loop Specification

## Purpose

This pack defines a continuous execution loop for high-stakes document completion and agent deployment readiness across GPT, Claude, Grok, and Perplexity. The loop may revisit any model in any order and as many times as needed. The goal is to produce a McKinsey-standard output with evidence, clarity, and operational readiness.

This specification assumes:
- the user remains involved only at defined stage gates
- the Digital Custodian remains continuously on top of the process
- Google Drive, Supabase, and prior structured LLM chat context are valid research surfaces
- the site must be ready to support successful agent deployment, task intake, output visibility, proof, and operational success

## Non-negotiable outcomes

1. Continuous loop orchestration across GPT, Claude, Grok, and Perplexity
2. Digital Custodian quality control over every pass and every final output
3. Troy only involved at stage gates, guidance points, approvals, or when keys/authority are required
4. Site and control-plane readiness for intake, execution, visibility, and deployment support
5. Runtime proof captured in Supabase
6. Completion standard is decision-grade, board-grade, and consultancy-grade, not draft-grade

## Core operating principle

The loop is not a linear chain. It is a revisitable execution graph.

A task can move:
- GPT -> Claude -> Perplexity -> Grok
- Claude -> GPT -> Claude -> Perplexity
- Perplexity -> GPT -> Grok -> Claude -> GPT
- or any other sequence required by confidence, evidence needs, and task quality

The system continues until one of the following is true:
- the Digital Custodian marks the output COMPLETE
- a required stage-gate approval is pending
- a hard blocker exists due to missing authority, secrets, or inaccessible sources

## Core 5 agent pack

### 1. Research Agent
Primary role:
- collect source material from Google Drive, Supabase, and available chat-derived context
- use Perplexity for web-grounded or research-heavy passes when external evidence is required

Outputs:
- source bundle
- evidence notes
- open questions
- retrieval confidence

### 2. Synthesis Agent
Primary role:
- use Claude-style strengths to organise, structure, merge, and rewrite into coherent executive-quality material

Outputs:
- structured draft
- gap list
- narrative coherence assessment

### 3. Strategy Agent
Primary role:
- use GPT-style strengths for framing, options, strategic trade-offs, executive logic, and recommendation shaping

Outputs:
- strategic recommendation
- options analysis
- decision framing

### 4. Validation Agent
Primary role:
- use Grok and cross-checking logic to challenge claims, identify contradictions, test assumptions, and push back where the chain is weak

Outputs:
- contradiction log
- validation findings
- red-team notes

### 5. Digital Custodian
Primary role:
- own quality, continuity, truth binding, duplication control, conflict resolution, stop logic, and publication readiness

Outputs:
- approved final artefact
- issues log
- evidence status
- stage-gate trigger
- completion state

## Digital Custodian mandate

The Digital Custodian is the system-level governor. It is not optional.

The Digital Custodian must:
- detect duplication between passes
- reject unsupported claims or mark them PARTIAL
- maintain a canonical source of truth for the working document
- identify conflicts between model outputs
- resolve or escalate contradictions
- ensure continuity of voice and structure
- enforce acceptance criteria before completion
- check whether the site/control-plane has what is needed for successful agent deployment
- route unresolved authority or key requirements to Troy at stage gates

## Research surfaces

The orchestration loop should prioritise the following research surfaces:

### Google Drive
Use for:
- source documents
- drafts
- reference material
- supporting decks and working notes

### Supabase
Use for:
- canonical truth storage
- run logs
- evidence binding
- agent state
- task state
- stage-gate events
- output artefacts

### LLM chats
Use for:
- prior design intent
- historical constraints
- earlier strategic decisions
- continuity context

## Stage-gate model

Troy is involved only at leverage points.

### G1 — Scope gate
Triggered when:
- task scope is first shaped
- success criteria or core assumptions need confirmation

### G2 — Evidence gate
Triggered when:
- a key source is missing
- external authority or keys are needed
- a material contradiction requires user judgment

### G3 — Direction gate
Triggered when:
- competing recommendations exist
- strategic direction must be selected

### G4 — Pre-final gate
Triggered when:
- output is materially complete
- final polish, risk review, or approval is needed

### G5 — Publish or deploy gate
Triggered when:
- the final artefact is ready for publication, deployment, or operationalisation

## Site readiness requirements

The site/control-plane must support success, not merely display content.

Minimum required capabilities:
- task intake
- task status visibility
- stage-gate event visibility
- output storage and retrieval
- evidence/status markers
- agent deployment readiness indicators
- execution logs
- closure state

Minimum pages/components:
- intake page
- status page
- command centre widget or equivalent control-plane surface

## Supabase truth model

The runtime must persist:
- tasks
- agent visits
- agent outputs
- issues
- evidence items
- stage-gate events
- final artefacts
- closure status

Nothing is REAL without runtime proof.

## Acceptance criteria

A task is COMPLETE only when all are true:
- at least one research pass completed
- at least one synthesis pass completed
- at least one strategy pass completed
- at least one validation pass completed
- Digital Custodian final review completed
- unresolved contradictions are zero or explicitly waived at a stage gate
- evidence status is REAL or clearly marked PARTIAL
- final document stored
- status surfaced in control plane/site layer

## Failure conditions

The system must not silently continue in any of these states:
- repeated loop with no progress
- repeated contradiction on the same issue
- provider unavailable with no reroute
- missing key required for source access or publish step
- unresolved evidence gap on load-bearing claim

In such cases the Digital Custodian must:
- log the blocker
- create a stage-gate event if user intervention is required
- continue all non-blocked work where possible

## Completion standard

The expected standard is not simply “finished text.”

The expected standard is:
- executive-ready
- consultancy-grade
- evidence-aware
- internally consistent
- deployable into the site/control-plane environment
- fit for agent deployment success

## First deployment test

Recommended first test:
- task: NDIS disruption strategy + site deployment readiness + agent pack support model
- required outputs: executive summary, strategic options, operating model, site readiness checklist, stage-gate list, deployment implications
- final action: persist final artefact, create completion record, surface status on site/control-plane
