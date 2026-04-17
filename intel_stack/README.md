# Intel Stack

Personal intelligence engine using Obsidian, Supabase, Gmail, Lambda, and dashboard widgets.

## Purpose
Capture raw inputs fast, structure them into knowledge, track campaigns, challenge assumptions, and feed actionable outputs into Command Centre.

## Components
- Local capture into Obsidian
- Structured persistence into Supabase schema `intel`
- Gmail sync into `intel.email_events`
- Assumption challenge engine
- Daily digest generation
- Dashboard widget output

## Core commands
- `/wiki`
- `/assume`
- `/decision`
- `/digest`

## Build order
1. Create vault folders
2. Apply SQL migrations
3. Load seed CSVs
4. Set `.env`
5. Run local watcher
6. Test challenge engine
7. Wire widget into Command Centre
8. Schedule jobs

## Local run
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r local/requirements.txt
python local/watcher.py
```

## macOS quick open
```bash
open -a TextEdit README.md
```

## Safety rules
- All inputs timestamped
- Dedupe via hash
- Raw text retained
- Assumptions explicit
- Email-derived actions linked to campaign records
- Daily challenge always runs before business day start
