from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..schemas import UserCreate, UserLogin, Token
from ..auth import register_user, login_user
from ..database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    new_user = register_user(user, db)
    token = login_user(UserLogin(username=user.username, password=user.password), db)
    return token

@router.post("/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    return login_user(user, db)