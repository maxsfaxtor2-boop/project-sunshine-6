"""Получение и сохранение работ пользователя MASYANYA AI"""
import json
import os

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    import psycopg2

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        user_id = (event.get('queryStringParameters') or {}).get('user_id')
        if not user_id:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'user_id required'})}

        cur.execute(
            "SELECT id, title, type, url, prompt, created_at FROM t_p32437567_project_sunshine_6.works WHERE user_id = %s ORDER BY created_at DESC LIMIT 50" % int(user_id)
        )
        rows = cur.fetchall()
        cur.close()
        conn.close()

        works = [
            {'id': r[0], 'title': r[1], 'type': r[2], 'url': r[3], 'prompt': r[4], 'created_at': str(r[5])}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'works': works})}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        user_id = body.get('user_id')
        title = (body.get('title') or 'Без названия').strip()
        work_type = (body.get('type') or 'photo').strip()
        url = (body.get('url') or '').strip()
        prompt = (body.get('prompt') or '').strip()

        if not user_id or not url:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'user_id и url обязательны'})}

        cur.execute(
            "INSERT INTO t_p32437567_project_sunshine_6.works (user_id, title, type, url, prompt) VALUES (%s, '%s', '%s', '%s', '%s') RETURNING id" % (
                int(user_id),
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

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'id': work_id})}

    return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'Method not allowed'})}
