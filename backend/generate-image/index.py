"""Универсальная генерация контента: фото, видео, анимация, шаблон, реклама — через FAL.ai"""
import json
import os
import uuid
import base64
import urllib.request
import time
import psycopg2
import boto3

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

TEMPLATE_SIZES = {
    'banner': 'landscape_16_9',
    'square': 'square_hd',
    'story':  'portrait_16_9',
    'vk':     'landscape_4_3',
}

AD_PLATFORMS = {
    'vk':        ('square_hd',      'ВКонтакте'),
    'instagram': ('square_hd',      'Instagram'),
    'facebook':  ('landscape_16_9', 'Facebook'),
    'stories':   ('portrait_16_9',  'Сторис'),
    'yandex':    ('landscape_4_3',  'Яндекс'),
}


def fal_post(url, payload, fal_key, timeout=120):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization': f'Key {fal_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode('utf-8'))


def fal_upload_image(image_bytes, fal_key, mime_type='image/jpeg'):
    """Загружает изображение через FAL storage API и возвращает URL"""
    req = urllib.request.Request(
        'https://fal.run/fal-ai/storage/upload/initiate',
        data=json.dumps({'content_type': mime_type, 'file_size': len(image_bytes)}).encode('utf-8'),
        headers={'Authorization': f'Key {fal_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        init_result = json.loads(resp.read().decode('utf-8'))

    upload_url = init_result['upload_url']
    file_url = init_result['file_url']

    put_req = urllib.request.Request(
        upload_url,
        data=image_bytes,
        headers={'Content-Type': mime_type},
        method='PUT',
    )
    with urllib.request.urlopen(put_req, timeout=60) as r:
        r.read()

    return file_url


def fal_queue_submit_only(endpoint, payload, fal_key):
    """Отправляет задачу в FAL queue и сразу возвращает request_id"""
    req = urllib.request.Request(
        f'https://queue.fal.run/{endpoint}',
        data=json.dumps(payload).encode('utf-8'),
        headers={'Authorization': f'Key {fal_key}', 'Content-Type': 'application/json'},
        method='POST',
    )
    with urllib.request.urlopen(req, timeout=20) as resp:
        result = json.loads(resp.read().decode('utf-8'))
    return result['request_id']


def fal_queue_poll(endpoint, request_id, fal_key):
    """Проверяет статус задачи в FAL queue. Возвращает status + result если готово."""
    status_url = f'https://queue.fal.run/{endpoint}/requests/{request_id}/status'
    result_url = f'https://queue.fal.run/{endpoint}/requests/{request_id}'

    status_req = urllib.request.Request(
        status_url,
        headers={'Authorization': f'Key {fal_key}'},
        method='GET',
    )
    with urllib.request.urlopen(status_req, timeout=15) as resp:
        status = json.loads(resp.read().decode('utf-8'))

    job_status = status.get('status', 'IN_QUEUE')

    if job_status == 'COMPLETED':
        result_req = urllib.request.Request(
            result_url,
            headers={'Authorization': f'Key {fal_key}'},
            method='GET',
        )
        with urllib.request.urlopen(result_req, timeout=20) as resp:
            return {'status': 'COMPLETED', 'result': json.loads(resp.read().decode('utf-8'))}

    if job_status == 'FAILED':
        return {'status': 'FAILED', 'error': str(status.get('error', 'unknown error'))}

    return {'status': job_status}


def download_url(url, timeout=60):
    with urllib.request.urlopen(urllib.request.Request(url), timeout=timeout) as resp:
        return resp.read()


def upload_to_s3(s3, data, key, content_type):
    s3.put_object(Bucket='files', Key=key, Body=data, ContentType=content_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


def save_work(user_id, title, work_type, url, prompt):
    schema = os.environ.get('MAIN_DB_SCHEMA', 't_p32437567_project_sunshine_6')
    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO %s.works (user_id, title, type, url, prompt) VALUES (%s, '%s', '%s', '%s', '%s') RETURNING id" % (
            schema, int(user_id),
            title.replace("'", "''"),
            work_type.replace("'", "''"),
            url.replace("'", "''"),
            prompt.replace("'", "''"),
        )
    )
    work_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()
    return work_id


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    user_id = body.get('user_id')
    work_type = (body.get('type') or 'photo').strip()
    action = (body.get('action') or 'generate').strip()

    if not user_id:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'user_id обязателен'})}

    fal_key = os.environ.get('FAL_API_KEY', '')
    if not fal_key:
        return {'statusCode': 500, 'headers': HEADERS, 'body': json.dumps({'error': 'FAL_API_KEY не настроен на сервере'})}

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

    # ── POLL: проверка статуса длинной задачи ────────────────────────
    if action == 'poll':
        endpoint = body.get('endpoint', '')
        request_id = body.get('request_id', '')
        title = body.get('title', '')
        if not endpoint or not request_id:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'endpoint и request_id обязательны'})}

        poll_result = fal_queue_poll(endpoint, request_id, fal_key)

        if poll_result['status'] == 'COMPLETED':
            result = poll_result['result']
            vid_url = (result.get('video') or {}).get('url') or result.get('video_url', '')
            data = download_url(vid_url)
            file_prefix = 'anim' if work_type == 'animation' else 'video'
            key = f"works/{user_id}/{file_prefix}_{uuid.uuid4().hex}.mp4"
            cdn = upload_to_s3(s3, data, key, 'video/mp4')
            prompt_text = body.get('prompt', 'Оживление фото' if work_type == 'animation' else '')
            work_id = save_work(user_id, title, work_type, cdn, prompt_text)
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'COMPLETED', 'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'video'})}

        if poll_result['status'] == 'FAILED':
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'FAILED', 'error': poll_result.get('error', 'Ошибка генерации')})}

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': poll_result['status']})}

    # ── ФОТО ─────────────────────────────────────────────────────────
    if work_type == 'photo':
        prompt = (body.get('prompt') or '').strip()
        title = (body.get('title') or prompt[:60] or 'Фото').strip()
        if not prompt:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'prompt обязателен'})}

        result = fal_post('https://fal.run/fal-ai/flux/schnell', {
            'prompt': prompt, 'image_size': 'square_hd', 'num_images': 1, 'enable_safety_checker': True,
        }, fal_key)
        data = download_url(result['images'][0]['url'])
        key = f"works/{user_id}/photo_{uuid.uuid4().hex}.jpg"
        cdn = upload_to_s3(s3, data, key, 'image/jpeg')
        work_id = save_work(user_id, title, 'photo', cdn, prompt)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'image'})}

    # ── ВИДЕО: submit → вернуть request_id, фронт сам опрашивает ─────
    if work_type == 'video':
        prompt = (body.get('prompt') or '').strip()
        title = (body.get('title') or prompt[:60] or 'Видео').strip()
        if not prompt:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'prompt обязателен'})}

        endpoint = 'fal-ai/minimax-video/text-to-video'
        request_id = fal_queue_submit_only(endpoint, {'prompt': prompt}, fal_key)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'IN_QUEUE', 'request_id': request_id, 'endpoint': endpoint, 'title': title})}

    # ── АНИМАЦИЯ: загрузить фото → submit → вернуть request_id ───────
    if work_type == 'animation':
        image_b64 = body.get('image_b64')
        title = (body.get('title') or 'Оживлённое фото').strip()
        if not image_b64:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'image_b64 обязателен'})}

        image_bytes = base64.b64decode(image_b64)
        image_url = fal_upload_image(image_bytes, fal_key)

        endpoint = 'fal-ai/stable-video'
        request_id = fal_queue_submit_only(endpoint, {
            'image_url': image_url,
            'motion_bucket_id': 127,
            'cond_aug': 0.02,
        }, fal_key)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'IN_QUEUE', 'request_id': request_id, 'endpoint': endpoint, 'title': title})}

    # ── ШАБЛОН ───────────────────────────────────────────────────────
    if work_type == 'template':
        description = (body.get('description') or '').strip()
        size_key = (body.get('size') or 'banner').strip()
        title = (body.get('title') or description[:60] or 'Шаблон').strip()
        if not description:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'description обязателен'})}

        image_size = TEMPLATE_SIZES.get(size_key, 'landscape_16_9')
        fal_prompt = (
            f"Professional banner design, {description}. "
            f"Clean modern layout, bold typography, high quality commercial design, "
            f"marketing material, professional graphic design, vibrant colors"
        )
        result = fal_post('https://fal.run/fal-ai/flux/schnell', {
            'prompt': fal_prompt, 'image_size': image_size, 'num_images': 1, 'enable_safety_checker': True,
        }, fal_key)
        data = download_url(result['images'][0]['url'])
        key = f"works/{user_id}/tmpl_{uuid.uuid4().hex}.jpg"
        cdn = upload_to_s3(s3, data, key, 'image/jpeg')
        work_id = save_work(user_id, title, 'template', cdn, description)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'image'})}

    # ── РЕКЛАМА ──────────────────────────────────────────────────────
    if work_type == 'ad':
        product = (body.get('product') or '').strip()
        slogan = (body.get('slogan') or '').strip()
        platform_key = (body.get('platform') or 'instagram').strip()
        title = (body.get('title') or f"Реклама: {product[:40]}").strip()
        if not product:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'product обязателен'})}

        image_size, platform_label = AD_PLATFORMS.get(platform_key, ('square_hd', 'Instagram'))
        slogan_part = f', with text caption exactly: "{slogan}" written in the same language as the slogan' if slogan else ', no text'
        fal_prompt = (
            f"Professional advertising visual for {product}{slogan_part}. "
            f"Commercial product photography, marketing campaign, "
            f"eye-catching advertisement, professional studio lighting, "
            f"high-end brand promotion, clean background, premium quality. "
            f"If text is present, render it exactly as given, preserving original language and characters."
        )
        result = fal_post('https://fal.run/fal-ai/flux/schnell', {
            'prompt': fal_prompt, 'image_size': image_size, 'num_images': 1, 'enable_safety_checker': True,
        }, fal_key)
        data = download_url(result['images'][0]['url'])
        key = f"works/{user_id}/ad_{uuid.uuid4().hex}.jpg"
        cdn = upload_to_s3(s3, data, key, 'image/jpeg')
        work_id = save_work(user_id, title, 'ad', cdn, product)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'image', 'platform': platform_label})}

    return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': f'Неизвестный тип: {work_type}'})}