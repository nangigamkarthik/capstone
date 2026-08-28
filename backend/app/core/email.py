import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional
from loguru import logger
import asyncio

from app.core.config import settings

class EmailService:
    def __init__(self):
        self.smtp_host = getattr(settings, 'SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'SMTP_PORT', 587)
        self.smtp_user = getattr(settings, 'SMTP_USER', '')
        self.smtp_password = getattr(settings, 'SMTP_PASSWORD', '')
        self.from_email = getattr(settings, 'EMAILS_FROM_EMAIL', 'noreply@cogniclass.ai')

    def send_email_sync(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Synchronously send an email via SMTP."""
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email

            if text_content:
                msg.attach(MIMEText(text_content, 'plain'))
            msg.attach(MIMEText(html_content, 'html'))

            if not self.smtp_user or not self.smtp_password:
                logger.warning("SMTP credentials not configured. Logging email instead.")
                logger.info(f"[EMAIL MOCK] To: {to_email} | Subject: {subject}")
                return True

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, [to_email], msg.as_string())

            logger.info(f"Email successfully sent to {to_email}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    async def send_email_async(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """Asynchronously send an email without blocking the event loop."""
        return await asyncio.to_thread(
            self.send_email_sync, to_email, subject, html_content, text_content
        )

    def render_alert_template(
        self,
        recipient_name: str,
        alert_title: str,
        alert_message: str,
        severity: str,
        action_url: Optional[str] = None
    ) -> str:
        """Generate a styled HTML email template for classroom alerts."""
        color = "#ef4444" if severity == "CRITICAL" else "#f59e0b" if severity == "WARNING" else "#6366f1"

        return f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background-color: #1e293b; border-radius: 12px; padding: 30px; border: 1px solid #334155; }}
            .header {{ display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #334155; padding-bottom: 20px; }}
            .logo {{ font-size: 24px; font-weight: 800; color: #818cf8; text-decoration: none; }}
            .badge {{ background-color: {color}; color: #ffffff; padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; }}
            .content {{ padding: 20px 0; line-height: 1.6; }}
            .alert-box {{ background-color: rgba(99, 102, 241, 0.1); border-left: 4px solid {color}; padding: 16px; border-radius: 6px; margin: 20px 0; }}
            .button {{ display: inline-block; background: linear-gradient(135deg, #6366f1, #4f46e5); color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 15px; }}
            .footer {{ border-top: 1px solid #334155; padding-top: 20px; font-size: 12px; color: #94a3b8; text-align: center; }}
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <span class="logo">🧠 CogniClass AI</span>
              <span class="badge">{severity}</span>
            </div>
            <div class="content">
              <h2>Hello {recipient_name},</h2>
              <p>An automated classroom alert requires your attention:</p>
              <div class="alert-box">
                <h3 style="margin-top:0; color:#ffffff;">{alert_title}</h3>
                <p style="margin-bottom:0; color:#cbd5e1;">{alert_message}</p>
              </div>
              {f'<a href="{action_url}" class="button">View Classroom Twin</a>' if action_url else ''}
            </div>
            <div class="footer">
              <p>CogniClass Digital Twin Platform • Automated Notification Engine</p>
            </div>
          </div>
        </body>
        </html>
        """

email_service = EmailService()
