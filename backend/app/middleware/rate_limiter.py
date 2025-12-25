"""Rate limiting middleware using slowapi."""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request


def get_user_identifier(request: Request) -> str:
    """Get identifier for rate limiting - use user ID if authenticated, else IP."""
    # Try to get user from request state (set by auth middleware)
    if hasattr(request.state, 'user') and request.state.user:
        return f"user:{request.state.user.id}"
    # Fall back to IP address
    return get_remote_address(request)


# Create limiter instance
limiter = Limiter(
    key_func=get_user_identifier,
    default_limits=["200/minute"],  # Default limit for all endpoints
    storage_uri="memory://",  # Use in-memory storage, can switch to Redis
)

# Rate limit decorators for specific routes
# Usage: @limiter.limit("5/minute")

# Define common rate limits
AUTH_LIMIT = "10/minute"  # Strict limit for auth endpoints
API_LIMIT = "100/minute"  # Normal limit for API endpoints
HEAVY_LIMIT = "20/minute"  # Limit for heavy operations (AI, etc.)


def setup_rate_limiter(app):
    """Configure rate limiter for FastAPI app."""
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    app.add_middleware(SlowAPIMiddleware)
