# Thread Closure Register

Generated from the uploaded audit registry on 2026-04-13.

This file does **not** claim runtime closure. It converts the open audit into a machine-readable closure register for command-centre and bridge-side execution.

## Summary

- Total threads: **73**
- Critical: **4**
- High: **35**
- Medium: **29**
- Low: **5**

### Barrier counts
- MAC: **11**
- ARCH: **7**
- GATED: **11**
- BLK: **16**
- LOG: **28**

### Kill buckets
- DEPLOY_FOUNDATION: **18**
- CONFIG_AND_ACCESS: **11**
- HUMAN_BLOCKERS: **16**
- WIRING_AND_SCHEDULING: **28**

## Closure rules

A thread is only CLOSED when the fix path has run **and** the verify rule has passed. Anything else stays OPEN or BLOCKED.

| ID | Category | Barrier | Impact | Kill bucket | Closable by | Item | Verify rule |
|---|---|---|---|---|---|---|---|
| THREAD-001 | ROOT | MAC | CRITICAL | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-code-deploy Lambda missing — ALL Lambda deploys need Mac | Function or stack deploys successfully and passes smoke test |
| THREAD-002 | ROOT | ARCH | CRITICAL | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-code-pusher writes index.js regardless of runtime — broken for months | Function or stack deploys successfully and passes smoke test |
| THREAD-003 | ROOT | ARCH | CRITICAL | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-lambda-deployer wraps code in subdirectory — broken | Function or stack deploys successfully and passes smoke test |
| THREAD-004 | ROOT | ARCH | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-sql-runner — No module named index — same root cause | Function or stack deploys successfully and passes smoke test |
| THREAD-005 | ROOT | GATED | HIGH | CONFIG_AND_ACCESS | MIXED | Bridge allowlist deadlock — TrojanOz Lambdas deployed but not in allowlist | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-006 | ROOT | ARCH | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-s3-manager upload returns bytes:0 — broken | Function or stack deploys successfully and passes smoke test |
| THREAD-007 | INFRA | GATED | HIGH | CONFIG_AND_ACCESS | MIXED | S2 schema UNKNOWN — no writes, status unverified | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-008 | INFRA | ARCH | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-code-pusher target ambiguous — placeholder in fn_envelope | Function or stack deploys successfully and passes smoke test |
| THREAD-009 | INFRA | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | fire-orchestrator CFN — SAM deploy pending | Function or stack deploys successfully and passes smoke test |
| THREAD-010 | INFRA | GATED | MED | CONFIG_AND_ACCESS | MIXED | bci-nightly-refresh job 17 — Supabase read_only_user owns it, 404 | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-011 | INFRA | GATED | MED | CONFIG_AND_ACCESS | MIXED | wave20 revenue trigger job 175 — corrupt SQL | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-012 | INFRA | MAC | MED | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | 80 pg_cron → EB migration SAM template built, not deployed | Function or stack deploys successfully and passes smoke test |
| THREAD-013 | INFRA | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | Github task watcher fixed but mission-executor Lambda not deployed | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-014 | INFRA | BLK | MED | HUMAN_BLOCKERS | TROY | GDrive OAuth for node_modules cleanup — dry-run incomplete | Required human action completed and evidence attached |
| THREAD-015 | INFRA | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | 76 never-invoked ACTIVE Lambdas — audit flagged Apr 5 | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-016 | INFRA | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | commerce.repair_queue 1,351 PENDING items never triaged | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-017 | LLM | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | t4h-llm-drive-reader Lambda — GH pushed Apr 9, not deployed | Function or stack deploys successfully and passes smoke test |
| THREAD-018 | LLM | MAC | MED | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | LLM intent/action/blocker 5 tables seeded — Lambda not deployed | Function or stack deploys successfully and passes smoke test |
| THREAD-019 | LLM | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | t4h-chat-ingester — code ready, needs deploy | Function or stack deploys successfully and passes smoke test |
| THREAD-020 | LLM | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | t4h-chat-analyser — code ready, needs deploy | Function or stack deploys successfully and passes smoke test |
| THREAD-021 | LLM | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | LLM-JSON SAM stack — repo complete, sam deploy not run | Function or stack deploys successfully and passes smoke test |
| THREAD-022 | LLM | GATED | MED | CONFIG_AND_ACCESS | MIXED | LLM-JSON SSM params not set (4 params needed) | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-023 | LLM | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | GDrive LLM-JSON folder ID 13Jf_l1m → Drive reader not wired | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-024 | SYNAL | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | Snaps→synal-task-intake wired (pg_cron 187) — Lambda receives but no handler for ingest_snaps mode | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-025 | SYNAL | BLK | HIGH | HUMAN_BLOCKERS | TROY | Extension icons icon16/48/128.png missing from Chrome build | Required human action completed and evidence attached |
| THREAD-026 | SYNAL | BLK | HIGH | HUMAN_BLOCKERS | TROY | ConsentX Chrome Web Store — 5 screenshots + zip + submit pending | Required human action completed and evidence attached |
| THREAD-027 | SYNAL | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | BrowserMind Chrome Manifest v3 shell not built | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-028 | SYNAL | GATED | MED | CONFIG_AND_ACCESS | MIXED | Ennead Signal Engine Vercel push mid-execution Apr 6 — confirm live | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-029 | SYNAL | GATED | MED | CONFIG_AND_ACCESS | MIXED | Neural Ennead dashboard GitHub push Apr 6 — mid-execution | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-030 | SYNAL | BLK | HIGH | HUMAN_BLOCKERS | TROY | MCP server — only ping tool registered, bridge tools not wired | Required human action completed and evidence attached |
| THREAD-031 | SYNAL | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | Operator dashboard — reality_ledger REAL but no pg_cron verification | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-032 | BOOKS | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-book-writer patches — built at /tmp, not deployed | Function or stack deploys successfully and passes smoke test |
| THREAD-033 | BOOKS | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-book-quality-requeue patches — built at /tmp, not deployed | Function or stack deploys successfully and passes smoke test |
| THREAD-034 | BOOKS | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | 7 books missing from sweeper — australian-family-guide etc | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-035 | BOOKS | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | 385,910 words — all chapters thin, need expand to 5-10K each | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-036 | SPIRAL | GATED | HIGH | CONFIG_AND_ACCESS | MIXED | Spiral SAM deploy — needs cloudformation:* + states:* + iam:PassRole | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-037 | SPIRAL | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | Spiral white label pack — IP pipeline status outreach_drafted, no action | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-038 | BUILDS | GATED | MED | CONFIG_AND_ACCESS | MIXED | range_conformance_finding table + views — CREATE written, not executed | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-039 | BUILDS | GATED | HIGH | CONFIG_AND_ACCESS | MIXED | Campaign OS 37-table schema — SQL at TML-4PM/ai-evolution-program — not deployed | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-040 | BUILDS | LOG | LOW | WIRING_AND_SCHEDULING | SYSTEM | property-decision-pack v12 — built, not pushed (PAT was broken) | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-041 | BUILDS | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | workfamilyai.org front door with Payment Link — built, not pushed | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-042 | BUILDS | GATED | MED | CONFIG_AND_ACCESS | MIXED | Valdocco merch alias Vercel protection enabled — blocks public access | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-043 | BUILDS | MAC | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | troy-fire-orchestrator — S3 upload returns 0 bytes — never truly deployed | Function or stack deploys successfully and passes smoke test |
| THREAD-044 | BUILDS | GATED | MED | CONFIG_AND_ACCESS | MIXED | WFAI Commerce Lambdas — wfai-checkout-creator, webhook-handler, diagnostic-worker | Required secret/allowlist/permission exists and dependent flow passes smoke test |
| THREAD-045 | BUILDS | BLK | LOW | HUMAN_BLOCKERS | TROY | IP portfolio engine — final self-bootstrapping clean run on Mac | Required human action completed and evidence attached |
| THREAD-046 | INTEGRATIONS | BLK | HIGH | HUMAN_BLOCKERS | TROY | Gmail DWD not configured — gdrive-crawler SA needs Workspace Admin DWD | Required human action completed and evidence attached |
| THREAD-047 | INTEGRATIONS | BLK | MED | HUMAN_BLOCKERS | TROY | Notion NOTION_TOKEN not in cap_secrets — write blocked | Required human action completed and evidence attached |
| THREAD-048 | INTEGRATIONS | BLK | HIGH | HUMAN_BLOCKERS | TROY | BASIQ CFN maat-basiq-prod not deployed — consent flow dead | Required human action completed and evidence attached |
| THREAD-049 | INTEGRATIONS | BLK | MED | HUMAN_BLOCKERS | TROY | 28 Telegram bots pending — BotFather creation needed | Required human action completed and evidence attached |
| THREAD-050 | INTEGRATIONS | BLK | LOW | HUMAN_BLOCKERS | TROY | @workfamilai_bot — webhook live, Troy hasn't sent /health yet | Required human action completed and evidence attached |
| THREAD-051 | INTEGRATIONS | BLK | HIGH | HUMAN_BLOCKERS | TROY | LinkedIn token expired (was Apr 15) | Required human action completed and evidence attached |
| THREAD-052 | INTEGRATIONS | BLK | MED | HUMAN_BLOCKERS | TROY | Google Calendar OAuth for RDTI export | Required human action completed and evidence attached |
| THREAD-053 | INTEGRATIONS | BLK | HIGH | HUMAN_BLOCKERS | TROY | Chatter GDrive folder ID not set | Required human action completed and evidence attached |
| THREAD-054 | INTEGRATIONS | BLK | HIGH | HUMAN_BLOCKERS | TROY | GITHUB_PAT fine-grained wrong scope — 403 on writes | Required human action completed and evidence attached |
| THREAD-055 | FINANCIAL | BLK | CRITICAL | HUMAN_BLOCKERS | TROY | BAS Q1+Q2 FY25-26 OVERDUE — $22,797 refundable | Required human action completed and evidence attached |
| THREAD-056 | FINANCIAL | BLK | HIGH | HUMAN_BLOCKERS | TROY | Div7A $371,699 wet-sign due 30 Jun | Required human action completed and evidence attached |
| THREAD-057 | FINANCIAL | BLK | CRITICAL | HUMAN_BLOCKERS | TROY | RDTI wet-sign TS-RD-001+POL-RD-001 → Gordon <30 Apr (PASSED) | Required human action completed and evidence attached |
| THREAD-058 | FINANCIAL | BLK | HIGH | HUMAN_BLOCKERS | TROY | Board R&D sign-off — required before RDTI locks | Required human action completed and evidence attached |
| THREAD-059 | FINANCIAL | BLK | MED | HUMAN_BLOCKERS | TROY | Amex/ANZ PDFs not uploaded to Supabase | Required human action completed and evidence attached |
| THREAD-060 | FINANCIAL | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | CRP FY24-25 STALE — $929K refund at stake | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-061 | FINANCIAL | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | T4H_Financial_Statements.pdf STALE ($450/hr rate, DO NOT SEND) | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-062 | FINANCIAL | BLK | MED | HUMAN_BLOCKERS | TROY | RDTI evidence — 22/603 CONFIRMED, rest need screenshots/uploads | Required human action completed and evidence attached |
| THREAD-063 | AI-SWEET | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | AI Sweet Spots — shadow profiler spec + chat widget not built | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-064 | AI-SWEET | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | AI Sweet Spots profile engine — 3 types (Sprinter/Processor/Browser) unscored | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-065 | DATA | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | commerce.repair_queue — 1,351 PENDING never actioned | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-066 | DATA | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | rip_queue drain rate ~60/hr — confirm fully drained by now | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-067 | DATA | BLK | MED | HUMAN_BLOCKERS | TROY | GDrive 29K node_modules files — OAuth dry-run incomplete | Required human action completed and evidence attached |
| THREAD-068 | DATA | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | LLM scratchpad 12 rows — cross-LLM feed not being consumed | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-069 | DATA | LOG | MED | WIRING_AND_SCHEDULING | SYSTEM | asset-triage-widget.html deployed — business classifier 50 rules, 37K assets loaded | Handler/job/queue is wired and next scheduled run succeeds |
| THREAD-070 | SPINE | ARCH | CRITICAL | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | No single start→end execution path — every thread requires new chat context | Function or stack deploys successfully and passes smoke test |
| THREAD-071 | SPINE | ARCH | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | Bridge runner ACTIVE_PAYLOAD.json exists but bridge runner doesn't auto-pick it up | Function or stack deploys successfully and passes smoke test |
| THREAD-072 | SPINE | ARCH | HIGH | DEPLOY_FOUNDATION | SYSTEM_ONCE_EXECUTION_SURFACE_EXISTS | t4h_execution_contract table has /last contract but nothing polls it | Function or stack deploys successfully and passes smoke test |
| THREAD-073 | SPINE | LOG | HIGH | WIRING_AND_SCHEDULING | SYSTEM | GitHub Issues bridge-exec label pickup fixed but dispatch Lambda runs old retired fn | Handler/job/queue is wired and next scheduled run succeeds |