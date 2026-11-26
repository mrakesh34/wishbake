import html
import logging
import os
from email.utils import parseaddr
from typing import Optional

import httpx

logger = logging.getLogger("wishbake.email")
logging.basicConfig(level=logging.INFO)

BREVO_TRANSACTIONAL_URL = os.getenv("BREVO_API_URL", "https://api.brevo.com/v3/smtp/email").strip()


class EmailDeliveryError(Exception):
    """Raised when transactional email dispatch fails or is unconfigured."""


def _parse_sender(raw_value: str, default_name: str = "WISHBAKE") -> tuple[str, str]:
    name, addr = parseaddr((raw_value or "").strip())
    return (name.strip() or default_name, addr.strip())


def get_brevo_config() -> dict:
    """Resolve Brevo HTTPS API settings dynamically from environment variables."""
    api_key = os.getenv("BREVO_API_KEY", "").strip()
    raw_sender = (
        os.getenv("BREVO_SENDER_EMAIL", "").strip()
        or os.getenv("SMTP_FROM", "").strip()
    )
    sender_name_override = os.getenv("BREVO_SENDER_NAME", "").strip()
    parsed_name, sender_email = _parse_sender(raw_sender, default_name="WISHBAKE")
    sender_name = sender_name_override or parsed_name or "WISHBAKE"

    raw_reply_to = os.getenv("BREVO_REPLY_TO", "").strip()
    reply_name, reply_email = _parse_sender(raw_reply_to, default_name=sender_name)
    if not reply_email:
        reply_email = sender_email
        reply_name = sender_name

    return {
        "api_key": api_key,
        "sender_email": sender_email,
        "sender_name": sender_name,
        "reply_to_email": reply_email,
        "reply_to_name": reply_name,
        "api_url": os.getenv("BREVO_API_URL", BREVO_TRANSACTIONAL_URL).strip() or BREVO_TRANSACTIONAL_URL,
    }


def is_brevo_configured() -> bool:
    """Return True when Brevo HTTPS API credentials and sender email are present."""
    cfg = get_brevo_config()
    return bool(cfg["api_key"] and cfg["sender_email"] and "@" in cfg["sender_email"])


def build_otp_html_email(
    otp: str,
    user_name: Optional[str] = None,
    expiry_minutes: int = 10,
    support_email: Optional[str] = None,
) -> str:
    """Build an escaped luxury-styled HTML verification email for WISHBAKE."""
    clean_name = (user_name or "").strip()
    greeting = f"Dear {html.escape(clean_name)}," if clean_name else "Dear Connoisseur,"
    safe_otp = html.escape(otp)
    footer_contact = f" • {html.escape(support_email)}" if support_email else ""

    return f"""<!DOCTYPE html>
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
        <table role="presentation" width="100%" style="max-width: 540px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(160, 58, 87, 0.08); border: 1px solid #dbc0c4;">
          <tr>
            <td style="background: linear-gradient(135deg, #771a38 0%, #a03a57 100%); padding: 36px 30px; text-align: center; color: #ffffff;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 26px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #ffffff;">WISHBAKE</h1>
              <p style="margin: 6px 0 0 0; font-size: 11px; letter-spacing: 1.5px; text-transform: uppercase; color: #ff85a2; font-weight: 600;">Bakery &amp; 3D Cake Studio</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #201a19;">{greeting}</p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #554245;">
                Welcome to WISHBAKE. Enter the 6-digit verification code below to verify your email address and complete your account sign-up.
              </p>

              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #fdf1ee; border: 2px dashed #a03a57; border-radius: 16px; padding: 20px 24px; display: inline-block;">
                      <span style="font-family: 'Courier New', Courier, monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #a03a57; text-align: center; display: block; margin-left: 10px;">{safe_otp}</span>
                    </div>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 8px 0; font-size: 13px; color: #755750; text-align: center;">
                This code expires in <strong>{expiry_minutes} minutes</strong>.
              </p>
              <p style="margin: 0 0 28px 0; font-size: 12px; color: #887175; text-align: center;">
                If you did not request this verification code, please disregard this email. Never share your code with anyone.
              </p>

              <hr style="border: none; border-top: 1px solid #f1e6e3; margin: 24px 0;">

              <table role="presentation" width="100%" style="font-size: 12px; color: #755750;">
                <tr>
                  <td style="padding-bottom: 6px;"><strong>3D Cake Studio:</strong> Design multi-tier celebration cakes</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 6px;"><strong>Chilled Delivery:</strong> Hand-delivered across Bhubaneswar</td>
                </tr>
                <tr>
                  <td><strong>Artisanal Quality:</strong> Freshly baked to order</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f7ebe9; padding: 20px 30px; text-align: center; font-size: 11px; color: #887175; border-top: 1px solid #ebe0dd;">
              <p style="margin: 0 0 4px 0;">&copy; 2026 WISHBAKE Confectionery Studio. All rights reserved.</p>
              <p style="margin: 0;">Bhubaneswar, Odisha{footer_contact}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_otp_email(
    to_email: str,
    otp: str,
    user_name: Optional[str] = None,
    expiry_minutes: int = 10,
) -> str:
    """
    Dispatch a 6-digit sign-up OTP email over HTTPS via Brevo API v3 (port 443),
    avoiding outbound SMTP ports blocked on Render Free tier.
    """
    cfg = get_brevo_config()

    if not is_brevo_configured():
        raise EmailDeliveryError("Email verification service is not configured on the server.")

    clean_name = (user_name or "").strip() or to_email.split("@")[0]
    support_email = cfg["reply_to_email"] or cfg["sender_email"]
    plain_text = (
        f"Your WISHBAKE sign-up verification code is: {otp}\n\n"
        f"This code expires in {expiry_minutes} minutes. "
        "If you did not try to create a WISHBAKE account, you can safely ignore this email."
    )
    html_content = build_otp_html_email(
        otp=otp,
        user_name=user_name,
        expiry_minutes=expiry_minutes,
        support_email=support_email,
    )

    payload = {
        "sender": {
            "name": cfg["sender_name"],
            "email": cfg["sender_email"],
        },
        "to": [
            {
                "email": to_email,
                "name": clean_name,
            }
        ],
        "replyTo": {
            "email": cfg["reply_to_email"],
            "name": cfg["reply_to_name"],
        },
        "subject": "Your WISHBAKE Sign-Up Verification Code",
        "htmlContent": html_content,
        "textContent": plain_text,
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": cfg["api_key"],
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(cfg["api_url"], json=payload, headers=headers)
    except httpx.HTTPError as exc:
        logger.error("Brevo HTTPS request failed for %s: %s", to_email, exc.__class__.__name__)
        raise EmailDeliveryError("Could not reach the email delivery service. Please try again shortly.") from exc

    if 200 <= response.status_code < 300:
        logger.info("OTP verification email accepted by Brevo HTTPS API for %s (status=%d)", to_email, response.status_code)
        return "brevo"

    # Log response status and safe snippet without exposing API key or OTP.
    body_preview = (response.text or "")[:300]
    logger.error("Brevo HTTPS API rejected email for %s (status=%d): %s", to_email, response.status_code, body_preview)
    raise EmailDeliveryError("We could not send your verification email right now. Please try again shortly.")
