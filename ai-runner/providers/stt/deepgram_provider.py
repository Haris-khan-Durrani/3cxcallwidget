from pipecat.services.deepgram import DeepgramSTTService

def get_stt_service(provider_config):
    # provider_config contains { "provider": "deepgram", "api_key": "..." }
    api_key = provider_config.get("api_key")
    if api_key:
        return DeepgramSTTService(api_key=api_key)
    raise ValueError("Missing Deepgram API Key in provider_config")
