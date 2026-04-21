// ═══════════════════════════════════════════════════════════════════
// INSERT #1 — add these lines inside the `config` object literal
// Location: src/index.ts, inside `const config = { ... }` block
// Add BEFORE the closing `};` around line 42 (after `awsRegion` line)
// ═══════════════════════════════════════════════════════════════════

  bridgeUrl: process.env.T4H_BRIDGE_URL || "",
  bridgeKey: process.env.T4H_BRIDGE_KEY || "",
