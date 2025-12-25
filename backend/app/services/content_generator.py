
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import os
import json
from typing import List, Dict, Any

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

class ContentGenerator:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    def fetch_article_content(self, url: str) -> str:
        """
        Fetches and cleans text content from a given URL.
        """
        try:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove scripts and styles
            for script in soup(["script", "style", "nav", "footer", "header", "aside"]):
                script.decompose()
                
            # Get text
            text = soup.get_text()
            
            # Clean text (remove excessive whitespace)
            lines = (line.strip() for line in text.splitlines())
            chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
            clean_text = '\n'.join(chunk for chunk in chunks if chunk)
            
            # Limit length to avoid token limits (approx 2000 words is safe for standard IELTS reading)
            return clean_text[:10000] 
            
        except Exception as e:
            raise Exception(f"Failed to fetch content: {str(e)}")

    async def generate_questions_from_text(self, text: str, difficulty: int = 5) -> Dict[str, Any]:
        """
        Generates IELTS reading questions based on the provided text.
        """
        prompt = f"""
        You are an expert IELTS Reading test creator. 
        Create a reading test based on the following text.
        The text is:
        "{text[:8000]}..."
        
        Generate 3 different types of questions (Total 5-8 questions):
        1. True/False/Not Given (3 questions)
        2. Multiple Choice (2 questions)
        3. Fill in the Blanks (Summary Completion) (2-3 questions)
        
        The difficulty level should be {difficulty}/10 (1=Beginner, 10=Band 9).
        
        Output strictly valid JSON with this structure:
        {{
            "title": "Suggested Title for Passage",
            "summary": "Brief summary of the text",
            "questions": [
                {{
                    "question_text": "Question text here",
                    "question_type": "TFNG" (or "MCQ" or "FILL_BLANK"),
                    "options": ["True", "False", "Not Given"] (or ["A", "B", "C", "D"] or null),
                    "correct_answer": "Answer",
                    "explanation": "Why this is correct, quoting the text"
                }}
            ]
        }}
        """
        
        try:
            response = self.model.generate_content(prompt)
            text_resp = response.text
            if "```json" in text_resp:
                text_resp = text_resp.replace("```json", "").replace("```", "")
            return json.loads(text_resp)
        except Exception as e:
            return {"error": str(e)}

generator = ContentGenerator()
