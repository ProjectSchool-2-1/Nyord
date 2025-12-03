import aiosmtplib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import os
import random
import string
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from jinja2 import Template
import dns.resolver
import re
from email_validator import validate_email, EmailNotValidError
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_name = os.getenv("FROM_NAME", "Nyord Banking")
        self.from_email = os.getenv("FROM_EMAIL", self.smtp_user)
        
        # OTP storage (in production, use Redis or database)
        self.otp_storage: Dict[str, Dict] = {}
        
    def generate_otp(self, length: int = 6) -> str:
        """Generate a random OTP"""
        return ''.join(random.choices(string.digits, k=length))
    
    def validate_email_format(self, email: str) -> bool:
        """Validate email format"""
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    def check_dns_mx_record(self, email: str) -> bool:
        """Check if domain has valid MX record for non-Gmail emails"""
        try:
            domain = email.split('@')[1]
            
            # Skip MX check for common providers
            common_providers = [
                'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 
                'live.com', 'msn.com', 'icloud.com', 'me.com', 'mac.com'
            ]
            
            if domain.lower() in common_providers:
                return True
                
            # Check MX record for other domains
            mx_records = dns.resolver.resolve(domain, 'MX')
            return len(mx_records) > 0
            
        except Exception as e:
            logger.warning(f"DNS MX check failed for {email}: {e}")
            return False
    
    def store_otp(self, email: str, otp: str, purpose: str = "email_verification") -> bool:
        """Store OTP with expiration"""
        try:
            expiry_time = datetime.utcnow() + timedelta(minutes=10)  # 10 minutes expiry
            
            self.otp_storage[email] = {
                'otp': otp,
                'purpose': purpose,
                'expiry': expiry_time,
                'attempts': 0
            }
            return True
        except Exception as e:
            logger.error(f"Failed to store OTP for {email}: {e}")
            return False
    
    def verify_otp(self, email: str, otp: str, purpose: str = "email_verification") -> bool:
        """Verify OTP"""
        try:
            if email not in self.otp_storage:
                return False
                
            stored_data = self.otp_storage[email]
            
            # Check if OTP expired
            if datetime.utcnow() > stored_data['expiry']:
                del self.otp_storage[email]
                return False
            
            # Check attempts (max 3 attempts)
            if stored_data['attempts'] >= 3:
                del self.otp_storage[email]
                return False
            
            # Check OTP and purpose
            if stored_data['otp'] == otp and stored_data['purpose'] == purpose:
                del self.otp_storage[email]  # Remove after successful verification
                return True
            else:
                # Increment attempts on failure
                stored_data['attempts'] += 1
                return False
                
        except Exception as e:
            logger.error(f"Failed to verify OTP for {email}: {e}")
            return False
    
    async def send_email_async(self, to_email: str, subject: str, html_body: str, text_body: str = None) -> bool:
        """Send email asynchronously"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Send email
            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                start_tls=True,
                username=self.smtp_user,
                password=self.smtp_password,
            )
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def send_email_sync(self, to_email: str, subject: str, html_body: str, text_body: str = None) -> bool:
        """Send email synchronously"""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            
            # Add text and HTML parts
            if text_body:
                text_part = MIMEText(text_body, "plain")
                message.attach(text_part)
            
            html_part = MIMEText(html_body, "html")
            message.attach(html_part)
            
            # Send email using SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.send_message(message)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False
    
    def get_otp_email_template(self, user_name: str, otp: str, purpose: str = "account verification") -> str:
        """Generate OTP email HTML template"""
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OTP Verification - Nyord Banking</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
                .content { padding: 30px; }
                .otp-box { background: #f8f9fa; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #667eea; margin: 10px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; }
                .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏦 Nyord Banking</h1>
                    <p>Secure Banking for Everyone</p>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }}!</h2>
                    <p>Thank you for choosing Nyord Banking. To complete your {{ purpose }}, please use the following One-Time Password (OTP):</p>
                    
                    <div class="otp-box">
                        <p style="margin: 0; font-size: 14px; color: #666;">Your OTP Code</p>
                        <div class="otp-code">{{ otp }}</div>
                        <p style="margin: 0; font-size: 12px; color: #888;">Valid for 10 minutes</p>
                    </div>
                    
                    <div class="warning">
                        <strong>🔒 Security Notice:</strong>
                        <ul style="margin: 10px 0; padding-left: 20px;">
                            <li>Never share your OTP with anyone</li>
                            <li>Nyord Banking will never ask for your OTP over phone or email</li>
                            <li>This OTP will expire in 10 minutes</li>
                            <li>If you didn't request this, please contact our support team immediately</li>
                        </ul>
                    </div>
                    
                    <p>If you have any questions, feel free to contact our customer support.</p>
                    <p>Best regards,<br><strong>Nyord Banking Team</strong></p>
                </div>
                <div class="footer">
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        This is an automated email. Please do not reply to this email.<br>
                        © {{ current_year }} Nyord Banking. All rights reserved.
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(
            user_name=user_name,
            otp=otp,
            purpose=purpose,
            current_year=datetime.now().year
        )
    
    def get_approval_email_template(self, user_name: str, status: str, services: List[str] = None) -> str:
        """Generate account approval email HTML template"""
        if services is None:
            services = []
            
        template_str = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Account Status Update - Nyord Banking</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
                .header { background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 30px; text-align: center; }
                .header.rejected { background: linear-gradient(135deg, #dc3545 0%, #fd7e14 100%); }
                .content { padding: 30px; }
                .status-box { border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
                .approved { background: #d4edda; border: 2px solid #28a745; color: #155724; }
                .rejected { background: #f8d7da; border: 2px solid #dc3545; color: #721c24; }
                .services-list { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
                .service-item { display: flex; align-items: center; margin: 10px 0; }
                .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #dee2e6; }
                .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header {% if status == 'rejected' %}rejected{% endif %}">
                    <h1>🏦 Nyord Banking</h1>
                    <p>Account Status Update</p>
                </div>
                <div class="content">
                    <h2>Hello {{ user_name }}!</h2>
                    
                    {% if status == 'approved' %}
                    <div class="status-box approved">
                        <h3>🎉 Congratulations! Your account has been approved!</h3>
                        <p>Welcome to the Nyord Banking family. Your account is now active and ready to use.</p>
                    </div>
                    
                    <p>You now have access to our full range of banking services:</p>
                    
                    <div class="services-list">
                        <h4>🌟 Available Services:</h4>
                        <div class="service-item">✅ <strong>Online Banking</strong> - Manage your accounts 24/7</div>
                        <div class="service-item">✅ <strong>Money Transfers</strong> - Send money instantly</div>
                        <div class="service-item">✅ <strong>QR Payments</strong> - Quick and secure payments</div>
                        {% for service in services %}
                        <div class="service-item">✅ <strong>{{ service }}</strong> - Available for use</div>
                        {% endfor %}
                        <div class="service-item">✅ <strong>Fixed Deposits</strong> - Grow your savings</div>
                        <div class="service-item">✅ <strong>Loans</strong> - Apply for personal loans</div>
                        <div class="service-item">✅ <strong>Debit Cards</strong> - Apply for cards</div>
                        <div class="service-item">✅ <strong>24/7 Customer Support</strong> - We're here to help</div>
                    </div>
                    
                    <p>
                        <a href="http://localhost:3000/signin" class="button">Login to Your Account</a>
                    </p>
                    
                    {% else %}
                    <div class="status-box rejected">
                        <h3>❌ Account Application Update</h3>
                        <p>We regret to inform you that your account application requires additional review.</p>
                    </div>
                    
                    <p>Please contact our customer service team for more information about the next steps.</p>
                    {% endif %}
                    
                    <p>If you have any questions, our customer support team is available 24/7 to assist you.</p>
                    
                    <p>Best regards,<br><strong>Nyord Banking Team</strong></p>
                </div>
                <div class="footer">
                    <p style="margin: 0; font-size: 12px; color: #666;">
                        This is an automated email. Please do not reply to this email.<br>
                        © {{ current_year }} Nyord Banking. All rights reserved.<br>
                        📞 Support: 1-800-NYORD-BANK | 📧 support@nyordbank.com
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        template = Template(template_str)
        return template.render(
            user_name=user_name,
            status=status,
            services=services,
            current_year=datetime.now().year
        )
    
    async def send_otp_email(self, email: str, user_name: str, purpose: str = "email verification") -> tuple[bool, str]:
        """Send OTP email for verification"""
        try:
            # Validate email format
            if not self.validate_email_format(email):
                return False, "Invalid email format"
            
            # Check DNS for non-Gmail emails
            if not self.check_dns_mx_record(email):
                return False, "Invalid email domain"
            
            # Generate OTP
            otp = self.generate_otp()
            
            # Store OTP
            if not self.store_otp(email, otp, purpose):
                return False, "Failed to generate OTP"
            
            # Generate email content
            html_body = self.get_otp_email_template(user_name, otp, purpose)
            subject = f"🔐 Nyord Banking - Your OTP for {purpose}"
            
            # Send email
            success = await self.send_email_async(email, subject, html_body)
            
            if success:
                return True, "OTP sent successfully"
            else:
                return False, "Failed to send email"
                
        except Exception as e:
            logger.error(f"Error sending OTP email to {email}: {e}")
            return False, str(e)
    
    async def send_approval_email(self, email: str, user_name: str, status: str, services: List[str] = None) -> tuple[bool, str]:
        """Send account approval/rejection email"""
        try:
            # Generate email content
            html_body = self.get_approval_email_template(user_name, status, services)
            
            if status == 'approved':
                subject = "🎉 Welcome to Nyord Banking - Your Account is Approved!"
            else:
                subject = "📋 Nyord Banking - Account Application Update"
            
            # Send email
            success = await self.send_email_async(email, subject, html_body)
            
            if success:
                return True, "Approval email sent successfully"
            else:
                return False, "Failed to send approval email"
                
        except Exception as e:
            logger.error(f"Error sending approval email to {email}: {e}")
            return False, str(e)

# Create global email service instance
email_service = EmailService()