# IMPLEMENTATION RUNBOOK

## Objective
Deploy identity + style enforcement as a mandatory runtime layer.

## Steps
1. Run SQL files
2. Deploy Lambda
3. Register in MCP bridge
4. Attach to generation pipeline
5. Validate via payload

## Success Criteria
- Style scores recorded
- Violations detected
- Widget reflects real data
- Bridge returns PASS/FAIL

## Failure Modes
- No score = pipeline not wired
- Score always 100 = rules not applied
- No widget update = API not connected
