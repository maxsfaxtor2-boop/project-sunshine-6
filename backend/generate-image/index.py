"""Генерация изображений через FAL.ai (FLUX) и сохранение в S3 + БД"""
import json
import os
import uuid
import base64
import urllib.request
import urllib.error
import psycopg2
import boto3

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    user_id = body.get('user_id')
    prompt = (body.get('prompt') or '').strip()
    title = (body.get('title') or prompt[:50] or 'Без названия').strip()

    if not user_id or not prompt:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'user_id и prompt обязательны'})}

    fal_key = os.environ['FAL_API_KEY']

    req_data = json.dumps({
        'prompt': prompt,
        'image_size': 'square_hd',
        'num_images': 1,
        'enable_safety_checker': True,
    }).encode('utf-8')

    req = urllib.request.Request(
        'https://fal.run/fal-ai/flux/schnell',
        data=req_data,
        headers={
            'Authorization': f'Key {fal_key}',
            'Content-Type': 'application/json',
        },
        method='POST',
    )

    with urllib.request.urlopen(req, timeout=60) as resp:
        fal_result = json.loads(resp.read().decode('utf-8'))

    image_url = fal_result['images'][0]['url']

    img_req = urllib.request.Request(image_url)
    with urllib.request.urlopen(img_req, timeout=30) as img_resp:
        image_data = img_resp.read()

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    key = f"works/{user_id}/{uuid.uuid4().hex}.jpg"
    s3.put_object(Bucket='files', Key=key, Body=image_data, ContentType='image/jpeg')
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p32437567_project_sunshine_6')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO %s.works (user_id, title, type, url, prompt) VALUES (%s, '%s', 'photo', '%s', '%s') RETURNING id" % (
            schema,
            int(user_id),
            title.replace("'", "''"),
            cdn_url.replace("'", "''"),
            prompt.replace("'", "''"),
        )
    )
    work_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'success': True, 'id': work_id, 'url': cdn_url, 'title': title}),
    }
