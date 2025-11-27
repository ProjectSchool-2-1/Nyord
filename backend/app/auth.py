from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
from . import models, utils
from .database import get_db

# Testing endpoints:
#  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxLCJleHAiOjE3NjM3MjIxNDB9.hp892mtm3CAo3yT9LYc7benh5Pkpw0jgV749mcJYCyA

def register_user(user_data, db: Session):
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    existing_email = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw = utils.hash_password(user_data.password)

    new_user = models.User(
        username=user_data.username,
        email=user_data.email,
        hashed_password=hashed_pw,
        full_name=user_data.full_name,
        phone=user_data.phone,
        date_of_birth=user_data.date_of_birth,
        address=user_data.address,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def login_user(user_data, db: Session):
    user = db.query(models.User).filter(models.User.username == user_data.username).first()

    if not user or not utils.verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    token = utils.create_access_token({"user_id": user.id})
    return {
        "access_token": token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "phone": user.phone,
            "date_of_birth": str(user.date_of_birth) if user.date_of_birth else None,
            "address": user.address
        }
    }