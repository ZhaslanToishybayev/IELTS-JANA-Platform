"""Service for evaluating IELTS speaking audio using Google Gemini Multimodal."""

import os
import json
import google.generativeai as genai
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)

async def analyze_audio_with_gemini(
    audio_path: str,
    prompt_text: str
) -> Dict[str, Any]:
    """
    Evaluates IELTS speaking audio using Gemini 1.5 Flash.
    """
    if not api_key:
        return {
            "error": "Gemini API key not configured",
            "band_score": 0.0,
            "feedback": "AI evaluation is currently unavailable."
        }
        
    try:
        # Upload the audio file to Gemini
        # Note: In production, consider cleanup logic for these files on Google's side
        audio_file = genai.upload_file(path=audio_path)
        
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        system_prompt = f"""
        You are an expert IELTS Speaking examiner. Listen to the user's response to this prompt: "{prompt_text}".
        
        Evaluate the user's speaking performance based on:
        1. Fluency and Coherence
        2. Lexical Resource (Vocabulary)
        3. Grammatical Range and Accuracy
        4. Pronunciation
        
        Provide the output in strictly valid JSON format:
        {
            "band_score": <float>,
            "transcription": "<full verbatim transcription of user speech>",
            "fluency_coherence": { "score": <float>, "comment": "<string>" },
            "lexical_resource": { "score": <float>, "comment": "<string>" },
            "grammatical_range": { "score": <float>, "comment": "<string>" },
            "pronunciation": { "score": <float>, "comment": "<string>" },
            "overall_feedback": "<string>",
            "improvements": ["<string>", "<string>"],
            "annotated_errors": [
                {
                    "original_text": "<phrase from transcription>",
                    "correction": "<corrected version>",
                    "type": "<Grammar|Vocabulary|Pronunciation>",
                    "explanation": "<brief explanation>"
                }
            ]
        }
        """
        
        response = model.generate_content([system_prompt, audio_file])
        text_response = response.text
        
        # Clean up code blocks
        if "```json" in text_response:
            text_response = text_response.replace("```json", "").replace("```", "")
            
        return json.loads(text_response)
        
    except Exception as e:
        print(f"Gemini speaking evaluation error: {e}")
        return {
            "error": str(e),
            "band_score": 0.0,
            "feedback": "Failed to analyze audio."
        }
