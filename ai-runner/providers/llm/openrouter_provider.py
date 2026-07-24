from pipecat.services.openai import OpenAILLMService

def get_llm_service(provider_config, model="google/gemini-2-flash"):
    # We use Pipecat's OpenAI service but point the base_url to OpenRouter
    api_key = provider_config.get("api_key")
    if api_key:
        return OpenAILLMService(
            api_key=api_key,
            base_url="https://openrouter.ai/api/v1",
            model=model
        )
    raise ValueError("Missing OpenRouter API Key in provider_config")
