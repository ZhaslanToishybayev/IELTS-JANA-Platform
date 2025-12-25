"""Password validation utilities."""

import re
from typing import Tuple


class PasswordValidationError(Exception):
    """Exception raised when password validation fails."""
    pass


def validate_password(password: str) -> Tuple[bool, str]:
    """
    Validate password meets security requirements.
    
    Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character (optional but recommended)
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long"
    
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter"
    
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter"
    
    if not re.search(r'\d', password):
        return False, "Password must contain at least one digit"
    
    # Optional: special character check (warning only)
    # if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
    #     return True, "Consider adding special characters for stronger security"
    
    return True, "Password is valid"


def get_password_strength(password: str) -> int:
    """
    Calculate password strength score (0-100).
    
    Returns:
        Integer score from 0 to 100
    """
    score = 0
    
    # Length scoring
    if len(password) >= 8:
        score += 20
    if len(password) >= 12:
        score += 10
    if len(password) >= 16:
        score += 10
    
    # Character variety
    if re.search(r'[a-z]', password):
        score += 15
    if re.search(r'[A-Z]', password):
        score += 15
    if re.search(r'\d', password):
        score += 15
    if re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        score += 15
    
    return min(score, 100)
