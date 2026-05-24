"""Авторизация и сброс пароля MASYANYA AI"""
import json
import os
import hashlib
import secrets
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta

import psycopg2

HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

SCHEMA = 't_p32437567_project_sunshine_6'


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def send_reset_email(to_email: str, user_name: str, token: str):
    smtp_user = os.environ['SMTP_USER']
    smtp_password = os.environ['SMTP_PASSWORD']
    base_url = os.environ.get('APP_BASE_URL', '').rstrip('/')
    reset_link = f"{base_url}/reset-password?token={token}"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #0a0f1e; color: #fff; padding: 40px; border-radius: 8px;">
      <h2 style="color: #60a5fa; margin-bottom: 8px;">Сброс пароля</h2>
      <p style="color: #94a3b8;">Привет, {user_name}!</p>
      <p style="color: #94a3b8;">Мы получили запрос на сброс пароля для твоего аккаунта.</p>
      <a href="{reset_link}" style="display: inline-block; margin: 24px 0; padding: 14px 32px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">
        Сбросить пароль
      </a>
      <p style="color: #64748b; font-size: 13px;">Ссылка действительна 1 час. Если ты не запрашивал сброс — просто проигнорируй это письмо.</p>
    </div>
    """

    msg = MIMEText(html_body, 'html', 'utf-8')
    msg['Subject'] = 'Сброс пароля'
    msg['From'] = smtp_user
    msg['To'] = to_email

    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(smtp_user, smtp_password)
        server.sendmail(smtp_user, to_email, msg.as_string())


def handler(event: dict, context) -> dict:
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    action = (body.get('action') or 'login').strip()

    # ── ВХОД ─────────────────────────────────────────────────────────
    if action == 'login':
        email = (body.get('email') or '').strip().lower()
        password = (body.get('password') or '').strip()

        if not email or not password:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Введите email и пароль'})}

        password_hash = hashlib.sha256(password.encode()).hexdigest()
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name, email FROM %s.users WHERE email = '%s' AND password_hash = '%s'"
            % (SCHEMA, email.replace("'", "''"), password_hash)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if not user:
            return {'statusCode': 401, 'headers': HEADERS, 'body': json.dumps({'error': 'Неверный email или пароль'})}

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True, 'user': {'id': user[0], 'name': user[1], 'email': user[2]}})}

    # ── ЗАПРОС СБРОСА: отправить письмо ──────────────────────────────
    if action == 'reset_request':
        email = (body.get('email') or '').strip().lower()
        if not email:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Email обязателен'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT id, name FROM %s.users WHERE email = '%s'" % (SCHEMA, email.replace("'", "''"))
        )
        user = cur.fetchone()

        if not user:
            cur.close()
            conn.close()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True})}

        user_id, user_name = user[0], user[1]
        token = secrets.token_hex(32)
        expires_at = (datetime.utcnow() + timedelta(hours=1)).strftime('%Y-%m-%d %H:%M:%S')

        cur.execute(
            "INSERT INTO %s.password_reset_tokens (user_id, token, expires_at) VALUES (%s, '%s', '%s')"
            % (SCHEMA, user_id, token, expires_at)
        )
        conn.commit()
        cur.close()
        conn.close()

        send_reset_email(email, user_name, token)

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True})}

    # ── ПОДТВЕРЖДЕНИЕ: установить новый пароль ───────────────────────
    if action == 'reset_confirm':
        token = (body.get('token') or '').strip()
        new_password = (body.get('password') or '').strip()

        if not token or not new_password:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Токен и пароль обязательны'})}

        if len(new_password) < 6:
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Пароль должен быть не менее 6 символов'})}

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "SELECT user_id, expires_at, used FROM %s.password_reset_tokens WHERE token = '%s'"
            % (SCHEMA, token.replace("'", "''"))
        )
        row = cur.fetchone()

        if not row:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Ссылка недействительна'})}

        user_id, expires_at, used = row[0], row[1], row[2]

        if used:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Ссылка уже использована'})}

        if datetime.utcnow() > expires_at:
            cur.close()
            conn.close()
            return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Ссылка истекла. Запроси новую.'})}

        password_hash = hashlib.sha256(new_password.encode()).hexdigest()
        cur.execute(
            "UPDATE %s.users SET password_hash = '%s' WHERE id = %s" % (SCHEMA, password_hash, user_id)
        )
        cur.execute(
            "UPDATE %s.password_reset_tokens SET used = TRUE WHERE token = '%s'"
            % (SCHEMA, token.replace("'", "''"))
        )
        conn.commit()
        cur.close()
        conn.close()

        return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'success': True})}

    return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'Неизвестное действие'})}