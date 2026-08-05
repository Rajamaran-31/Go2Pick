import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.config import get_settings


def _send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send an email via SMTP. Returns True on success, False on failure."""
    settings = get_settings()

    if not settings.SMTP_HOST or not settings.SMTP_USERNAME:
        try:
            print(f"[EMAIL - NOT CONFIGURED] To: {to_email} | Subject: {subject}")
        except UnicodeEncodeError:
            safe_subj = subject.encode("ascii", errors="replace").decode("ascii")
            print(f"[EMAIL - NOT CONFIGURED] To: {to_email} | Subject: {safe_subj}")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.SMTP_SENDER or settings.SMTP_USERNAME
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], to_email, msg.as_string())

        try:
            print(f"[EMAIL SENT] To: {to_email} | Subject: {subject}")
        except UnicodeEncodeError:
            safe_subj = subject.encode("ascii", errors="replace").decode("ascii")
            print(f"[EMAIL SENT] To: {to_email} | Subject: {safe_subj}")
        return True
    except Exception as e:
        try:
            print(f"[EMAIL ERROR] {e}")
        except UnicodeEncodeError:
            safe_err = str(e).encode("ascii", errors="replace").decode("ascii")
            print(f"[EMAIL ERROR] {safe_err}")
        return False


def send_signup_otp(email: str, fullName: str, otp: str) -> bool:
    subject = "Verify Your Go2Pick Account"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">Welcome to Go2Pick! 🎉</h2>
      <p>Hi <strong>{fullName}</strong>,</p>
      <p>Use the OTP below to verify your email address:</p>
      <div style="background:#f0f0ff;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
        <h1 style="letter-spacing:8px;color:#6366f1;font-size:40px;margin:0;">{otp}</h1>
      </div>
      <p>This OTP expires in <strong>10 minutes</strong>.</p>
      <p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
    </div>
    """
    return _send_email(email, subject, html)


def send_forgot_password_otp(email: str, otp: str) -> bool:
    subject = "Go2Pick - Password Reset OTP"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#6366f1;">Password Reset</h2>
      <p>You requested a password reset. Use the OTP below:</p>
      <div style="background:#f0f0ff;border-radius:8px;padding:20px;text-align:center;margin:20px 0;">
        <h1 style="letter-spacing:8px;color:#6366f1;font-size:40px;margin:0;">{otp}</h1>
      </div>
      <p>This OTP expires in <strong>10 minutes</strong>.</p>
      <p style="color:#888;font-size:12px;">If you did not request this, please ignore this email.</p>
    </div>
    """
    return _send_email(email, subject, html)


def send_shop_approved_email(email: str, shopName: str) -> bool:
    subject = "Your Shop Has Been Approved - Go2Pick"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#22c55e;">Congratulations! Your Shop is Approved 🎉</h2>
      <p>Your shop <strong>{shopName}</strong> has been approved on Go2Pick!</p>
      <p>Log in to your account and click <strong>"Get the Shopkeeper Dashboard"</strong> in your notifications to activate your shopkeeper dashboard and start selling.</p>
      <p style="color:#888;font-size:12px;">Go2Pick Team</p>
    </div>
    """
    return _send_email(email, subject, html)


def send_shop_rejected_email(email: str, shopName: str, reason: str) -> bool:
    subject = "Go2Pick - Shop Application Update"
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
      <h2 style="color:#ef4444;">Shop Application Update</h2>
      <p>We regret to inform you that your shop application for <strong>{shopName}</strong> has been rejected.</p>
      <p><strong>Reason:</strong> {reason}</p>
      <p>You may submit a new application after addressing the issue.</p>
      <p style="color:#888;font-size:12px;">Go2Pick Team</p>
    </div>
    """
    return _send_email(email, subject, html)
