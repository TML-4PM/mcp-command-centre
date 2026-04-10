# SQL Activity Widget Specification

## Purpose

Provide real-time visibility of SQL execution activity across all agents and systems.

## Data source

Supabase view: `v_sql_execution_activity`

## Expected columns

- request_id
- source
- sql_text (truncated)
- status
- execution_time_ms
- timestamp_utc
- reality_classification

## UI layout

Table view with sortable columns:

| request_id | source | status | time | ms | reality |

## Filters

- status (success, failed, rejected)
- source agent
- time range
- reality classification

## Behaviour

- auto-refresh every 5 seconds
- highlight failures in red
- highlight PRETEND in orange
- highlight REAL in green

## Drill-down

Click row → open payload + logs + replay button

## Integration

- Bridge execution logs
- Guardrail decisions
- Replay engine outputs

## Goal

Turn SQL from invisible backend action into observable system behaviour.
