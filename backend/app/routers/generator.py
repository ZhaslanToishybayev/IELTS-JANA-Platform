
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, HttpUrl
from app.services.content_generator import generator
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/generator",
    tags=["Generator"]
)

class UrlRequest(BaseModel):
    url: HttpUrl
    difficulty: int = 5

@router.post("/reading")
async def generate_reading_test(request: UrlRequest, current_user: dict = Depends(get_current_user)):
    """
    Scrapes the URL and generates an IELTS Reading test.
    """
    try:
        # 1. Fetch content
        content = generator.fetch_article_content(str(request.url))
        if len(content) < 500:
            raise HTTPException(status_code=400, detail="Article text is too short. Try a different URL.")
            
        # 2. Generate questions
        result = await generator.generate_questions_from_text(content, request.difficulty)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
            
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
