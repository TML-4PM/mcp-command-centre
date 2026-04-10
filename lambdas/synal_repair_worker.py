import json

def handler(event, context):
    # minimal repair loop stub
    return {
        "status": "ok",
        "action": "repair_scan",
        "details": "Scan for UNWIRED / PRETEND assets and trigger commands"
    }
