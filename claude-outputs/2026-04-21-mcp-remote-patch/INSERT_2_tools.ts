// ═══════════════════════════════════════════════════════════════════
// INSERT #2 — add these 5 new tools inside `function buildServer()`
// Location: src/index.ts, immediately AFTER the `aws_s3_list` tool
// closing `);` and BEFORE `return server;` (around line 630)
// ═══════════════════════════════════════════════════════════════════

  // ── T4H BRIDGE DISPATCH ─────────────────────────────────────────
  // One MCP tool → 330+ registered Lambdas via canonical bridge.
  // Don't add per-Lambda MCP tools; parameterise this one.
  server.registerTool(
    "t4h_bridge_invoke",
    {
      title: "T4H Bridge Invoke",
      description:
        "Invokes any allowlisted Lambda via the T4H canonical bridge. Use t4h_registry_list to discover callable fn names.",
      inputSchema: {
        fn: z.string().min(1).describe("Lambda function name (must be is_callable=true)"),
        payload: z.record(z.string(), z.any()).default({}),
      },
    },
    async ({ fn, payload }) => {
      ensureEnv("T4H_BRIDGE_URL", config.bridgeUrl);
      ensureEnv("T4H_BRIDGE_KEY", config.bridgeKey);

      const response = await fetch(config.bridgeUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": config.bridgeKey,
        },
        body: JSON.stringify({ fn, payload }),
      });

      const text = await response.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text };
      }

      return jsonText({
        fn,
        status: response.status,
        ok: response.ok,
        response: data,
      });
    },
  );

  // ── T4H REGISTRY DISCOVERY ──────────────────────────────────────
  // Read-only introspection across registry + lambda + entity tables.
  server.registerTool(
    "t4h_registry_list",
    {
      title: "T4H Registry List",
      description:
        "Lists callable Lambdas from mcp_lambda_registry and/or entities from core.registry_entities. Use for capability discovery.",
      inputSchema: {
        source: z.enum(["lambdas", "entities", "both"]).default("lambdas"),
        filter: z.string().optional().describe("ILIKE filter on name/slug"),
        limit: z.number().int().min(1).max(200).default(50),
      },
    },
    async ({ source, filter, limit }) => {
      const safeFilter = filter?.replace(/'/g, "''");
      const out: JsonRecord = {};

      if (source === "lambdas" || source === "both") {
        const lamFilter = safeFilter
          ? ` AND (function_name ILIKE '%${safeFilter}%' OR category ILIKE '%${safeFilter}%')`
          : "";
        const sql = `
          SELECT function_name, category, pillar, business_key,
                 invocation_pattern, is_callable, callable_reason,
                 last_invoked_at, invocation_count, status
          FROM public.mcp_lambda_registry
          WHERE is_callable = true ${lamFilter}
          ORDER BY function_name
          LIMIT ${limit}
        `;
        out.lambdas = await runSupabaseSql(sql);
      }

      if (source === "entities" || source === "both") {
        const entFilter = safeFilter
          ? ` AND (entity_key ILIKE '%${safeFilter}%' OR name ILIKE '%${safeFilter}%')`
          : "";
        const sql = `
          SELECT entity_key, name, entity_type::text AS entity_type,
                 status::text AS status, autonomy_tier::text AS autonomy_tier
          FROM core.registry_entities
          WHERE status = 'active' ${entFilter}
          ORDER BY entity_key
          LIMIT ${limit}
        `;
        out.entities = await runSupabaseSql(sql);
      }

      return jsonText(out);
    },
  );

  // ── CROSS-LLM SCRATCHPAD ────────────────────────────────────────
  // Read/write llm_scratchpad for coordination between Claude ↔ GPT ↔ cron.
  server.registerTool(
    "t4h_scratchpad_rw",
    {
      title: "T4H Scratchpad Read/Write",
      description:
        "Read or append to llm_scratchpad (cross-LLM shared memory). Action=read returns pinned+recent. Action=write appends.",
      inputSchema: {
        action: z.enum(["read", "write"]),
        topic: z.string().optional(),
        content: z.string().optional(),
        author: z.string().default("mcp-remote"),
        tags: z.array(z.string()).default([]),
        pinned: z.boolean().default(false),
        limit: z.number().int().min(1).max(50).default(20),
      },
    },
    async ({ action, topic, content, author, tags, pinned, limit }) => {
      if (action === "read") {
        const topicClause = topic
          ? `WHERE topic ILIKE '%${topic.replace(/'/g, "''")}%'`
          : "";
        const sql = `
          SELECT id, author, topic, content, tags, pinned, created_at
          FROM public.llm_scratchpad
          ${topicClause}
          ORDER BY pinned DESC, created_at DESC
          LIMIT ${limit}
        `;
        const result = await runSupabaseSql(sql);
        return jsonText({ action, ...result });
      }

      if (!topic || !content) {
        throw new Error("write requires both topic and content");
      }

      const tagsArray = tags.length
        ? `ARRAY[${tags.map((t) => `'${t.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : "ARRAY[]::text[]";

      const sql = `
        INSERT INTO public.llm_scratchpad
          (author, topic, content, tags, pinned)
        VALUES (
          '${author.replace(/'/g, "''")}',
          '${topic.replace(/'/g, "''")}',
          '${content.replace(/'/g, "''")}',
          ${tagsArray},
          ${pinned}
        )
        RETURNING id, created_at
      `;
      const result = await runSupabaseSql(sql);
      return jsonText({ action, ...result });
    },
  );

  // ── CANONICAL CHANGE EMIT ───────────────────────────────────────
  // Evidence layer. Writes to t4h_canonical_changes (matches real schema).
  server.registerTool(
    "t4h_canonical_emit",
    {
      title: "T4H Canonical Change Emit",
      description:
        "Records a canonical change event for audit/evidence. Triggers Telegram broadcast via fn_broadcast_canonical_change() if broadcast_to is set.",
      inputSchema: {
        change_type: z.enum([
          "MILESTONE",
          "SCHEMA",
          "BUSINESS",
          "IP",
          "PRODUCT",
          "FINANCIAL",
          "SYSTEM_CHANGE",
          "BLOCKER",
          "DECISION",
        ]),
        severity: z.enum(["LOW", "NORMAL", "HIGH", "CRITICAL"]).default("NORMAL"),
        title: z.string().min(3).max(200),
        summary: z.string().min(3).max(2000),
        affected: z.array(z.string()).default([]),
        evidence_ref: z.string().optional(),
        author: z.string().default("mcp-remote"),
      },
    },
    async ({ change_type, severity, title, summary, affected, evidence_ref, author }) => {
      const affectedArr = affected.length
        ? `ARRAY[${affected.map((a) => `'${a.replace(/'/g, "''")}'`).join(",")}]::text[]`
        : "ARRAY[]::text[]";
      const sql = `
        INSERT INTO public.t4h_canonical_changes
          (change_type, severity, title, summary, affected, evidence_ref, author, created_at)
        VALUES (
          '${change_type}',
          '${severity}',
          '${title.replace(/'/g, "''")}',
          '${summary.replace(/'/g, "''")}',
          ${affectedArr},
          ${evidence_ref ? `'${evidence_ref.replace(/'/g, "''")}'` : "NULL"},
          '${author.replace(/'/g, "''")}',
          NOW()
        )
        RETURNING id, change_type, severity, title, created_at
      `;
      const result = await runSupabaseSql(sql);
      return jsonText({ status: "REAL", ...result });
    },
  );

  // ── REALITY STATE CLASSIFIER ────────────────────────────────────
  // Classifies an entity/capability as REAL | PARTIAL | PRETEND.
  server.registerTool(
    "t4h_reality_state",
    {
      title: "T4H Reality State",
      description:
        "Classifies a capability as REAL (runtime proof), PARTIAL (incomplete), or PRETEND (no evidence). Rule: last_invoked + is_callable + evidence rows.",
      inputSchema: {
        entity_name: z
          .string()
          .min(1)
          .describe("Lambda fn name or entity slug"),
      },
    },
    async ({ entity_name }) => {
      const safe = entity_name.replace(/'/g, "''");
      const sql = `
        WITH lam AS (
          SELECT function_name, is_callable, last_invoked_at, invocation_count,
                 status, invocation_pattern
          FROM public.mcp_lambda_registry
          WHERE function_name = '${safe}'
          LIMIT 1
        ),
        ent AS (
          SELECT entity_key, status::text AS status, autonomy_tier::text AS autonomy_tier
          FROM core.registry_entities
          WHERE entity_key = '${safe}' OR entity_key = 'lambda.${safe}' OR name = '${safe}'
          LIMIT 1
        ),
        ev AS (
          SELECT COUNT(*) AS evidence_count
          FROM public.t4h_canonical_changes
          WHERE title ILIKE '%${safe}%' OR summary ILIKE '%${safe}%' OR '${safe}' = ANY(affected)
        )
        SELECT
          (SELECT row_to_json(lam) FROM lam) AS lambda_row,
          (SELECT row_to_json(ent) FROM ent) AS entity_row,
          (SELECT evidence_count FROM ev) AS evidence_count,
          CASE
            WHEN (SELECT is_callable FROM lam) = true
              AND (SELECT last_invoked_at FROM lam) > NOW() - INTERVAL '7 days'
              AND (SELECT evidence_count FROM ev) > 0
            THEN 'REAL'
            WHEN (SELECT is_callable FROM lam) = true
              OR (SELECT status FROM ent) = 'active'
            THEN 'PARTIAL'
            ELSE 'PRETEND'
          END AS state
      `;
      const result = await runSupabaseSql(sql);
      return jsonText({ entity: entity_name, ...result });
    },
  );
