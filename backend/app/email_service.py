import smtplib
import random
import string
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import Celery
from .celery_app import celery_app
from .config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
import redis
from datetime import datetime, timedelta

# Redis client for OTP storage
redis_client = redis.Redis(host='localhost', port=6379, db=0)

def generate_otp(length: int = 6) -> str:
    """Generate a random OTP of specified length"""
    return ''.join(random.choices(string.digits, k=length))

def store_otp(email: str, otp: str, expiry_minutes: int = 10):
    """Store OTP in Redis with expiry"""
    redis_client.setex(f"otp:{email}", timedelta(minutes=expiry_minutes), otp)

def verify_otp(email: str, provided_otp: str) -> bool:
    """Verify OTP from Redis"""
    stored_otp = redis_client.get(f"otp:{email}")
    if stored_otp is None:
        return False
    
    if stored_otp.decode() == provided_otp:
        # Delete OTP after successful verification
        redis_client.delete(f"otp:{email}")
        return True
    return False

@celery_app.task(name="send_email_task")
def send_email_task(to_email: str, subject: str, body: str):
    """Celery task to send email asynchronously"""
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USER
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Add body to email
        msg.attach(MIMEText(body, 'plain'))
        
        # Create SMTP session
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()  # Enable security
            server.login(SMTP_USER, SMTP_PASSWORD)
            text = msg.as_string()
            server.sendmail(SMTP_USER, to_email, text)
        
        return {"status": "success", "message": f"Email sent to {to_email}"}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

@celery_app.task(name="send_otp_task")
def send_otp_task(email: str):
    """Celery task to generate and send OTP"""
    try:
        # Generate OTP
        otp = generate_otp()
        
        # Store OTP in Redis
        store_otp(email, otp)
        
        # Prepare email content
        subject = "Your OTP Code - Nyord Bank"
        body = f"""
Dear User,

Your One-Time Password (OTP) for email verification is: {otp}

This OTP is valid for 10 minutes only. Please do not share this code with anyone.

If you did not request this OTP, please ignore this email.

Best regards,
Nyord Bank Team
        """
        
        # Send email using the email task
        result = send_email_task.apply_async(args=[email, subject, body])
        
        return {"status": "success", "message": "OTP sent successfully", "task_id": result.id}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}

@celery_app.task(name="send_welcome_email_task")
def send_welcome_email_task(email: str, username: str):
    """Celery task to send welcome email after successful registration"""
    try:
        subject = "Welcome to Nyord Bank!"
        body = f"""
Dear {username},

Welcome to Nyord Bank! Your email has been successfully verified and your account is now active.

You can now enjoy all our banking services:
- Account Management
- Transfers & Payments
- Loan Applications
- Fixed Deposits
- Card Services

Thank you for choosing Nyord Bank.

Best regards,
Nyord Bank Team
        """
        
        result = send_email_task.apply_async(args=[email, subject, body])
        return {"status": "success", "message": "Welcome email sent", "task_id": result.id}
    
    except Exception as e:
        return {"status": "error", "message": str(e)}