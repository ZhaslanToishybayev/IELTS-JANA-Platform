"""Content discovery endpoints for IELTS test sets."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import TestSet
from ..routers.auth import get_current_user

router = APIRouter(prefix="/content", tags=["Content"])


@router.get("/tests")
async def list_tests(
    module: str | None = None,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    query = db.query(TestSet).filter(TestSet.approved == True)
    if module:
        query = query.filter(TestSet.module == module.upper())
    tests = query.order_by(TestSet.created_at.desc()).all()
    return {
        "tests": [
            {
                "id": item.id,
                "title": item.title,
                "module": item.module,
                "section": item.section,
                "estimated_band": item.estimated_band,
                "time_limit_minutes": item.time_limit_minutes,
                "question_count": len(item.questions),
            }
            for item in tests
        ]
    }
