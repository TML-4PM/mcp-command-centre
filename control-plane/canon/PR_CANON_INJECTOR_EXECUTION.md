# Canon Injector PR Execution Pack

This branch carries the validated canon injector handoff for Bridge Runner execution.

## Validated source
- `control-plane/canon/bridge-runner/CANON_INJECTOR_READY_PACK.md`

## Required replacements
- `control-plane/canon/sql/control_plane_canon.sql`
- `control-plane/canon/lambda/bridge_canon_router.py`
- `control-plane/canon/ui/control_plane_canon_monitor.html`

## Execution contract
1. Read the validated ready pack.
2. Replace the target files in-place with the embedded payloads.
3. Run the SQL in Supabase.
4. Deploy the Lambda into the bridge path.
5. Publish the widget using slug `control-plane-canon-monitor`.
6. Attach deployment evidence before promoting to REAL.

## Truth state
- Ready pack in repo: REAL
- Stub files still present on main: PRETEND until replaced
- Runtime deployment: PARTIAL until evidence exists
