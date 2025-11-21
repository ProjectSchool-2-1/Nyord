from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from fastapi import Header, HTTPException
from ..database import get_db
from .. import models, schemas
import os

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = os.getenv("JWT_ALGORITHM")

router = APIRouter(prefix="/accounts", tags=["Accounts"])

def get_user_id(token: str = Header(None)):
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("user_id")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/create", response_model=schemas.AccountOut)
def create_account(account: schemas.AccountCreate, db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    import random
    acc_num = f"ACCT{random.randint(10000000, 99999999)}"

    new_acc = models.Account(
        account_number=acc_num,
        balance=account.initial_balance,
        user_id=user_id
    )

    db.add(new_acc)
    db.commit()
    db.refresh(new_acc)

    return new_acc


@router.get("/me", response_model=list[schemas.AccountOut])
def get_my_accounts(db: Session = Depends(get_db), user_id: int = Depends(get_user_id)):
    return db.query(models.Account).filter(models.Account.user_id == user_id).all()