"""Service for evaluating IELTS writing tasks using Google Gemini."""

import os
import json
import google.generativeai as genai
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

async def evaluate_essay_with_gemini(
    essay_text: str,
    task_type: str,  # "Task 1" or "Task 2"
    prompt_text: str
) -> Dict[str, Any]:
    """
    Evaluates an IELTS essay using Gemini 1.5 Flash.
    Returns structured feedback and band score.
    """
    if not api_key:
        return {
            "error": "Gemini API key not configured",
            "band_score": 0.0,
            "feedback": "AI evaluation is currently unavailable."
        }
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Construct the prompt
        system_prompt = f"""
        You are an expert IELTS examiner. Evaluate the following {task_type} essay.
        
        Prompt: "{prompt_text}"
        
        Essay: "{essay_text}"
        
        Provide a detailed evaluation in strictly valid JSON format with the following structure:
        {
            "band_score": <float between 0 and 9>,
            "task_response": {
                "score": <float>,
                "comment": "<string>"
            },
            "coherence_cohesion": {
                "score": <float>,
                "comment": "<string>"
            },
            "lexical_resource": {
                "score": <float>,
                "comment": "<string>"
            },
            "grammatical_range": {
                "score": <float>,
                "comment": "<string>"
            },
            "overall_feedback": "<string>",
            "improvements": ["<string>", "<string>", "<string>"],
            "annotated_errors": [
                {
                    "original_text": "<exact string from essay containing error>",
                    "correction": "<corrected version>",
                    "type": "<one of: Grammar, Vocabulary, Spelling, Coherence>",
                    "explanation": "<brief explanation>"
                }
            ]
        }
        """
        
        response = model.generate_content(system_prompt)
        text_response = response.text
        
        # Clean up code blocks if present
        if "```json" in text_response:
            text_response = text_response.replace("```json", "").replace("```", "")
            
        return json.loads(text_response)
        
    except Exception as e:
        print(f"Gemini evaluation error: {e}")
        return {
            "error": str(e),
            "band_score": 0.0,
            "feedback": "Failed to evaluate essay. Please try again."
        }
