from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional
from ..database import get_db
from ..models import User
from ..utils import get_current_user
from ..email_service import email_service
import asyncio

router = APIRouter(prefix="/email", tags=["Email"])

class OTPRequest(BaseModel):
    email: EmailStr
    purpose: str = "email_verification"

class OTPVerification(BaseModel):
    email: EmailStr
    otp: str
    purpose: str = "email_verification"

class EmailValidation(BaseModel):
    email: EmailStr

@router.post("/send-otp")
async def send_otp(
    request: OTPRequest,
    db: Session = Depends(get_db)
):
    """Send OTP for email verification"""
    try:
        # Check if email already exists (for registration)
        if request.purpose == "email_verification":
            existing_user = db.query(User).filter(User.email == request.email).first()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
        
        # Get user name if available
        user_name = "User"
        if request.purpose != "email_verification":
            user = db.query(User).filter(User.email == request.email).first()
            if user:
                user_name = user.full_name or user.username
        
        # Send OTP email
        success, message = await email_service.send_otp_email(
            email=request.email,
            user_name=user_name,
            purpose=request.purpose
        )
        
        if success:
            return {
                "success": True,
                "message": "OTP sent successfully to your email",
                "email": request.email
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=message
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send OTP: {str(e)}"
        )

@router.post("/verify-otp")
async def verify_otp(
    request: OTPVerification,
    db: Session = Depends(get_db)
):
    """Verify OTP for email verification"""
    try:
        # Verify OTP
        is_valid = email_service.verify_otp(
            email=request.email,
            otp=request.otp,
            purpose=request.purpose
        )
        
        if is_valid:
            return {
                "success": True,
                "message": "OTP verified successfully",
                "email": request.email
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify OTP: {str(e)}"
        )

@router.post("/validate-email")
async def validate_email(
    request: EmailValidation
):
    """Validate email format and domain"""
    try:
        # Validate email format
        if not email_service.validate_email_format(request.email):
            return {
                "valid": False,
                "message": "Invalid email format"
            }
        
        # Check DNS for non-Gmail emails
        if not email_service.check_dns_mx_record(request.email):
            return {
                "valid": False,
                "message": "Invalid email domain or no MX record found"
            }
        
        return {
            "valid": True,
            "message": "Email is valid"
        }
        
    except Exception as e:
        return {
            "valid": False,
            "message": f"Email validation failed: {str(e)}"
        }

@router.post("/send-approval-notification")
async def send_approval_notification(
    user_id: int,
    status: str,
    services: Optional[list] = None,
    admin_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Send approval/rejection notification email (Admin only)"""
    try:
        # Check if user is admin
        if admin_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Get user details
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Send approval email
        success, message = await email_service.send_approval_email(
            email=user.email,
            user_name=user.full_name or user.username,
            status=status,
            services=services or []
        )
        
        if success:
            return {
                "success": True,
                "message": f"Approval notification sent to {user.email}",
                "user_id": user_id,
                "status": status
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=message
            )
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send approval notification: {str(e)}"
        )

@router.get("/test-email")
async def test_email_service(
    admin_user: User = Depends(get_current_user)
):
    """Test email service configuration (Admin only)"""
    try:
        if admin_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        # Test email sending
        test_html = """
        <h1>Test Email</h1>
        <p>This is a test email from Nyord Banking email service.</p>
        <p>If you receive this, the email configuration is working correctly!</p>
        """
        
        success = await email_service.send_email_async(
            to_email=admin_user.email,
            subject="🧪 Nyord Banking - Email Service Test",
            html_body=test_html
        )
        
        return {
            "success": success,
            "message": "Test email sent" if success else "Failed to send test email",
            "email_config": {
                "smtp_host": email_service.smtp_host,
                "smtp_port": email_service.smtp_port,
                "from_email": email_service.from_email
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Email test failed: {str(e)}"
        )