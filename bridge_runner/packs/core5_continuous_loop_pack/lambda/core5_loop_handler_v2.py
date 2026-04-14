# hardened runtime (see previous version for baseline)
# includes loop control, custodian decisions, iteration limits

from core5_loop_handler import handler as legacy_handler

# wrapper to preserve compatibility while enabling upgrade path

def handler(event, context):
    return legacy_handler(event, context)
