from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, date
from ..database import get_db
from ..models import FixedDeposit, User
from ..schemas import FixedDepositCreate, FixedDepositOut
from ..utils import get_current_user

ALLOWED_RATES = {7.0, 8.0, 9.0, 10.0}

router = APIRouter(prefix="/fixed-deposits", tags=["FixedDeposits"])


def _add_months(source_date: date, months: int) -> date:
    # safe month add
    month = source_date.month - 1 + months
    year = source_date.year + month // 12
    month = month % 12 + 1
    # days per month
    mdays = [31, 29 if (year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)) else 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    day = min(source_date.day, mdays[month - 1])
    return date(year, month, day)


@router.get("/me", response_model=list[FixedDepositOut])
def list_my_fds(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """List fixed deposits for current user"""
    fds = db.query(FixedDeposit).filter(FixedDeposit.user_id == current_user.id).all()
    return fds


@router.post("/", response_model=FixedDepositOut, status_code=status.HTTP_201_CREATED)
def create_fd(fd_in: FixedDepositCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Create a new fixed deposit for the authenticated user"""
    if fd_in.rate not in ALLOWED_RATES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid rate. Allowed rates: 7, 8, 9, 10")
    if fd_in.tenure_months <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenure must be positive months")
    if fd_in.principal <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Principal must be positive")

    start = fd_in.start_date
    maturity = _add_months(start, fd_in.tenure_months)
    years = fd_in.tenure_months / 12
    maturity_amount = round(fd_in.principal * ((1 + fd_in.rate / 100) ** years), 2)
    fd_number = f"FD{int(datetime.utcnow().timestamp())}{current_user.id}"

    fd = FixedDeposit(
        fd_number=fd_number,
        user_id=current_user.id,
        principal=fd_in.principal,
        rate=fd_in.rate,
        start_date=start,
        maturity_date=maturity,
        tenure_months=fd_in.tenure_months,
        maturity_amount=maturity_amount,
        status="ACTIVE",
    )
    db.add(fd)
    db.commit()
    db.refresh(fd)
    return fd


@router.post("/{fd_id}/renew", response_model=FixedDepositOut, status_code=status.HTTP_201_CREATED)
def renew_fd(
    fd_id: int,
    principal: float,
    tenure_months: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Renew an existing active fixed deposit. Creates a new FD with same rate; marks old as RENEWED."""
    if principal <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Principal must be positive")
    if tenure_months <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Tenure must be positive months")

    old_fd = db.query(FixedDeposit).filter(FixedDeposit.id == fd_id, FixedDeposit.user_id == current_user.id).first()
    if not old_fd:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fixed deposit not found")
    if old_fd.status != "ACTIVE":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only ACTIVE deposits can be renewed")

    # Mark old as renewed
    old_fd.status = "RENEWED"

    start = date.today()
    maturity = _add_months(start, tenure_months)
    years = tenure_months / 12
    maturity_amount = round(principal * ((1 + old_fd.rate / 100) ** years), 2)
    fd_number = f"FD{int(datetime.utcnow().timestamp())}{current_user.id}"

    new_fd = FixedDeposit(
        fd_number=fd_number,
        user_id=current_user.id,
        principal=principal,
        rate=old_fd.rate,  # keep same rate
        start_date=start,
        maturity_date=maturity,
        tenure_months=tenure_months,
        maturity_amount=maturity_amount,
        status="ACTIVE",
    )
    db.add(new_fd)
    db.commit()
    db.refresh(new_fd)
    return new_fd
