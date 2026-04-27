# Daily Reports Fix Pack

Issue: https://github.com/TML-4PM/mcp-command-centre/issues/14

## Scope

This pack fixes two daily report problems:

1. Atlas report content is being shown as raw HTML instead of rendered email content.
2. HoloOrg agent usage reporting shows a point-in-time number without trend, baseline, status, or interpretation.

## Required final state

Atlas report:
- sends HTML as HTML, not plain text
- includes a plain text fallback
- includes a dashboard link
- records report delivery evidence

HoloOrg report:
- compares today against yesterday
- compares today against 7-day and 30-day baselines
- identifies expected agents that were silent
- reports success, failure, and blocked counts
- produces a plain-English status: NORMAL, DEGRADED, INCIDENT, or UNKNOWN
- records report delivery evidence

## Files

- sql/001_daily_report_observability.sql
- src/reporting/types.ts
- src/reporting/emailPayload.ts
- src/reporting/atlasReport.ts
- src/reporting/holoorgAgentUsage.ts
- src/reporting/reportDeliveryLog.ts
- tests/reporting.test.ts
- BRIDGE_EXECUTION.md

## Completion criteria

- Atlas test email renders visually.
- HoloOrg report includes trend and baseline fields.
- Report delivery is logged.
- Final commit, PR, or workflow receipt is attached to issue 14.
