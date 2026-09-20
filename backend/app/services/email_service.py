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


def send_admin_invite_email(email: str, role: str, inviter_name: str = "Go2Pick Super Admin") -> bool:
    subject = f"Invitation: Join Go2Pick Administration as {role}"
    html = f"""
    <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background-color:#f8fafc;border-radius:12px;border:1px solid #e2e8f0;">
      <div style="text-align:center;margin-bottom:24px;">
        <h1 style="color:#ff6600;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">Go2Pick</h1>
        <p style="color:#64748b;margin:4px 0 0 0;font-size:14px;">Local Commerce & Counter Pickup Platform</p>
      </div>
      
      <div style="background-color:#ffffff;padding:32px;border-radius:10px;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
        <h2 style="color:#0f172a;margin-top:0;font-size:20px;font-weight:700;">You've Been Invited to Join Go2Pick</h2>
        <p style="color:#334155;font-size:15px;line-height:1.6;">Hello,</p>
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          You have been officially invited by <strong>{inviter_name}</strong> to join the administrative team of <strong>Go2Pick</strong> with the following assigned role:
        </p>
        
        <div style="background-color:#fff7ed;border-left:4px solid #ff6600;padding:16px 20px;margin:24px 0;border-radius:0 8px 8px 0;">
          <span style="font-size:13px;text-transform:uppercase;color:#ea580c;font-weight:700;letter-spacing:1px;display:block;margin-bottom:4px;">Assigned Role</span>
          <span style="font-size:20px;font-weight:700;color:#0f172a;">{role}</span>
        </div>
        
        <p style="color:#334155;font-size:15px;line-height:1.6;">
          As an administrator, you have access to manage platform settings, oversee local shops, handle support tickets, and view operational analytics.
        </p>
        
        <div style="text-align:center;margin:32px 0;">
          <a href="https://go2-pick.vercel.app/admin/settings" style="background-color:#ff6600;color:#ffffff;padding:14px 32px;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px;display:inline-block;box-shadow:0 4px 12px rgba(255,102,0,0.25);">
            Open Admin Dashboard
          </a>
        </div>
        
        <p style="color:#64748b;font-size:13px;line-height:1.6;margin-top:24px;border-top:1px solid #e2e8f0;padding-top:16px;">
          Log in or register with your email <strong>{email}</strong> at <a href="https://go2-pick.vercel.app" style="color:#ff6600;text-decoration:none;font-weight:600;">go2-pick.vercel.app</a> to access your administrative workspace.
        </p>
      </div>
      
      <div style="text-align:center;margin-top:24px;">
        <p style="color:#94a3b8;font-size:12px;margin:0;">&copy; 2026 Go2Pick. All rights reserved.</p>
      </div>
    </div>
    """
    return _send_email(email, subject, html)

