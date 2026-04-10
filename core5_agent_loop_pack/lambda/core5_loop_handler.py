import json

def handler(event, context):
    task = event.get('task')
    return {
        'status': 'running',
        'task': task
    }
