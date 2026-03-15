#!/usr/bin/env node
/**
 * T4H Bridge MCP Server
 * Wraps the T4H AWS bridge endpoint as a Claude Code MCP server.
 * Place at: ~/.claude/plugins/t4h-bridge/server.js
 * Requires: npm install @modelcontextprotocol/sdk node-fetch
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

const BRIDGE_URL = process.env.BRIDGE_URL || "https://m5oqj21chd.execute-api.ap-southeast-2.amazonaws.com/lambda/invoke";
const BRIDGE_API_KEY = process.env.BRIDGE_API_KEY || "";

async function callBridge(payload) {
  const res = await fetch(BRIDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": BRIDGE_API_KEY
    },
    body: JSON.stringify(payload)
  });
  return res.json();
}

const server = new Server(
  { name: "t4h-bridge", version: "1.0.0" },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "t4h_sql",
      description: "Execute SQL against T4H Supabase. DDL-safe. Use for SELECT, INSERT, UPDATE, CREATE TABLE, CREATE FUNCTION.",
      inputSchema: {
        type: "object",
        properties: {
          sql: { type: "string", description: "SQL statement to execute" }
        },
        required: ["sql"]
      }
    },
    {
      name: "t4h_lambda",
      description: "Invoke any T4H Lambda function via the bridge. Supports all registered functions in mcp_lambda_registry.",
      inputSchema: {
        type: "object",
        properties: {
          fn: { type: "string", description: "Lambda function name (e.g. troy-ses-sender, troy-s3-manager)" },
          payload: { type: "object", description: "Payload to pass to the function" }
        },
        required: ["fn"]
      }
    },
    {
      name: "t4h_status",
      description: "Get T4H portfolio status — L23 businesses, pending tasks, RDTI gaps.",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    {
      name: "t4h_secret",
      description: "Read a credential from cap_secrets by key name.",
      inputSchema: {
        type: "object",
        properties: {
          key: { type: "string", description: "Secret key name (e.g. OPENAI_API_KEY)" }
        },
        required: ["key"]
      }
    }
  ]
}));

server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result;

    if (name === "t4h_sql") {
      result = await callBridge({ fn: "troy-sql-executor", sql: args.sql });
    }

    else if (name === "t4h_lambda") {
      result = await callBridge({ fn: args.fn, ...args.payload });
    }

    else if (name === "t4h_status") {
      const sql = `
        SELECT b.biz_name, b.level, b.status,
               COUNT(s.id) FILTER (WHERE s.resolved_at IS NULL) AS open_signals
        FROM t4h_canonical_28_first_pass b
        LEFT JOIN autonomy_signals s ON s.biz_key = b.biz_key
        GROUP BY b.biz_name, b.level, b.status
        ORDER BY b.level DESC, b.status
        LIMIT 28
      `;
      result = await callBridge({ fn: "troy-sql-executor", sql });
    }

    else if (name === "t4h_secret") {
      result = await callBridge({
        fn: "troy-sql-executor",
        sql: `SELECT value FROM cap_secrets WHERE key = '${args.key}' LIMIT 1`
      });
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
