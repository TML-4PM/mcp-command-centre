import json

def validate(event):
    job = event.get('job', {})
    evidence = event.get('evidence', {})

    required_job_fields = ['job_id','action','function_name']
    for f in required_job_fields:
        if f not in job:
            return {'classification':'PRETEND','reason':f'missing {f}'}

    if not evidence:
        return {'classification':'PRETEND','reason':'no evidence'}

    if not evidence.get('output_location') or not evidence.get('writeback_location'):
        return {'classification':'PARTIAL','reason':'missing output/writeback'}

    return {'classification':'REAL'}


def handler(event, context):
    result = validate(event)
    return {
        'statusCode':200,
        'body':json.dumps(result)
    }