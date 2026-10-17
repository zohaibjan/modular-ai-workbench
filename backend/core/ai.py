"""
Shared OpenAI client wrapper.

Provides a singleton ``get_client()`` so every app reuses
the same ``openai.OpenAI`` instance + model name.
"""

import os
from openai import OpenAI

_client: OpenAI | None = None


def get_client() -> OpenAI:
    """Return a shared OpenAI client (created once, reused)."""
    global _client
    if _client is None:
        api_key = os.getenv("OPENAI_API_KEY")
        if not api_key:
            raise RuntimeError("OPENAI_API_KEY environment variable is not set")
        _client = OpenAI(api_key=api_key, timeout=120.0, max_retries=1)
    return _client


def get_model() -> str:
    """Return the configured model name (default ``gpt-4o-mini``)."""
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")
