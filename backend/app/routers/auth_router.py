from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..schemas import UserCreate, UserLogin, UserOut
from ..auth import register_user, login_user
from ..database import get_db
from ..utils import get_current_user
from .. import models

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = register_user(user, db)
    token_data = login_user(UserLogin(username=user.username, password=user.password), db)
    return token_data

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user, db)

@router.get("/me", response_model=UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user