"""Email service for sending verification and password reset emails."""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta, UTC
from typing import Optional
from jose import jwt
import logging

from ..config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)


def create_email_token(email: str, token_type: str = "verification") -> str:
    """Create a JWT token for email verification or password reset."""
    if token_type == "verification":
        expire_hours = settings.email_verification_expire_hours
    else:
        expire_hours = settings.password_reset_expire_hours
    
    expire = datetime.now(UTC) + timedelta(hours=expire_hours)
    to_encode = {
        "sub": email,
        "type": token_type,
        "exp": expire
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)


def verify_email_token(token: str, expected_type: str = "verification") -> Optional[str]:
    """Verify email token and return email if valid."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        email = payload.get("sub")
        token_type = payload.get("type")
        
        if token_type != expected_type:
            return None
        
        return email
    except Exception:
        return None


def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP.
    
    Returns True if email was sent successfully, False otherwise.
    """
    if not settings.smtp_user or not settings.smtp_password:
        logger.warning("SMTP not configured. Email not sent.")
        return False
    
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
        msg["To"] = to_email
        
        # Attach text and HTML parts
        if text_content:
            msg.attach(MIMEText(text_content, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        
        # Connect and send
        with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
            if settings.smtp_use_tls:
                server.starttls()
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_from_email, to_email, msg.as_string())
        
        logger.info(f"Email sent to {to_email}")
        return True
    
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False


def send_verification_email(email: str, username: str) -> bool:
    """Send email verification link to user."""
    token = create_email_token(email, "verification")
    verification_link = f"{settings.frontend_url}/verify-email?token={token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                       color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #667eea; color: white; 
                       padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                       margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎓 IELTS JANA</h1>
            </div>
            <div class="content">
                <h2>Привет, {username}! 👋</h2>
                <p>Спасибо за регистрацию в IELTS JANA - твоей персональной платформе для подготовки к IELTS!</p>
                <p>Пожалуйста, подтверди свой email адрес, нажав на кнопку ниже:</p>
                <center>
                    <a href="{verification_link}" class="button">Подтвердить Email ✅</a>
                </center>
                <p><small>Если кнопка не работает, скопируй эту ссылку в браузер:<br>
                {verification_link}</small></p>
                <p>Ссылка действительна {settings.email_verification_expire_hours} часов.</p>
            </div>
            <div class="footer">
                <p>© 2024 IELTS JANA. Все права защищены.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Привет, {username}!
    
    Спасибо за регистрацию в IELTS JANA!
    
    Подтверди свой email, перейдя по ссылке:
    {verification_link}
    
    Ссылка действительна {settings.email_verification_expire_hours} часов.
    
    С уважением,
    Команда IELTS JANA
    """
    
    return send_email(email, "Подтверди свой email - IELTS JANA", html_content, text_content)


def send_password_reset_email(email: str, username: str) -> bool:
    """Send password reset link to user."""
    token = create_email_token(email, "password_reset")
    reset_link = f"{settings.frontend_url}/reset-password?token={token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); 
                       color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #f5576c; color: white; 
                       padding: 15px 30px; text-decoration: none; border-radius: 5px; 
                       margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
            .warning {{ background: #fff3cd; border: 1px solid #ffc107; padding: 10px; 
                        border-radius: 5px; margin: 15px 0; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Сброс пароля</h1>
            </div>
            <div class="content">
                <h2>Привет, {username}!</h2>
                <p>Мы получили запрос на сброс пароля для твоего аккаунта.</p>
                <center>
                    <a href="{reset_link}" class="button">Сбросить пароль 🔑</a>
                </center>
                <div class="warning">
                    ⚠️ <strong>Важно:</strong> Если ты не запрашивал сброс пароля, 
                    просто проигнорируй это письмо. Твой пароль останется прежним.
                </div>
                <p><small>Ссылка действительна {settings.password_reset_expire_hours} час.</small></p>
            </div>
            <div class="footer">
                <p>© 2024 IELTS JANA. Все права защищены.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Привет, {username}!
    
    Мы получили запрос на сброс пароля для твоего аккаунта.
    
    Перейди по ссылке для сброса пароля:
    {reset_link}
    
    Если ты не запрашивал сброс пароля, проигнорируй это письмо.
    
    Ссылка действительна {settings.password_reset_expire_hours} час.
    
    С уважением,
    Команда IELTS JANA
    """
    
    return send_email(email, "Сброс пароля - IELTS JANA", html_content, text_content)
