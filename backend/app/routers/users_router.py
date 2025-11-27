from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import UserOut
from ..utils import get_current_user

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/search", response_model=list[UserOut])
def search_users(
    q: str = Query(..., min_length=1, description="Search query for username"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Search for users by username (case-insensitive partial match). Excludes current user."""
    users = db.query(User).filter(
        User.username.ilike(f"%{q}%"),
        User.id != current_user.id
    ).limit(10).all()
    
    return users
