# Security Hardening — MCP Command Centre

## Why this document exists

The command centre is not a passive UI. It is a bridge-backed operator surface with reach into execution paths.

That means security mistakes here are operational mistakes, not just code quality issues.

---

## Current primary risk

The current proxy implementation contains a hardcoded fallback secret path for the bridge API key.

That is the wrong operating posture.

### Why it is risky

- a deploy can appear healthy even when environment configuration is broken
- secrets can live in repository history
- rotation becomes harder
- different environments can accidentally share a secret path
- operators lose the ability to trust startup state

---

## Required security posture

### 1. Environment-only secrets

Secrets must only come from environment variables or a managed secret store.

For this repo, that means:
- `BRIDGE_API_KEY` must be provided by the deployment environment
- no fallback key in source
- no sample real key in docs
- no secret values in test fixtures

### 2. Fail closed, not open

If the bridge key is missing, the proxy must fail immediately.

Desired behavior:
- startup or first request throws an explicit configuration error
- deployment should be considered invalid
- no silent fallback behavior

### 3. Minimize browser knowledge

The browser should know:
- only the local proxy path
- never the API key
- ideally not the raw bridge target URL either

The proxy should own downstream bridge targeting.

### 4. Constrain SQL execution exposure

The current UI sends SQL through the bridge path. That is workable, but it must be treated as privileged.

At minimum:
- avoid string-built SQL from unconstrained user input
- prefer approved query keys for common dashboard reads
- move high-value reads behind named query registry entries or RPC wrappers
- classify destructive or mutating actions separately from read-only actions

### 5. Separate environments

Production, staging, and development should not share the same bridge secret.

Recommended:
- distinct API keys per environment
- distinct bridge target URLs per environment
- environment tagging in logs and UI

---

## Immediate code changes required

### Replace secret fallback pattern

Bad pattern:

```ts
const BRIDGE_KEY = process.env.BRIDGE_API_KEY || 'fallback';
```

Required pattern:

```ts
const BRIDGE_KEY = process.env.BRIDGE_API_KEY;
if (!BRIDGE_KEY) {
  throw new Error('Missing BRIDGE_API_KEY');
}
```

### Move bridge URL into environment

Bad pattern:
- bridge URL hardcoded in source

Preferred:

```ts
const BRIDGE_URL = process.env.BRIDGE_URL;
if (!BRIDGE_URL) {
  throw new Error('Missing BRIDGE_URL');
}
```

---

## CI security gates

The repository should fail CI when any of the following are detected:

1. hardcoded bridge key fallback
2. obvious live-secret pattern in source
3. proxy code using `||` fallback for critical secrets
4. bridge URL hardcoded in production path without explicit exception

---

## Runtime security gates

At runtime, the command centre should:

- reject requests when bridge config is missing
- surface a clear configuration error in logs
- never echo secrets back to the browser
- never include secrets in client bundles

---

## Recommended next-level hardening

1. replace raw SQL dashboard reads with signed query keys or RPC wrappers
2. add request IDs to every bridge call
3. log caller surface (`mcp-command-centre`) in proxy payloads
4. classify bridge actions as `query`, `command`, `admin`
5. add allow-listing for query keys exposed to browser surfaces

---

## Bottom line

This repo is now important enough that secret handling and bridge access must be treated as production security, not development convenience.

The first rule is simple:

**No real secret fallback in source. Ever.**
