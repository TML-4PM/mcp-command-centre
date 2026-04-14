import json
import datetime

BANNED_PHRASES = [
    "leverage synergy",
    "delve",
    "fast-paced landscape",
    "game-changing"
]

def score_style(text: str):
    score = 100
    violations = []

    for phrase in BANNED_PHRASES:
        if phrase in text.lower():
            score -= 15
            violations.append(phrase)

    return max(score, 0), violations


def lambda_handler(event, context):
    text = event.get("text", "")
    identity = event.get("identity_key", "troy-default")

    score, violations = score_style(text)

    result = {
        "identity_key": identity,
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "style_score": score,
        "violations": violations,
        "status": "PASS" if score >= 70 else "FAIL",
        "original_text": text
    }

    return {
        "statusCode": 200,
        "body": json.dumps(result)
    }
