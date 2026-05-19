"""Регистрация нового пользователя MASYANYA AI"""
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
    name = (body.get('name') or '').strip()
    email = (body.get('email') or '').strip().lower()
    password = (body.get('password') or '').strip()

    if not name or not email or not password:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Заполните все поля'})}

    if len(password) < 6:
        return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'})}

    password_hash = hashlib.sha256(password.encode()).hexdigest()

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    cur.execute("SELECT id FROM t_p32437567_project_sunshine_6.users WHERE email = '%s'" % email.replace("'", "''"))
    if cur.fetchone():
        cur.close()
        conn.close()
        return {'statusCode': 409, 'headers': HEADERS, 'body': json.dumps({'error': 'Этот email уже зарегистрирован'})}

    cur.execute(
        "INSERT INTO t_p32437567_project_sunshine_6.users (name, email, password_hash) VALUES ('%s', '%s', '%s') RETURNING id" % (
            name.replace("'", "''"), email.replace("'", "''"), password_hash
        )
    )
    user_id = cur.fetchone()[0]
    conn.commit()
    cur.close()
    conn.close()

    return {
        'statusCode': 200,
        'headers': HEADERS,
        'body': json.dumps({'success': True, 'userId': user_id, 'message': 'Регистрация успешна!'})
    }