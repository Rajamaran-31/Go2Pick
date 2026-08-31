import sys
import os

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath('backend'))

from app.services.email_service import send_signup_otp

print("Testing SMTP email delivery to rajamaran32@gmail.com...")
success = send_signup_otp("rajamaran32@gmail.com", "Rajamaran", "123456")
if success:
    print("SUCCESS: OTP Email delivered successfully via Gmail SMTP!")
else:
    print("FAILED: SMTP email delivery failed.")
