/**
 * shortcut-telemetry.ts
 * Call logShortcutUse() whenever a T4H shortcut is expanded.
 * Fires fn_log_shortcut_use via the bridge SQL executor.
 *
 * Usage (from any component or hook):
 *   import { logShortcutUse } from "@/lib/shortcut-telemetry";
 *   await logShortcutUse("/ready", "claude.ai");
 *
 * In chat context, fire via bridge:
 *   {"fn":"troy-sql-executor","sql":"select fn_log_shortcut_use(\'/ready\','claude.ai')"}
 */

import { bridgeSQL } from "@/lib/bridge";

export interface ShortcutUsageResult {
  success: boolean;
  trigger: string;
  chars_saved: number;
  seconds_saved: number;
}

export async function logShortcutUse(
  trigger: string,
  source_app: string = "mcp-command-centre",
  user_label?: string
): Promise<ShortcutUsageResult | null> {
  const label = user_label ? `'${user_label}'` : "null";
  try {
    const rows = await bridgeSQL(
      `select fn_log_shortcut_use('${trigger}', '${source_app}', ${label})`
    );
    const result = rows?.[0]?.fn_log_shortcut_use;
    return result ?? null;
  } catch {
    return null;
  }
}

/** Batch log multiple shortcuts in one call (e.g. session flush) */
export async function logShortcutBatch(
  uses: Array<{ trigger: string; source_app?: string }>
): Promise<void> {
  const values = uses
    .map(u => `('${u.trigger}', '${u.source_app ?? "claude.ai"}', null)`)
    .join(", ");
  try {
    await bridgeSQL(
      `insert into public.shortcut_usage_log (trigger, source_app, user_label, estimated_chars_saved, estimated_seconds_saved)
       select r.trigger, r.source_app, null,
         greatest(char_length(s.expansion) - char_length(r.trigger), 0),
         round((greatest(char_length(s.expansion) - char_length(r.trigger), 0)::numeric / 40.0), 2)
       from (values ${values}) as r(trigger, source_app)
       join public.shortcut_registry s on s.trigger = r.trigger`
    );
  } catch { /* silent fail — telemetry must never break caller */ }
}

/**
 * Bridge SQL string for direct call from Claude chat context.
 * Paste into bridge call or store as a reusable pattern.
 */
export function shortcutBridgeSQL(trigger: string, source = "claude.ai"): string {
  return `select fn_log_shortcut_use('${trigger}', '${source}', null)`;
}

/** All active shortcut triggers — for autocomplete / validation */
export const ACTIVE_SHORTCUTS = [
  "/ready", "/rocket", "/audit", "/bridge-sql", "/pack",
  "/uh", "/deploy", "/bas", "/rdti", "/recon", "/banking",
  "/protocol", "/cc-page", "/schema-clean", "/evidence",
  "/launch", "/biz-health", "/workforce", "/campaign", "/seal", "/ledger", "/status"
];
