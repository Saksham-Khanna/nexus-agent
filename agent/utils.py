from urllib.parse import urlparse

# Groq model routing: cheap/fast model for simple tasks,
# powerful model for generation-heavy tasks.
MODEL_FAST = "openai/gpt-oss-20b"
MODEL_POWERFUL = "openai/gpt-oss-120b"


def extract_domain(url: str) -> str:
    """Extract clean domain from URL."""
    try:
        parsed = urlparse(url)
        return parsed.netloc.replace("www.", "")
    except Exception:
        return ""
