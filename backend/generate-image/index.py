"""Универсальная генерация контента: фото, видео, анимация, шаблон, реклама — через FAL.ai"""
import json
import os
import uuid
import base64
import urllib.request
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
    'story': 'portrait_16_9',
    'vk': 'landscape_4_3',
}

AD_PLATFORMS = {
    'vk': ('square_hd', 'ВКонтакте'),
    'instagram': ('square_hd', 'Instagram'),
    'facebook': ('landscape_16_9', 'Facebook'),
    'stories': ('portrait_16_9', 'Сторис'),
    'yandex': ('landscape_4_3', 'Яндекс'),
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

    if not user_id:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'user_id обязателен'})}

    fal_key = os.environ['FAL_API_KEY']
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

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

    # ── ВИДЕО ─────────────────────────────────────────────────────────
    if work_type == 'video':
        prompt = (body.get('prompt') or '').strip()
        title = (body.get('title') or prompt[:60] or 'Видео').strip()
        if not prompt:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'prompt обязателен'})}

        result = fal_post('https://fal.run/fal-ai/minimax-video', {
            'prompt': prompt,
            'duration': 6,
        }, fal_key, timeout=180)
        vid_url = (result.get('video') or {}).get('url') or result.get('video_url', '')
        data = download_url(vid_url)
        key = f"works/{user_id}/video_{uuid.uuid4().hex}.mp4"
        cdn = upload_to_s3(s3, data, key, 'video/mp4')
        work_id = save_work(user_id, title, 'video', cdn, prompt)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'video'})}

    # ── АНИМАЦИЯ / ОЖИВЛЕНИЕ ФОТО ────────────────────────────────────
    if work_type == 'animation':
        image_b64 = body.get('image_b64')
        title = (body.get('title') or 'Оживлённое фото').strip()
        if not image_b64:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'image_b64 обязателен'})}

        image_bytes = base64.b64decode(image_b64)
        upload_req = urllib.request.Request(
            'https://fal.run/files/upload',
            data=image_bytes,
            headers={'Authorization': f'Key {fal_key}', 'Content-Type': 'image/jpeg'},
            method='POST',
        )
        with urllib.request.urlopen(upload_req, timeout=60) as r:
            upload_result = json.loads(r.read().decode('utf-8'))
        image_url = upload_result.get('url') or upload_result.get('image_url')

        result = fal_post('https://fal.run/fal-ai/stable-video', {
            'image_url': image_url,
            'motion_bucket_id': 127,
            'cond_aug': 0.02,
        }, fal_key, timeout=180)
        vid_url = (result.get('video') or {}).get('url') or result.get('video_url', '')
        data = download_url(vid_url)
        key = f"works/{user_id}/anim_{uuid.uuid4().hex}.mp4"
        cdn = upload_to_s3(s3, data, key, 'video/mp4')
        work_id = save_work(user_id, title, 'animation', cdn, 'Оживление фото')
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'video'})}

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
        slogan_part = f', slogan: "{slogan}"' if slogan else ''
        fal_prompt = (
            f"Professional advertising photo for {product}{slogan_part}. "
            f"Commercial product photography, marketing campaign, "
            f"eye-catching advertisement, professional studio lighting, "
            f"high-end brand promotion, clean background, premium quality"
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
