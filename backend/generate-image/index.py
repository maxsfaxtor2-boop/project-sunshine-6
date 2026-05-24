"""Универсальная генерация контента: фото, видео, анимация, шаблон, реклама — через FAL.ai"""
import json
import os
import uuid
import base64
import urllib.request
import urllib.error
import time
import io
import psycopg2
import boto3
from PIL import Image, ImageDraw, ImageFont

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
    """Загружает картинку в наш S3 и возвращает публичный CDN URL — это надёжнее чем FAL storage"""
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    ext = 'png' if mime_type == 'image/png' else 'jpg'
    key = f"fal-uploads/{uuid.uuid4().hex}.{ext}"
    s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=mime_type)
    return f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"


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


def get_cyrillic_font(size: int) -> ImageFont.FreeTypeFont:
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
        '/usr/share/fonts/truetype/freefont/FreeSansBold.ttf',
        '/usr/share/fonts/truetype/ubuntu/Ubuntu-B.ttf',
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except Exception:
            continue
    # скачиваем шрифт с поддержкой кириллицы
    try:
        font_url = 'https://github.com/googlefonts/roboto/raw/main/src/hinted/Roboto-Bold.ttf'
        req = urllib.request.Request(font_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            font_data = r.read()
        return ImageFont.truetype(io.BytesIO(font_data), size)
    except Exception:
        return ImageFont.load_default()


def overlay_text_on_image(image_data: bytes, slogan: str) -> bytes:
    img = Image.open(io.BytesIO(image_data)).convert('RGBA')
    w, h = img.size

    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    bar_h = max(90, h // 5)
    draw.rectangle([(0, h - bar_h), (w, h)], fill=(0, 0, 0, 190))

    font_size = max(32, bar_h // 3)
    font = get_cyrillic_font(font_size)

    bbox = draw.textbbox((0, 0), slogan, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    max_text_w = w - 60
    if text_w > max_text_w:
        font_size = int(font_size * max_text_w / text_w)
        font = get_cyrillic_font(font_size)
        bbox = draw.textbbox((0, 0), slogan, font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]

    x = (w - text_w) // 2
    y = h - bar_h + (bar_h - text_h) // 2

    draw.text((x + 2, y + 2), slogan, font=font, fill=(0, 0, 0, 180))
    draw.text((x, y), slogan, font=font, fill=(255, 255, 255, 255))

    result = Image.alpha_composite(img, overlay).convert('RGB')
    buf = io.BytesIO()
    result.save(buf, format='JPEG', quality=92)
    return buf.getvalue()


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

        endpoint = 'fal-ai/kling-video/v1.6/standard/text-to-video'
        try:
            request_id = fal_queue_submit_only(endpoint, {
                'prompt': prompt,
                'duration': '5',
                'aspect_ratio': '16:9',
            }, fal_key)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='ignore') if hasattr(e, 'read') else str(e)
            print(f"[VIDEO ERROR] {e.code}: {err_body}")
            return {'statusCode': 502, 'headers': HEADERS, 'body': json.dumps({'error': f'FAL вернул ошибку {e.code}. Попробуй другой промпт.'})}
        except Exception as e:
            print(f"[VIDEO ERROR] {e}")
            return {'statusCode': 502, 'headers': HEADERS, 'body': json.dumps({'error': 'Не удалось отправить задачу в FAL'})}
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'status': 'IN_QUEUE', 'request_id': request_id, 'endpoint': endpoint, 'title': title})}

    # ── АНИМАЦИЯ: загрузить фото → submit → вернуть request_id ───────
    if work_type == 'animation':
        image_b64 = body.get('image_b64')
        title = (body.get('title') or 'Оживлённое фото').strip()
        if not image_b64:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'image_b64 обязателен'})}

        try:
            image_bytes = base64.b64decode(image_b64)
            image_url = fal_upload_image(image_bytes, fal_key)
        except Exception as e:
            print(f"[ANIM UPLOAD ERROR] {e}")
            return {'statusCode': 502, 'headers': HEADERS, 'body': json.dumps({'error': 'Не удалось загрузить фото'})}

        endpoint = 'fal-ai/kling-video/v1.6/standard/image-to-video'
        try:
            request_id = fal_queue_submit_only(endpoint, {
                'image_url': image_url,
                'prompt': 'natural motion, cinematic animation',
                'duration': '5',
                'aspect_ratio': '16:9',
            }, fal_key)
        except urllib.error.HTTPError as e:
            err_body = e.read().decode('utf-8', errors='ignore') if hasattr(e, 'read') else str(e)
            print(f"[ANIM ERROR] {e.code}: {err_body}")
            return {'statusCode': 502, 'headers': HEADERS, 'body': json.dumps({'error': f'FAL вернул ошибку {e.code}. Попробуй другое фото.'})}
        except Exception as e:
            print(f"[ANIM ERROR] {e}")
            return {'statusCode': 502, 'headers': HEADERS, 'body': json.dumps({'error': 'Не удалось отправить задачу в FAL'})}
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
        visual = (body.get('visual') or '').strip()
        slogan = (body.get('slogan') or '').strip()
        platform_key = (body.get('platform') or 'instagram').strip()
        title = (body.get('title') or f"Реклама: {product[:40]}").strip()
        if not product:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'product обязателен'})}

        image_size, platform_label = AD_PLATFORMS.get(platform_key, ('square_hd', 'Instagram'))
        visual_part = visual if visual else f"product shot of {product}"
        fal_prompt = (
            f"{visual_part}, advertising photo for {product}. "
            f"No text, no words, no letters. "
            f"Professional commercial photography, studio lighting, "
            f"high-end brand promotion, premium quality, sharp focus"
        )
        result = fal_post('https://fal.run/fal-ai/flux/schnell', {
            'prompt': fal_prompt, 'image_size': image_size, 'num_images': 1, 'enable_safety_checker': True,
        }, fal_key)
        data = download_url(result['images'][0]['url'])
        if slogan:
            data = overlay_text_on_image(data, slogan)
        key = f"works/{user_id}/ad_{uuid.uuid4().hex}.jpg"
        cdn = upload_to_s3(s3, data, key, 'image/jpeg')
        work_id = save_work(user_id, title, 'ad', cdn, product)
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id, 'url': cdn, 'title': title, 'media': 'image', 'platform': platform_label})}

    return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': f'Неизвестный тип: {work_type}'})}