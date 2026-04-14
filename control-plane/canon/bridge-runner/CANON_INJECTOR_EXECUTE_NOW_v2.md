# Execute Now — Canon Injector

Validated source pack:

- `control-plane/canon/bridge-runner/CANON_INJECTOR_READY_PACK.md`

Target replacements:

- `control-plane/canon/sql/control_plane_canon.sql`
- `control-plane/canon/lambda/bridge_canon_router.py`
- `control-plane/canon/ui/control_plane_canon_monitor.html`

Execution directive:

1. Read the validated ready pack.
2. Replace the target files in-place with the payloads embedded there.
3. Run the SQL in Supabase.
4. Deploy the Lambda into the bridge path.
5. Publish the widget snippet under slug `control-plane-canon-monitor`.
6. Record runtime status as REAL only after deployment evidence exists.

Reality rule:

Do not treat the canon injector as live until the target files are replaced, SQL is executed, Lambda is deployed, and evidence is attached.
