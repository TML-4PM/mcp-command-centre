# Control Plane Canon Injector Pack

This pack adds universal canon injection, drift detection, session alignment tracking, and nightly integrity audit support to the MCP Command Centre.

## Included files

- `sql/control_plane_canon.sql` — schema, seed data, views, helper functions
- `lambda/bridge_canon_router.py` — bridge handler for `/canon`, `/canon-rebind`, `/canon-quarantine`, `/canon-check`, `/canon-nightly`
- `ui/control_plane_canon_monitor.html` — widget snippet for Command Centre
- `docs/canon_operator_guide.md` — operator guide and prompt assembly rules

## Canon command family

- `/canon`
- `/canon-rebind`
- `/canon-quarantine`
- `/canon-check`
- `/canon-sync`
- `/canon-nightly`

## Runtime contract

1. Request arrives through bridge
2. `control_plane.canon.check` runs drift scoring
3. Lowest necessary canon correction is injected
4. Session state and drift event are logged
5. Output is bound to Reality Ledger classification
6. Nightly audit summarises failures and repeated drift

## Notes

- Use universal canon for all model families
- Add GPT operator overlay for GPT sessions
- Quarantine should be treated as gated for destructive or untrusted execution states
