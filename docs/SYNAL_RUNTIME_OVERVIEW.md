# SYNAL RUNTIME OVERVIEW

Synal operates as a continuous loop:

1. Signal ingestion
2. Task creation
3. Flow orchestration
4. Action execution
5. Proof generation

## Key loops

### Repair loop
Detect PRETEND or broken assets -> enqueue repair -> execute -> generate proof

### Command loop
Command queue -> worker picks -> executes -> completes

### Visibility loop
Supabase views -> UI surfaces -> operator actions

## Objective

Move all assets to REAL state via continuous execution and proof validation.

## Execution principle

No asset is complete without proof.
