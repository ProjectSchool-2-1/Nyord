from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from ..database import get_db
from .. import models, schemas
from ..email_service import send_otp_task, verify_otp, send_welcome_email_task
import re

router = APIRouter(prefix="/email", tags=["email"])

class OTPRequest(BaseModel):
    email: EmailStr

class OTPVerifyRequest(BaseModel):
    email: EmailStr
    otp: str

class EmailResponse(BaseModel):
    message: str
    status: str

def is_valid_email(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

@router.post("/send-otp", response_model=EmailResponse)
async def send_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Send OTP to email for verification"""
    try:
        # Validate email format
        if not is_valid_email(request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if email already exists and is verified
        existing_user = db.query(models.User).filter(models.User.email == request.email).first()
        if existing_user and getattr(existing_user, 'email_verified', True):
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Send OTP via Celery task
        task = send_otp_task.delay(request.email)
        
        return EmailResponse(
            message=f"OTP sent to {request.email}. Please check your inbox.",
            status="success"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP: {str(e)}")

@router.post("/verify-otp", response_model=EmailResponse)
async def verify_otp_endpoint(request: OTPVerifyRequest, db: Session = Depends(get_db)):
    """Verify OTP for email verification"""
    try:
        # Validate email format
        if not is_valid_email(request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Verify OTP
        if not verify_otp(request.email, request.otp):
            raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
        # Find user and mark email as verified
        user = db.query(models.User).filter(models.User.email == request.email).first()
        if user:
            # Mark email as verified if field exists
            if hasattr(user, 'email_verified'):
                user.email_verified = True
                db.commit()
                
                # Send welcome email
                send_welcome_email_task.delay(user.email, user.username)
        
        return EmailResponse(
            message="Email verified successfully!",
            status="success"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to verify OTP: {str(e)}")

@router.post("/resend-otp", response_model=EmailResponse)
async def resend_otp(request: OTPRequest, db: Session = Depends(get_db)):
    """Resend OTP to email"""
    try:
        # Validate email format
        if not is_valid_email(request.email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        # Check if user exists
        user = db.query(models.User).filter(models.User.email == request.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Email not found")
        
        # Check if already verified
        if getattr(user, 'email_verified', True):
            raise HTTPException(status_code=400, detail="Email already verified")
        
        # Send OTP via Celery task
        task = send_otp_task.delay(request.email)
        
        return EmailResponse(
            message=f"OTP resent to {request.email}. Please check your inbox.",
            status="success"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to resend OTP: {str(e)}")

@router.get("/status/{email}")
async def get_email_verification_status(email: str, db: Session = Depends(get_db)):
    """Get email verification status"""
    try:
        if not is_valid_email(email):
            raise HTTPException(status_code=400, detail="Invalid email format")
        
        user = db.query(models.User).filter(models.User.email == email).first()
        if not user:
            return {"email": email, "verified": False, "user_exists": False}
        
        verified = getattr(user, 'email_verified', True)  # Default to True if field doesn't exist
        return {"email": email, "verified": verified, "user_exists": True}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check status: {str(e)}")