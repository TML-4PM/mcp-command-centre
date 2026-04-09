from pathlib import Path
import json

INPUT = Path('intel_stack/exports/ranked_targets.csv')
OUT = Path('intel_stack/bridge/dropoff/outreach_plan.json')


def build_outreach():
    if not INPUT.exists():
        print('No ranked targets found')
        return

    lines = INPUT.read_text().splitlines()[1:21]

    targets = []
    for l in lines:
        parts = l.split(',')
        targets.append({
            'email': parts[0],
            'segment': parts[3],
            'score': parts[4]
        })

    plan = {
        'status': 'READY',
        'targets': targets,
        'message_template': 'We are helping organisations respond to current compliance pressure. Can assist immediately.'
    }

    OUT.write_text(json.dumps(plan, indent=2))
    print(json.dumps(plan, indent=2))


if __name__ == '__main__':
    build_outreach()
