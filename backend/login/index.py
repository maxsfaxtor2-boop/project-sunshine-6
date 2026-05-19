"""Авторизация пользователя MASYANYA AI"""
import json
import os
import hashlib

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    import psycopg2

    body = json.loads(event.get('body') or '{}')
    email = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not email or not password:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Введите email и пароль'})}

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute(
        "SELECT id, name, email FROM t_p32437567_project_sunshine_6.users WHERE email = '%s' AND password_hash = '%s'"
        % (email.replace("'", "''"), password_hash)
    )
    user = cur.fetchone()
    cur.close()
    conn.close()

    if not user:
        return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'success': True, 'user': {'id': user[0], 'name': user[1], 'email': user[2]}})
    }
