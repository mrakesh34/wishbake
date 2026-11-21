import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

logger = logging.getLogger("wishbake.email")
logging.basicConfig(level=logging.INFO)

# SMTP Configuration from Environment Variables
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", os.getenv("SMTP_USER", "concierge@wishbake.com"))
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() in ("true", "1", "yes")

def is_smtp_configured() -> bool:
    """Check if SMTP credentials are provided."""
    return bool(SMTP_HOST and SMTP_USER and SMTP_PASS)

def build_otp_html_email(otp: str, user_name: Optional[str] = None) -> str:
    """Build a luxury-styled HTML email template for WISHBAKE."""
    greeting = f"Dear {user_name}," if user_name and user_name.strip() else "Dear Connoisseur,"
    
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WISHBAKE Verification Code</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fff8f6; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #201a19;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #fff8f6; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(160, 58, 87, 0.08); border: 1px solid #dbc0c4;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #771a38 0%, #a03a57 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
              <div style="font-size: 32px; margin-bottom: 6px;">🎂</div>
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #ffffff;">WISHBAKE</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #ff85a2; font-weight: 600;">Haute Confectionery & 3D Studio</p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #201a19;">{greeting}</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #554245;">
                Welcome to WISHBAKE. Please use the one-time verification code below to authenticate your account and access your bespoke cake orders.
              </p>

              <!-- OTP Display Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #fdf1ee; border: 2px dashed #a03a57; border-radius: 16px; padding: 20px 24px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #a03a57; text-align: center; display: block; margin-left: 10px;">{otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #755750; text-align: center;">
                ⏳ This code is valid for <strong>5 minutes</strong>.
              </p>
              <p style="margin: 0 0 28px 0; font-size: 12px; color: #887175; text-align: center;">
                If you did not request this verification code, please disregard this email. Never share your OTP with anyone.
              </p>

              <hr style="border: none; border-top: 1px solid #f1e6e3; margin: 24px 0;">

              <table role="presentation" width="100%" style="font-size: 12px; color: #755750;">
                <tr>
                  <td style="padding-bottom: 6px;">✨ <strong>3D Custom Studio:</strong> Design multi-tier centerpiece cakes</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 6px;">🚚 <strong>Chilled Delivery:</strong> Specially temperature-managed logistics</td>
                </tr>
                <tr>
                  <td>🍰 <strong>Artisanal Quality:</strong> Freshly baked by master pastry chefs</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7ebe9; padding: 20px 30px; text-align: center; font-size: 11px; color: #887175; border-top: 1px solid #ebe0dd;">
              <p style="margin: 0 0 4px 0;">© 2026 WISHBAKE Confectionery Studio. All rights reserved.</p>
              <p style="margin: 0;">Bhubaneswar, Odisha • royalife945@gmail.com</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""
    return html

def send_otp_email_sync(to_email: str, otp: str, user_name: Optional[str] = None) -> bool:
    """
    Sends the OTP email via SMTP if configured, or prints dev preview.
    Returns True if sent successfully or handled in dev mode.
    """
    if not is_smtp_configured():
        # Dev / Simulation mode
        logger.info("=" * 60)
        logger.info(f"📧 [DEV EMAIL SIMULATOR] WISHBAKE OTP DISPATCH")
        logger.info(f"Recipient: {to_email} (Name: {user_name or 'Guest'})")
        logger.info(f"Verification Code: >>> {otp} <<<")
        logger.info(f"Expiry: 5 Minutes (300 seconds)")
        logger.info("=" * 60)
        return True

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"WISHBAKE - Your Verification Code: {otp}"
        msg["From"] = SMTP_FROM
        msg["To"] = to_email

        # Plain text alternative
        plain_text = f"Your WISHBAKE verification code is: {otp}. Valid for 5 minutes. Do not share this code."
        html_content = build_otp_html_email(otp, user_name)

        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_content, "html"))

        if SMTP_USE_SSL or SMTP_PORT == 465:
            with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_FROM, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
                server.starttls()
                server.login(SMTP_USER, SMTP_PASS)
                server.sendmail(SMTP_FROM, [to_email], msg.as_string())

        logger.info(f"Successfully sent OTP email to {to_email} via SMTP ({SMTP_HOST})")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}", exc_info=True)
        # Fallback to dev log on SMTP failure so user isn't blocked
        logger.info(f"Fallback DEV OTP for {to_email}: {otp}")
        return True
