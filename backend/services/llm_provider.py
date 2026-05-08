"""
LLM Provider 抽象层
支持 OpenAI / DeepSeek / 通义千问 / 智谱 等 OpenAI 兼容 API
"""
import os
from typing import AsyncIterator, Literal

from openai import AsyncOpenAI


ProviderType = Literal["openai", "deepseek", "qwen", "zhipu", "custom"]

PROVIDER_CONFIGS: dict[ProviderType, dict[str, str]] = {
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "default_model": "gpt-4o",
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com/v1",
        "api_key_env": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-chat",
    },
    "qwen": {
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
        "api_key_env": "QWEN_API_KEY",
        "default_model": "qwen-plus",
    },
    "zhipu": {
        "base_url": "https://open.bigmodel.cn/api/paas/v4",
        "api_key_env": "ZHIPU_API_KEY",
        "default_model": "glm-4-plus",
    },
    "custom": {
        "base_url": os.getenv("CUSTOM_LLM_BASE_URL", "http://localhost:11434/v1"),
        "api_key_env": "CUSTOM_LLM_API_KEY",
        "default_model": os.getenv("CUSTOM_LLM_MODEL", "llama3"),
    },
}


class LLMProvider:
    """LLM Provider with auto-configuration and streaming support."""

    def __init__(
        self,
        provider: ProviderType | None = None,
        api_key: str | None = None,
        base_url: str | None = None,
        model: str | None = None,
    ):
        # Auto-detect provider
        if provider is None:
            provider = self._detect_provider()

        config = PROVIDER_CONFIGS[provider]

        self.provider = provider
        self.api_key = api_key or os.getenv(config["api_key_env"], "")
        self.base_url = base_url or config["base_url"]
        self.model = model or config["default_model"]

        if not self.api_key:
            raise ValueError(
                f"No API key found for provider '{provider}'. "
                f"Set {config['api_key_env']} environment variable."
            )

        self.client = AsyncOpenAI(
            api_key=self.api_key,
            base_url=self.base_url,
        )

    @staticmethod
    def _detect_provider() -> ProviderType:
        """Auto-detect the AI provider from environment variables."""
        for provider, config in PROVIDER_CONFIGS.items():
            if provider == "custom":
                continue
            if os.getenv(config["api_key_env"]):
                return provider
        # Fallback to custom
        return "custom"

    async def chat(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> str:
        """Non-streaming chat completion."""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    async def chat_stream(
        self,
        messages: list[dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 2048,
    ) -> AsyncIterator[str]:
        """Streaming chat completion — yields tokens."""
        stream = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            stream=True,
        )
        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    @classmethod
    def from_env(cls, provider: ProviderType | None = None) -> "LLMProvider":
        """Create provider from environment variables."""
        return cls(provider=provider)
