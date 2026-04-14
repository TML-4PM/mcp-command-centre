"""
t4h-ou-rehydrate
Discovers legacy assets across all source systems and inserts into
control_tower.legacy_asset_inventory for classification + OU mapping.
Wave 20 / Architecture Level 35 / Autonomous / No HITL
RDTI: is_rd=True, project_code=T4H-CTEL
"""
import json
import os
import uuid
import boto3
import requests
from datetime import datetime, timezone

SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
BRIDGE_URL   = os.environ.get("BRIDGE_URL", "https://zdgnab3py0.execute-api.ap-southeast-2.amazonaws.com/prod/lambda/invoke")
BRIDGE_KEY   = os.environ.get("BRIDGE_API_KEY", "")
REGION       = os.environ.get("AWS_DEFAULT_REGION", "ap-southeast-2")

lambda_client = boto3.client("lambda", region_name=REGION)
eb_client     = boto3.client("events", region_name=REGION)


def now_utc():
    return datetime.now(timezone.utc).isoformat()


def sb_rpc(query: str) -> dict:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/rpc/run_sql",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
        },
        json={"query": query},
        timeout=30,
    )
    return r.json()


def sb_upsert(table: str, rows: list) -> dict:
    r = requests.post(
        f"{SUPABASE_URL}/rest/v1/{table}",
        headers={
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=minimal",
        },
        json=rows,
        timeout=30,
    )
    return {"status": r.status_code}


def discover_lambdas() -> list:
    assets = []
    try:
        paginator = lambda_client.get_paginator("list_functions")
        for page in paginator.paginate():
            for fn in page["Functions"]:
                assets.append({
                    "asset_key": f"lambda::{fn['FunctionName']}",
                    "asset_type": "lambda_function",
                    "source_system": "aws_lambda",
                    "source_ref": fn["FunctionArn"],
                    "title": fn["FunctionName"],
                    "truth_state": "PARTIAL",
                    "current_status": "discovered",
                    "last_seen_at": now_utc(),
                    "notes": json.dumps({
                        "runtime": fn.get("Runtime", ""),
                        "last_modified": fn.get("LastModified", ""),
                        "memory": fn.get("MemorySize", 128),
                    }),
                })
    except Exception as e:
        print(f"Lambda discover error: {e}")
    return assets


def discover_eventbridge_rules() -> list:
    assets = []
    try:
        paginator = eb_client.get_paginator("list_rules")
        for page in paginator.paginate():
            for rule in page["Rules"]:
                assets.append({
                    "asset_key": f"eb_rule::{rule['Name']}",
                    "asset_type": "eventbridge_rule",
                    "source_system": "aws_eventbridge",
                    "source_ref": rule.get("Arn", ""),
                    "title": rule["Name"],
                    "truth_state": "PARTIAL",
                    "current_status": "discovered",
                    "last_seen_at": now_utc(),
                    "notes": json.dumps({
                        "state": rule.get("State", ""),
                        "schedule": rule.get("ScheduleExpression", ""),
                    }),
                })
    except Exception as e:
        print(f"EB discover error: {e}")
    return assets


def discover_existing_registry() -> list:
    """Map existing registry entities to OU candidates."""
    result = sb_rpc(
        "SELECT entity_key, entity_name, entity_type, biz_key "
        "FROM core.registry_entities WHERE is_active = true LIMIT 500"
    )
    rows = result.get("rows", [])
    assets = []
    for r in rows:
        assets.append({
            "asset_key": f"registry::{r['entity_key']}",
            "asset_type": "registry_entity",
            "source_system": "supabase_registry",
            "source_ref": r["entity_key"],
            "title": r.get("entity_name", r["entity_key"]),
            "truth_state": "PARTIAL",
            "current_status": "discovered",
            "last_seen_at": now_utc(),
            "notes": json.dumps({
                "entity_type": r.get("entity_type", ""),
                "biz_key": r.get("biz_key", ""),
            }),
        })
    return assets


def handler(event, context):
    run_id = str(uuid.uuid4())
    scope = event.get("scope", "all")

    sb_rpc(f"""
        INSERT INTO control_tower.execution_run (run_id, run_type, scope, run_status)
        VALUES ('{run_id}', 'rehydrate', '{scope}', 'running')
        ON CONFLICT DO NOTHING
    """)

    all_assets = []
    errors = []

    for discover_fn in [discover_lambdas, discover_eventbridge_rules, discover_existing_registry]:
        try:
            all_assets += discover_fn()
        except Exception as e:
            errors.append(str(e))

    # Batch upsert
    BATCH = 50
    inserted = 0
    for i in range(0, len(all_assets), BATCH):
        batch = all_assets[i:i + BATCH]
        res = sb_upsert("control_tower.legacy_asset_inventory", batch)
        if res["status"] in (200, 201, 204):
            inserted += len(batch)

    summary = {"total": len(all_assets), "inserted": inserted, "errors": errors}
    sb_rpc(f"""
        UPDATE control_tower.execution_run
        SET ended_at = now(),
            run_status = 'passed',
            summary = '{json.dumps(summary)}'::jsonb
        WHERE run_id = '{run_id}'
    """)

    return {
        "run_id": run_id,
        "status": "rehydrated",
        "total_discovered": len(all_assets),
        "inserted": inserted,
        "errors": errors,
        "ts": now_utc(),
    }
