"""Today's Plan API router."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..routers.auth import get_current_user
from ..schemas import TodayPlanResponse
from ..services.today_plan import get_today_plan

router = APIRouter(prefix="/plan", tags=["Plan"])


@router.get("/today", response_model=TodayPlanResponse)
async def get_today_ielts_plan(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get the authenticated user's lightweight daily IELTS plan."""
    try:
        return get_today_plan(db, current_user.id)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to build today's plan",
        ) from exc
