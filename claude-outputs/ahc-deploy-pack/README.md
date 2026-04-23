# AHC Auth + Identity Deployment — Receipt

**Deployment ID:** `ahc-full-deploy-v1`
**Executed:** 2026-04-24 (UTC 2026-04-23T23:36Z)
**Target:** S1 (`lzfgigiyqpuuxslsygjt`) via bridge `zdgnab3py0`
**Canonical change:** id `386` — severity HIGH
**Status:** **REAL** (26/28 SQL statements OK, 2 skipped as not required)

---

## 1. What actually broke (root cause)

The existing `public.handle_new_user()` trigger inserted into `profiles(id, email, first_name, last_name)` — but `profiles` **has no `first_name` or `last_name` columns** (it has `full_name`). Every auth.users insert therefore rolled back with `column "first_name" of relation "profiles" does not exist`, surfacing to the UI as *"Database error saving new user"*.

Pre-deploy forensics:

| check | value |
|---|---|
| `auth.users` total | 4 |
| `auth.users` in last 5 days | 0 (signups blocked) |
| `profiles` rows | 49 (all pre-existing seed; **none linked to any auth user**) |
| Orphaned `auth.users` (no profile) | 4 |

## 2. What was refused

The pasted "🔥 HARD RESET" block included `drop table if exists public.profiles cascade;`. **Refused** — would have destroyed 49 rows of live data on a shared identity table used across the T4H portfolio. Same for `create policy if not exists` (invalid PG syntax; would have failed silently on some pg versions). Same for `create table consent_records (...)` with a different schema from the existing 28-column ConsentX table.

## 3. What shipped (additive, idempotent)

### Schema
- `public.profiles` += 7 cols: `consent_state, lifecycle_stage, ahc_agent_id, org_id, signal_score, revenue_value, last_active` (all nullable / defaulted — zero impact on existing 49 rows)
- `public.auth_event_log` (new) + indexes on (status, created_at) and (user_id)
- `public.user_events` (new) + indexes
- `public.ahc_jobs` (new) + partial index on active statuses
- `public.value_events` (new) + indexes

### Trigger function
`public.handle_new_user()` replaced with schema-correct, exception-safe body:
- Inserts into `profiles(id, email, full_name)` with `ON CONFLICT (id) DO UPDATE`
- Derives `full_name` from `raw_user_meta_data.full_name` → `first_name + ' ' + last_name` → `email local-part` fallback chain
- Inserts into `user_roles(user_id, role)` with `ON CONFLICT DO NOTHING`
- Each sub-step wrapped in its own `EXCEPTION WHEN OTHERS` → logs to `auth_event_log` (`PROFILE_INSERT_FAILED` / `ROLE_INSERT_FAILED`)
- Outer `EXCEPTION` catches anything else and logs `TRIGGER_FATAL`
- **Always returns NEW** → auth.users insert never blocks again, even under future schema drift

### Trigger
Trigger `on_auth_user_created` on `auth.users` was not dropped/recreated — Supabase owns the `auth` schema so the executor cannot touch it. Not required: the trigger already points at `public.handle_new_user()`, and `CREATE OR REPLACE FUNCTION` replaces the body in place. Live.

### Command Centre views (`cc` schema)
- `cc.v_auth_health` — last 7 days of `auth_event_log` rolled up by (hour, status)
- `cc.v_user_lifecycle` — `profiles.lifecycle_stage` counts
- `cc.v_value_flow` — `value_events` by source (count + total + last event)

### Backfill
- 4 orphaned `auth.users` now have `profiles` rows (derived `full_name` from metadata/email)
- 4 `auth_event_log` rows with status `BACKFILLED` written for audit

## 4. Post-deploy verification

```
trigger_still_exists                    1     ✓
trigger_enabled                         true  ✓
fn_body contains 'full_name'            true  ✓
fn_body has TRIGGER_FATAL handler       true  ✓
auth_event_log rows                     4     ✓ (backfills)
user_events/ahc_jobs/value_events       all 1 ✓
profiles new 7 cols                     all 7 ✓
cc.v_auth_health/v_user_lifecycle/v_value_flow   all 3 ✓
profiles now linked to auth.users       4     ✓
auth.users without profile              0     ✓
```

## 5. Smoke test (run after a real signup from AHC frontend)

```sql
-- Most recent signup outcomes (last hour)
select created_at, status, email, error
from public.auth_event_log
where created_at > now() - interval '1 hour'
order by created_at desc
limit 20;

-- Confirm the profile landed
select p.id, p.email, p.full_name, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
where u.created_at > now() - interval '1 hour'
order by u.created_at desc;

-- CC view health snapshot
select * from cc.v_auth_health order by hr desc limit 10;
```

Expected: new `auth_event_log` row with `status='SUCCESS'` and matching `profiles` row. Any `status like '%FAILED%'` / `'TRIGGER_FATAL'` row carries the exact `sqlerrm` in the `error` column — no more black box.

## 6. Frontend (AHC site)

Signup handler must **not** manually insert into `profiles` — the trigger owns that. Correct shape:

```js
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      full_name: fullName,  // optional; trigger uses it if present
      role: 'user'          // optional; defaults to 'user'
    }
  }
});
if (error) { /* surface to UI */ }
// trigger populates public.profiles + public.user_roles automatically
```

## 7. Rollback

Previous `handle_new_user` body saved to `/home/claude/handle_new_user_PRE_v1.sql` (704 bytes). To restore:

```sql
-- paste contents of handle_new_user_PRE_v1.sql
```

New tables (`auth_event_log`, `user_events`, `ahc_jobs`, `value_events`) and `profiles` added columns can remain as dormant/no-op — removing them is not required to roll back auth behaviour.

## 8. Known follow-ups (NOT done here)

These were in the pasted doc but are out of scope for "fix the signup":

| Item | State | Reason |
|---|---|---|
| DROP + CREATE TRIGGER on auth.users | Skipped | Supabase ownership; not needed — function replacement is live |
| Write a `consent_records` simple schema | Refused | Existing ConsentX table has 28 cols; simple schema would clash |
| Tighten RLS policies on profiles | Not touched | Existing 3 policies (`USING true`) are loose but not the break |
| Auto-recovery cron (retry failed profile inserts) | Not scheduled | With new exception-safe function, failures are logged not swallowed; schedule later if volume warrants |
| Stripe / Command Centre widget wiring | Not shipped | UI work; SQL side is ready (value_events table + cc.v_value_flow view) |

## 9. Evidence bundle

| Artefact | Path |
|---|---|
| Master SQL pack (as executed) | `/home/claude/ahc_master_pack_v1.sql` |
| Per-statement result log | `/home/claude/deploy_results.json` |
| Pre-deploy function backup | `/home/claude/handle_new_user_PRE_v1.sql` |
| Bridge helper | `/home/claude/bridge.py` |
| Statement splitter / runner | `/home/claude/deploy.py` |
| Canonical change row | `public.t4h_canonical_changes` id=`386` |
| Scratchpad entry | `public.llm_scratchpad` topic=`ahc-full-deploy-v1` |
